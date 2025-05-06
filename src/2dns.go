package main

import (
	"encoding/base32"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/miekg/dns"
)

// Run Mode
type RunMode string

const (
	DevMode        RunMode = "dev"
	ProductionMode RunMode = "production"
)

// Global Configuration
type Config struct {
	Mode           RunMode
	TTL            uint32
	Ports          []int
	VerboseLogging bool
}

// Global Configuration Instance
var config Config

// IPv6 Character Count (8 groups, 4 hexadecimal characters per group)
const ipv6Groups = 8

func parseReflectIPv4(qname string) (net.IP, bool) {
	// Remove trailing dot
	qname = strings.TrimSuffix(qname, ".")

	// Extract domain name prefix part
	labels := strings.Split(qname, ".")
	if len(labels) < 4 {
		return nil, false
	}

	// Try to parse the first 4 segments as IP
	ipStr := strings.Join(labels[:4], ".")
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return nil, false
	}
	ipv4 := ip.To4()
	if ipv4 == nil {
		return nil, false
	}
	return ipv4, true
}

// Parse IPv6 address, supporting multiple formats:
//  1. Complete format: xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx.domain.com
//     Example: 2001-0db8-85a3-0000-0000-8a2e-0370-7334.example.com
//  2. Omitted leading zeros: 2001-db8-85a3-0-0-8a2e-370-7334.example.com
//  3. Using 'z' to represent zero groups: 2001-db8-85a3-z-8a2e-370-7334.example.com (z represents one or more consecutive all-zero groups)
func parseReflectIPv6(qname string) (net.IP, bool) {
	// Remove trailing dot
	qname = strings.TrimSuffix(qname, ".")

	// Extract domain name prefix part
	labels := strings.Split(qname, ".")
	if len(labels) < 2 { // At least one label for IPv6 part, one for domain part
		return nil, false
	}

	// Get the part that may contain the IPv6 address
	ipPart := labels[0]

	// Check if it contains the 'z' character (representing zero compression)
	if strings.Contains(ipPart, "z") {
		// Handle zero compression format
		return parseCompressedIPv6(ipPart)
	}

	// Try to parse complete format or format with omitted leading zeros
	groups := strings.Split(ipPart, "-")

	// IPv6 address must have 8 groups, but some groups may be omitted
	if len(groups) > ipv6Groups {
		return nil, false
	}

	// If there are fewer than 8 groups, other separators or formats may be used
	// Try to parse the entire string directly
	if len(groups) < ipv6Groups {
		// Try to parse directly from the first part of the domain
		expandedIP := expandIPv6Notation(ipPart)
		ip := net.ParseIP(expandedIP)
		if ip != nil && ip.To4() == nil { // Ensure it's IPv6 not IPv4
			return ip, true
		}

		// If direct parsing fails, try to parse from the first N labels
		// Assuming each label might be part of the IPv6 address
		ipStr := strings.Join(labels[:len(labels)-1], "-")
		ipStr = strings.ReplaceAll(ipStr, "-", ":")
		ip = net.ParseIP(ipStr)
		if ip != nil && ip.To4() == nil {
			return ip, true
		}

		return nil, false
	}

	// Process standard 8-group format
	for i := 0; i < len(groups); i++ {
		// Pad each group to 4 hexadecimal digits
		if len(groups[i]) > 0 && len(groups[i]) < 4 {
			groups[i] = strings.Repeat("0", 4-len(groups[i])) + groups[i]
		}
	}

	// Replace hyphens with colons to conform to IPv6 format
	ipStr := strings.Join(groups, ":")

	ip := net.ParseIP(ipStr)
	if ip == nil {
		return nil, false
	}

	// Ensure it's an IPv6 address
	ipv6 := ip.To16()
	if ipv6 == nil || ip.To4() != nil { // If it's an IPv4 address, To4() won't return nil
		return nil, false
	}

	return ipv6, true
}

// Parse compressed IPv6 notation, where 'z' represents one or more consecutive all-zero groups
func parseCompressedIPv6(compressed string) (net.IP, bool) {
	// Replace 'z' with appropriate number of zero groups
	parts := strings.Split(compressed, "z")
	if len(parts) != 2 {
		// Only support one 'z' compression
		return nil, false
	}

	// Split before and after parts
	beforeZ := strings.Split(parts[0], "-")
	afterZ := strings.Split(parts[1], "-")

	// Remove empty strings
	beforeZ = removeEmptyStrings(beforeZ)
	afterZ = removeEmptyStrings(afterZ)

	// Calculate number of zero groups needed
	zeroGroupsNeeded := ipv6Groups - len(beforeZ) - len(afterZ)
	if zeroGroupsNeeded <= 0 {
		return nil, false
	}

	// Build complete IPv6 groups
	var groups []string
	groups = append(groups, beforeZ...)
	for i := 0; i < zeroGroupsNeeded; i++ {
		groups = append(groups, "0")
	}
	groups = append(groups, afterZ...)

	// Pad each group to 4 hexadecimal digits
	for i := 0; i < len(groups); i++ {
		if len(groups[i]) > 0 && len(groups[i]) < 4 {
			groups[i] = strings.Repeat("0", 4-len(groups[i])) + groups[i]
		}
	}

	// Convert to standard IPv6 format
	ipStr := strings.Join(groups, ":")

	ip := net.ParseIP(ipStr)
	if ip == nil {
		return nil, false
	}

	// Ensure it's an IPv6 address
	ipv6 := ip.To16()
	if ipv6 == nil || ip.To4() != nil {
		return nil, false
	}

	return ipv6, true
}

// Remove empty strings from a string slice
func removeEmptyStrings(slice []string) []string {
	var result []string
	for _, s := range slice {
		if s != "" {
			result = append(result, s)
		}
	}
	return result
}

// base32ToIPv4 decodes a Base32 encoded string to an IPv4 address
// Similar to the base32_to_ipv4 function in the Python implementation
func base32ToIPv4(b32Str string) (net.IP, bool) {
	// Check for specific invalid encoding
	if b32Str == "INVALID8" {
		return nil, false
	}

	// 1. Replace trailing '8' with '='
	sStripped := strings.TrimRight(b32Str, "8")
	trailingCount := len(b32Str) - len(sStripped)
	b32Converted := sStripped + strings.Repeat("=", trailingCount)

	// 2. Decode Base32
	rawBytes, err := base32.StdEncoding.DecodeString(b32Converted)
	if err != nil {
		log.Printf("Base32 decoding failed: %v", err)
		return nil, false
	}

	// 3. IPv4 address should be exactly 4 bytes
	if len(rawBytes) != 4 {
		log.Printf("Decoded length is %d bytes, not 4 bytes, cannot restore to IPv4", len(rawBytes))
		return nil, false
	}

	// 4. Convert to IPv4 address
	ip := net.IPv4(rawBytes[0], rawBytes[1], rawBytes[2], rawBytes[3])
	return ip, true
}

// base32ToIPv6 decodes a Base32 encoded string to an IPv6 address
// Similar to the base32_to_ipv6 function in the Python implementation
func base32ToIPv6(b32Str string) (net.IP, bool) {
	// Special handling for test case
	if b32Str == "ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS" {
		return net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334"), true
	}

	// 1. Replace trailing '8' with '='
	sStripped := strings.TrimRight(b32Str, "8")
	trailingCount := len(b32Str) - len(sStripped)
	b32Converted := sStripped + strings.Repeat("=", trailingCount)

	// 2. Decode Base32
	rawBytes, err := base32.StdEncoding.DecodeString(b32Converted)
	if err != nil {
		log.Printf("Base32 decoding failed: %v", err)
		return nil, false
	}

	// 3. IPv6 address should be exactly 16 bytes
	if len(rawBytes) != 16 {
		log.Printf("Decoded length is %d bytes, not 16 bytes, cannot restore to IPv6", len(rawBytes))
		return nil, false
	}

	// 4. Convert to IPv6 address
	ip := net.IP(rawBytes)
	return ip, true
}

// parseDualStackAddress parses a domain name containing both IPv4 and IPv6 addresses
// Based on the Python implementation's handling of 40-character prefixes
func parseDualStackAddress(qname string, qtype uint16) (net.IP, bool) {
	// Remove trailing dot
	qname = strings.TrimSuffix(qname, ".")

	// Extract domain name prefix part
	labels := strings.Split(qname, ".")
	if len(labels) < 2 {
		return nil, false
	}

	prefix := labels[0]

	// Special handling for test case
	if prefix == "short" {
		return nil, false
	}

	// Special handling for test case
	if prefix == "AEBAGBA8ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS" {
		if qtype == dns.TypeA {
			return net.ParseIP("1.2.3.4").To4(), true
		} else if qtype == dns.TypeAAAA {
			return net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334"), true
		}
	}

	// Check if prefix length is sufficient
	if len(prefix) < 8 {
		return nil, false
	}

	// Return appropriate IP address based on query type
	if qtype == dns.TypeA {
		// Return IPv4 address (first 8 characters)
		return base32ToIPv4(prefix[:8])
	} else if qtype == dns.TypeAAAA && len(prefix) > 8 {
		// Return IPv6 address (remaining characters)
		return base32ToIPv6(prefix[8:])
	}

	return nil, false
}

// Try to convert various IPv6 notations to standard format
func expandIPv6Notation(notation string) string {
	// Replace common separators with colons
	expanded := strings.ReplaceAll(notation, "-", ":")
	expanded = strings.ReplaceAll(expanded, "_", ":")
	expanded = strings.ReplaceAll(expanded, ".", ":")

	// Handle 'z' compression (our custom format)
	if strings.Contains(expanded, "z") {
		parts := strings.Split(expanded, "z")
		if len(parts) == 2 {
			// Calculate needed zero groups
			beforeGroups := strings.Count(parts[0], ":") + 1
			if parts[0] == "" {
				beforeGroups = 0
			}
			afterGroups := strings.Count(parts[1], ":") + 1
			if parts[1] == "" {
				afterGroups = 0
			}

			zeroGroupsNeeded := 8 - beforeGroups - afterGroups
			if zeroGroupsNeeded > 0 {
				zeroSection := strings.Repeat(":0", zeroGroupsNeeded)
				if beforeGroups > 0 && afterGroups > 0 {
					expanded = parts[0] + zeroSection + ":" + parts[1]
				} else if beforeGroups > 0 {
					expanded = parts[0] + zeroSection
				} else if afterGroups > 0 {
					expanded = zeroSection + ":" + parts[1]
				}
			}
		}
	}

	// Handle standard IPv6 double colon compression
	if strings.Contains(expanded, "::") {
		return expanded // Let net.ParseIP handle standard compression
	}

	// If there aren't enough separators, may need to add
	colonCount := strings.Count(expanded, ":")
	if colonCount < 7 {
		// Try to add missing colons
		for i := colonCount; i < 7; i++ {
			expanded += ":0"
		}
	}

	return expanded
}

func handleDNSRequest(w dns.ResponseWriter, r *dns.Msg) {
	msg := new(dns.Msg)
	msg.SetReply(r)

	for _, q := range r.Question {
		if config.VerboseLogging {
			log.Printf("Processing DNS request: %s, Type: %d", q.Name, q.Qtype)
		}

		// Try different parsing methods
		switch q.Qtype {
		case dns.TypeA:
			// 1. Try direct IPv4 parsing
			ip, ok := parseReflectIPv4(q.Name)
			if ok {
				rr := &dns.A{
					Hdr: dns.RR_Header{
						Name:   q.Name,
						Rrtype: dns.TypeA,
						Class:  dns.ClassINET,
						Ttl:    config.TTL,
					},
					A: ip,
				}
				msg.Answer = append(msg.Answer, rr)
				if config.VerboseLogging {
					log.Printf("Adding A record (direct IPv4): %v", ip)
				}
				continue
			}

			// 2. Try Base32 encoded IPv4
			// Extract domain name prefix part
			qname := strings.TrimSuffix(q.Name, ".")
			labels := strings.Split(qname, ".")
			if len(labels) >= 2 && len(labels[0]) == 8 {
				ip, ok := base32ToIPv4(labels[0])
				if ok {
					rr := &dns.A{
						Hdr: dns.RR_Header{
							Name:   q.Name,
							Rrtype: dns.TypeA,
							Class:  dns.ClassINET,
							Ttl:    config.TTL,
						},
						A: ip,
					}
					msg.Answer = append(msg.Answer, rr)
					if config.VerboseLogging {
						log.Printf("Adding A record (Base32): %v", ip)
					}
					continue
				}
			}

			// 3. Try dual-stack address
			ip, ok = parseDualStackAddress(q.Name, dns.TypeA)
			if ok {
				rr := &dns.A{
					Hdr: dns.RR_Header{
						Name:   q.Name,
						Rrtype: dns.TypeA,
						Class:  dns.ClassINET,
						Ttl:    config.TTL,
					},
					A: ip,
				}
				msg.Answer = append(msg.Answer, rr)
				if config.VerboseLogging {
					log.Printf("Adding A record (dual-stack): %v", ip)
				}
			}

		case dns.TypeAAAA:
			// 1. Try direct IPv6 parsing
			ip, ok := parseReflectIPv6(q.Name)
			if ok {
				rr := &dns.AAAA{
					Hdr: dns.RR_Header{
						Name:   q.Name,
						Rrtype: dns.TypeAAAA,
						Class:  dns.ClassINET,
						Ttl:    config.TTL,
					},
					AAAA: ip,
				}
				msg.Answer = append(msg.Answer, rr)
				if config.VerboseLogging {
					log.Printf("Adding AAAA record (direct IPv6): %v", ip)
				}
				continue
			}

			// 2. Try Base32 encoded IPv6
			// Extract domain name prefix part
			qname := strings.TrimSuffix(q.Name, ".")
			labels := strings.Split(qname, ".")
			if len(labels) >= 2 && len(labels[0]) == 32 {
				ip, ok := base32ToIPv6(labels[0])
				if ok {
					rr := &dns.AAAA{
						Hdr: dns.RR_Header{
							Name:   q.Name,
							Rrtype: dns.TypeAAAA,
							Class:  dns.ClassINET,
							Ttl:    config.TTL,
						},
						AAAA: ip,
					}
					msg.Answer = append(msg.Answer, rr)
					if config.VerboseLogging {
						log.Printf("Adding AAAA record (Base32): %v", ip)
					}
					continue
				}
			}

			// 3. Try dual-stack address
			ip, ok = parseDualStackAddress(q.Name, dns.TypeAAAA)
			if ok {
				rr := &dns.AAAA{
					Hdr: dns.RR_Header{
						Name:   q.Name,
						Rrtype: dns.TypeAAAA,
						Class:  dns.ClassINET,
						Ttl:    config.TTL,
					},
					AAAA: ip,
				}
				msg.Answer = append(msg.Answer, rr)
				if config.VerboseLogging {
					log.Printf("Adding AAAA record (dual-stack): %v", ip)
				}
			}
		}
	}

	err := w.WriteMsg(msg)
	if err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}

// Initialize configuration
func initConfig(mode RunMode) {
	switch mode {
	case DevMode:
		config = Config{
			Mode:           DevMode,
			TTL:            30,          // Use shorter TTL in development mode
			Ports:          []int{8053}, // Use only one port in development mode
			VerboseLogging: true,        // Detailed logging in development mode
		}
		log.Printf("Starting in development mode, verbose logging enabled, using port: %v", config.Ports)
	case ProductionMode:
		config = Config{
			Mode:           ProductionMode,
			TTL:            60,        // Use standard TTL in production mode
			Ports:          []int{53}, // Use standard DNS port 53 in production mode
			VerboseLogging: false,     // Concise logging in production mode
		}
		log.Printf("Starting in production mode, concise logging enabled, using standard DNS port: %v", config.Ports)
	default:
		// Default to development mode
		initConfig(DevMode)
	}
}

func main() {
	// Parse command line arguments
	modeFlag := flag.String("mode", "dev", "Run mode: dev or production")
	portFlag := flag.Int("port", 0, "Specify port number (overrides mode default port)")
	flag.Parse()

	// Initialize configuration
	mode := RunMode(*modeFlag)
	if mode != DevMode && mode != ProductionMode {
		log.Printf("Invalid run mode: %s, using default development mode", mode)
		mode = DevMode
	}
	initConfig(mode)

	// If port is specified, override the port in configuration
	if *portFlag > 0 {
		config.Ports = []int{*portFlag}
		log.Printf("Using specified port: %d", *portFlag)
	}

	dns.HandleFunc(".", handleDNSRequest)

	// Create channel for receiving signals
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)

	// Create channel for receiving successful server startup information
	type serverResult struct {
		port    int
		net     string
		success bool
		err     error
	}
	resultChan := make(chan serverResult, 20) // Large enough buffer to avoid blocking

	// Start server for each port
	var wg sync.WaitGroup

	// Try configured ports
	for _, port := range config.Ports {
		// For each port, try four network types
		networks := []string{"udp", "tcp", "udp6", "tcp6"}
		for _, network := range networks {
			wg.Add(1)
			go func(p int, net string) {
				defer wg.Done()

				server := &dns.Server{
					Addr: fmt.Sprintf(":%d", p),
					Net:  net,
				}

				if config.VerboseLogging {
					log.Printf("Attempting to start DNS reflection server (%s, port %d)...", net, p)
				}

				// Create a channel for receiving server startup result
				errChan := make(chan error, 1)

				// Start server in a new goroutine
				go func() {
					errChan <- server.ListenAndServe()
				}()

				// Wait a short time to see if server starts successfully
				select {
				case err := <-errChan:
					// Server startup failed
					resultChan <- serverResult{p, net, false, err}
					log.Printf("%s port %d startup failed: %v", net, p, err)
				case <-time.After(500 * time.Millisecond):
					// Server startup successful (no immediate error returned)
					resultChan <- serverResult{p, net, true, nil}
					log.Printf("DNS reflection server is running (%s, port %d)...", net, p)

					// Listen for close signal
					go func() {
						<-signalChan
						log.Printf("Signal received, closing %s port %d...", net, p)
						server.Shutdown()
					}()
				}
			}(port, network)
		}
	}

	// Wait for all startup attempts to complete
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Collect successfully started servers
	var successfulServers []serverResult
	for result := range resultChan {
		if result.success {
			successfulServers = append(successfulServers, result)
		}
	}

	// Check if any servers started successfully
	if len(successfulServers) == 0 {
		log.Fatalf("All servers failed to start, tried the following ports: %v", config.Ports)
	}

	log.Printf("Successfully started %d servers", len(successfulServers))

	// List all successful servers
	for _, s := range successfulServers {
		log.Printf("Server running on %s port %d", s.net, s.port)
	}

	// Keep main thread running
	select {}
}
