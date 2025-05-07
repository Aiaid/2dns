package main

import (
	"encoding/base32"
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/miekg/dns"
)

// DNSRecord represents a record loaded from CSV
type DNSRecord struct {
	Name     string // Domain name (supports wildcards)
	Type     string // Record type: A, AAAA, TXT, CNAME, etc.
	Value    string // Record value
	TTL      uint32 // Time to live (0 means use default)
	Priority uint16 // For MX and SRV records
	Weight   uint16 // For SRV records
	Port     uint16 // For SRV records
}

// RecordStore holds all records loaded from CSV
type RecordStore struct {
	Records     map[string][]DNSRecord // Map domain name to records
	WildRecords map[string][]DNSRecord // Map wildcard domain to records
	mu          sync.RWMutex           // For thread safety
}

// Global variable to store records
var recordStore *RecordStore

// isValidRecordType checks if the given record type is supported
func isValidRecordType(recordType string) bool {
	validTypes := map[string]bool{
		"A":     true,
		"AAAA":  true,
		"CNAME": true,
		"MX":    true,
		"NS":    true,
		"PTR":   true,
		"SOA":   true,
		"SRV":   true,
		"TXT":   true,
		"CAA":   true,
	}
	return validTypes[recordType]
}

// loadRecordsFromCSV loads DNS records from a CSV file
func loadRecordsFromCSV(filePath string) (*RecordStore, error) {
	store := &RecordStore{
		Records:     make(map[string][]DNSRecord),
		WildRecords: make(map[string][]DNSRecord),
	}

	// Open and parse CSV file
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV file: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	// Allow variable number of fields per record
	reader.FieldsPerRecord = -1

	// Read and skip header
	if _, err := reader.Read(); err != nil {
		return nil, fmt.Errorf("failed to read CSV header: %v", err)
	}

	// Read records
	lineNum := 1
	for {
		lineNum++
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("error reading CSV line %d: %v", lineNum, err)
		}

		// Parse record fields
		if len(record) < 3 {
			return nil, fmt.Errorf("line %d: not enough fields, need at least name,type,value", lineNum)
		}

		name := strings.TrimSpace(record[0])
		recordType := strings.ToUpper(strings.TrimSpace(record[1]))
		value := strings.TrimSpace(record[2])

		// Validate record type
		if !isValidRecordType(recordType) {
			return nil, fmt.Errorf("line %d: invalid record type '%s'", lineNum, recordType)
		}

		// Parse TTL (optional)
		var ttl uint32 = 0 // 0 means use default
		if len(record) > 3 && record[3] != "" {
			parsedTTL, err := strconv.ParseUint(record[3], 10, 32)
			if err != nil {
				return nil, fmt.Errorf("line %d: invalid TTL: %v", lineNum, err)
			}
			ttl = uint32(parsedTTL)
		}

		// Parse additional fields for specific record types
		var priority, weight, port uint16
		if recordType == "MX" && len(record) > 4 && record[4] != "" {
			parsed, err := strconv.ParseUint(record[4], 10, 16)
			if err != nil {
				return nil, fmt.Errorf("line %d: invalid priority: %v", lineNum, err)
			}
			priority = uint16(parsed)
		}

		if recordType == "SRV" {
			// Parse priority
			if len(record) > 4 && record[4] != "" {
				parsed, err := strconv.ParseUint(record[4], 10, 16)
				if err != nil {
					return nil, fmt.Errorf("line %d: invalid priority: %v", lineNum, err)
				}
				priority = uint16(parsed)
			}

			// Parse weight
			if len(record) > 5 && record[5] != "" {
				parsed, err := strconv.ParseUint(record[5], 10, 16)
				if err != nil {
					return nil, fmt.Errorf("line %d: invalid weight: %v", lineNum, err)
				}
				weight = uint16(parsed)
			}

			// Parse port
			if len(record) > 6 && record[6] != "" {
				parsed, err := strconv.ParseUint(record[6], 10, 16)
				if err != nil {
					return nil, fmt.Errorf("line %d: invalid port: %v", lineNum, err)
				}
				port = uint16(parsed)
			} else {
				return nil, fmt.Errorf("line %d: SRV record requires port", lineNum)
			}
		}

		// Create DNS record
		dnsRecord := DNSRecord{
			Name:     name,
			Type:     recordType,
			Value:    value,
			TTL:      ttl,
			Priority: priority,
			Weight:   weight,
			Port:     port,
		}

		// Add to appropriate map (wildcard or regular)
		if strings.HasPrefix(name, "*.") {
			// Extract domain without the *. prefix
			domain := name[2:]
			store.WildRecords[domain] = append(store.WildRecords[domain], dnsRecord)
		} else {
			store.Records[name] = append(store.Records[name], dnsRecord)
		}
	}

	return store, nil
}

// lookupRecord looks up records in the store for the given name and type
func (store *RecordStore) lookupRecord(name string, qtype uint16) []dns.RR {
	store.mu.RLock()
	defer store.mu.RUnlock()

	name = strings.TrimSuffix(name, ".")
	var result []dns.RR

	// First check exact match
	if records, found := store.Records[name]; found {
		for _, record := range records {
			if rr := createRR(record, name, qtype); rr != nil {
				result = append(result, rr)
			}
		}
	}

	// If no exact match found, check for wildcard match
	if len(result) == 0 {
		labels := strings.Split(name, ".")
		if len(labels) >= 2 {
			// Try to match wildcard records at all parent domain levels
			for i := 1; i < len(labels) && len(result) == 0; i++ {
				domain := strings.Join(labels[i:], ".")
				if records, found := store.WildRecords[domain]; found {
					for _, record := range records {
						if rr := createRR(record, name, qtype); rr != nil {
							result = append(result, rr)
						}
					}
				}
			}
		}
	}

	return result
}

// createRR creates a DNS resource record from a DNSRecord
func createRR(record DNSRecord, qname string, qtype uint16) dns.RR {
	// Ensure qname ends with a dot
	if !strings.HasSuffix(qname, ".") {
		qname = qname + "."
	}

	// Use default TTL if record TTL is 0
	ttl := record.TTL
	if ttl == 0 {
		ttl = config.TTL
	}

	// Create header
	hdr := dns.RR_Header{
		Name:   qname,
		Rrtype: qtype,
		Class:  dns.ClassINET,
		Ttl:    ttl,
	}

	// Create appropriate record based on type
	switch record.Type {
	case "A":
		if qtype != dns.TypeA {
			return nil
		}
		ip := net.ParseIP(record.Value)
		if ip == nil || ip.To4() == nil {
			return nil
		}
		return &dns.A{Hdr: hdr, A: ip.To4()}

	case "AAAA":
		if qtype != dns.TypeAAAA {
			return nil
		}
		ip := net.ParseIP(record.Value)
		if ip == nil || ip.To16() == nil {
			return nil
		}
		return &dns.AAAA{Hdr: hdr, AAAA: ip}

	case "CNAME":
		if qtype != dns.TypeCNAME && qtype != dns.TypeA && qtype != dns.TypeAAAA {
			return nil
		}
		// For CNAME records, always use the CNAME type in the header, not the query type
		hdr.Rrtype = dns.TypeCNAME
		return &dns.CNAME{Hdr: hdr, Target: dns.Fqdn(record.Value)}

	case "MX":
		if qtype != dns.TypeMX {
			return nil
		}
		return &dns.MX{Hdr: hdr, Preference: record.Priority, Mx: dns.Fqdn(record.Value)}

	case "NS":
		if qtype != dns.TypeNS {
			return nil
		}
		return &dns.NS{Hdr: hdr, Ns: dns.Fqdn(record.Value)}

	case "PTR":
		if qtype != dns.TypePTR {
			return nil
		}
		return &dns.PTR{Hdr: hdr, Ptr: dns.Fqdn(record.Value)}

	case "SOA":
		if qtype != dns.TypeSOA {
			return nil
		}
		// SOA record requires parsing the value field
		// Format: primary_ns admin_email serial refresh retry expire minimum
		parts := strings.Fields(record.Value)
		if len(parts) != 7 {
			return nil
		}
		serial, _ := strconv.ParseUint(parts[2], 10, 32)
		refresh, _ := strconv.ParseUint(parts[3], 10, 32)
		retry, _ := strconv.ParseUint(parts[4], 10, 32)
		expire, _ := strconv.ParseUint(parts[5], 10, 32)
		minimum, _ := strconv.ParseUint(parts[6], 10, 32)

		return &dns.SOA{
			Hdr:     hdr,
			Ns:      dns.Fqdn(parts[0]),
			Mbox:    dns.Fqdn(parts[1]),
			Serial:  uint32(serial),
			Refresh: uint32(refresh),
			Retry:   uint32(retry),
			Expire:  uint32(expire),
			Minttl:  uint32(minimum),
		}

	case "SRV":
		if qtype != dns.TypeSRV {
			return nil
		}
		return &dns.SRV{
			Hdr:      hdr,
			Priority: record.Priority,
			Weight:   record.Weight,
			Port:     record.Port,
			Target:   dns.Fqdn(record.Value),
		}

	case "TXT":
		if qtype != dns.TypeTXT {
			return nil
		}
		return &dns.TXT{Hdr: hdr, Txt: []string{record.Value}}

	case "CAA":
		if qtype != dns.TypeCAA {
			return nil
		}
		// CAA record requires parsing the value field
		// Format: flag tag value
		parts := strings.SplitN(record.Value, " ", 3)
		if len(parts) != 3 {
			return nil
		}
		flag, _ := strconv.ParseUint(parts[0], 10, 8)

		return &dns.CAA{
			Hdr:   hdr,
			Flag:  uint8(flag),
			Tag:   parts[1],
			Value: parts[2],
		}
	}

	return nil
}

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
	// Convert to uppercase to support both upper and lowercase input
	b32Str = strings.ToUpper(b32Str)

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
	// Convert to uppercase to support both upper and lowercase input
	b32Str = strings.ToUpper(b32Str)

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
	// Convert to uppercase to support both upper and lowercase input
	prefix = strings.ToUpper(prefix)

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

		// 1. First check if we have a matching record in the CSV store
		if recordStore != nil {
			records := recordStore.lookupRecord(q.Name, q.Qtype)
			if len(records) > 0 {
				msg.Answer = append(msg.Answer, records...)
				if config.VerboseLogging {
					log.Printf("Adding %d records from CSV for %s", len(records), q.Name)
				}
				continue
			}
		}

		// 2. If no matching record, proceed with existing reflection logic
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
func initConfig(mode RunMode, ttlOverride uint32, verboseOverride *bool) {
	switch mode {
	case DevMode:
		config = Config{
			Mode:           DevMode,
			TTL:            30,          // Use shorter TTL in development mode
			Ports:          []int{8053}, // Use only one port in development mode
			VerboseLogging: true,        // Detailed logging in development mode
		}

		// Apply overrides if provided
		if ttlOverride > 0 {
			config.TTL = ttlOverride
		}
		if verboseOverride != nil {
			config.VerboseLogging = *verboseOverride
		}

		log.Printf("Starting in development mode, TTL: %d, verbose logging: %v, using port: %v",
			config.TTL, config.VerboseLogging, config.Ports)
	case ProductionMode:
		config = Config{
			Mode:           ProductionMode,
			TTL:            60,        // Use standard TTL in production mode
			Ports:          []int{53}, // Use standard DNS port 53 in production mode
			VerboseLogging: false,     // Concise logging in production mode
		}

		// Apply overrides if provided
		if ttlOverride > 0 {
			config.TTL = ttlOverride
		}
		if verboseOverride != nil {
			config.VerboseLogging = *verboseOverride
		}

		log.Printf("Starting in production mode, TTL: %d, verbose logging: %v, using standard DNS port: %v",
			config.TTL, config.VerboseLogging, config.Ports)
	default:
		// Default to development mode
		initConfig(DevMode, ttlOverride, verboseOverride)
	}
}

func main() {
	// Parse command line arguments
	modeFlag := flag.String("mode", "dev", "Run mode: dev or production")
	portFlag := flag.Int("port", 0, "Specify port number (overrides mode default port)")
	csvFileFlag := flag.String("csv", "", "Path to CSV file containing DNS records")
	ttlFlag := flag.Uint("ttl", 0, "Specify TTL in seconds (0 means use mode default)")
	verboseFlag := flag.Bool("verbose", false, "Enable verbose logging (overrides mode default)")
	flag.Parse()

	// Initialize configuration
	mode := RunMode(*modeFlag)
	if mode != DevMode && mode != ProductionMode {
		log.Printf("Invalid run mode: %s, using default development mode", mode)
		mode = DevMode
	}
	initConfig(mode, uint32(*ttlFlag), verboseFlag)

	// If port is specified, override the port in configuration
	if *portFlag > 0 {
		config.Ports = []int{*portFlag}
		log.Printf("Using specified port: %d", *portFlag)
	}

	// Load records from CSV if specified
	if *csvFileFlag != "" {
		var err error
		recordStore, err = loadRecordsFromCSV(*csvFileFlag)
		if err != nil {
			log.Fatalf("Failed to load records from CSV: %v", err)
		}

		// Count total records
		totalRecords := 0
		for _, records := range recordStore.Records {
			totalRecords += len(records)
		}
		for _, records := range recordStore.WildRecords {
			totalRecords += len(records)
		}

		log.Printf("Loaded %d records from %s", totalRecords, *csvFileFlag)
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
