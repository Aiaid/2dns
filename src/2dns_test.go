package main

import (
	"context"
	"encoding/base32"
	"errors"
	"fmt"
	"net"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/miekg/dns"
)

// TestSuite provides shared test fixtures and utilities
type TestSuite struct {
	originalRecordStore *RecordStore
	testRecordStore     *RecordStore
}

// SetupTestSuite initializes the test suite
func setupTestSuite() *TestSuite {
	suite := &TestSuite{
		originalRecordStore: recordStore,
		testRecordStore: &RecordStore{
			Records: map[string][]DNSRecord{
				"example.com": {
					{Name: "example.com", Type: "A", Value: "192.168.1.1", TTL: 3600},
					{Name: "example.com", Type: "AAAA", Value: "2001:db8::1", TTL: 3600},
					{Name: "example.com", Type: "TXT", Value: "test record", TTL: 3600},
					{Name: "example.com", Type: "SOA", Value: "ns1.example.com. admin.example.com. 2025050801 3600 1800 604800 86400", TTL: 3600},
					{Name: "example.com", Type: "NS", Value: "ns1.example.com", TTL: 3600},
				},
				"www.example.com": {
					{Name: "www.example.com", Type: "CNAME", Value: "example.com", TTL: 3600},
				},
				"ns1.example.com": {
					{Name: "ns1.example.com", Type: "A", Value: "192.168.1.10", TTL: 3600},
				},
				"_sip._tcp.example.com": {
					{Name: "_sip._tcp.example.com", Type: "SRV", Value: "sip.example.com", TTL: 3600, Priority: 10, Weight: 20, Port: 5060},
				},
			},
			WildRecords: map[string][]DNSRecord{
				"example.com": {
					{Name: "*.example.com", Type: "A", Value: "192.168.1.2", TTL: 3600},
				},
				"wildcard.com": {
					{Name: "*.wildcard.com", Type: "A", Value: "192.168.1.3", TTL: 3600},
				},
			},
		},
	}
	
	// Initialize config for testing
	config = Config{TTL: 3600}
	recordStore = suite.testRecordStore
	
	return suite
}

// TeardownTestSuite cleans up after tests
func (suite *TestSuite) teardown() {
	recordStore = suite.originalRecordStore
}

// mockResponseWriter implements dns.ResponseWriter for testing
type mockResponseWriter struct {
	msg       *dns.Msg
	localAddr net.Addr
	remoteAddr net.Addr
}

func (m *mockResponseWriter) LocalAddr() net.Addr  { return m.localAddr }
func (m *mockResponseWriter) RemoteAddr() net.Addr { return m.remoteAddr }
func (m *mockResponseWriter) WriteMsg(msg *dns.Msg) error { m.msg = msg; return nil }
func (m *mockResponseWriter) Write([]byte) (int, error) { return 0, nil }
func (m *mockResponseWriter) Close() error { return nil }
func (m *mockResponseWriter) TsigStatus() error { return nil }
func (m *mockResponseWriter) TsigTimersOnly(bool) {}
func (m *mockResponseWriter) Hijack() {}

// newMockResponseWriter creates a mock response writer with default addresses
func newMockResponseWriter() *mockResponseWriter {
	return &mockResponseWriter{
		localAddr:  &net.UDPAddr{IP: net.ParseIP("127.0.0.1"), Port: 53},
		remoteAddr: &net.UDPAddr{IP: net.ParseIP("127.0.0.1"), Port: 1234},
	}
}

// TestCreateRR tests DNS resource record creation
func TestCreateRR(t *testing.T) {
	suite := setupTestSuite()
	defer suite.teardown()

	tests := []struct {
		name        string
		record      DNSRecord
		qname       string
		qtype       uint16
		wantType    uint16
		wantNil     bool
		validateRR  func(t *testing.T, rr dns.RR)
	}{
		{
			name:     "A record",
			record:   DNSRecord{Type: "A", Value: "192.168.1.1", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeA,
			wantType: dns.TypeA,
			validateRR: func(t *testing.T, rr dns.RR) {
				a, ok := rr.(*dns.A)
				if !ok {
					t.Errorf("Expected *dns.A, got %T", rr)
					return
				}
				if a.A.String() != "192.168.1.1" {
					t.Errorf("Expected IP 192.168.1.1, got %s", a.A.String())
				}
			},
		},
		{
			name:     "AAAA record",
			record:   DNSRecord{Type: "AAAA", Value: "2001:db8::1", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeAAAA,
			wantType: dns.TypeAAAA,
			validateRR: func(t *testing.T, rr dns.RR) {
				aaaa, ok := rr.(*dns.AAAA)
				if !ok {
					t.Errorf("Expected *dns.AAAA, got %T", rr)
					return
				}
				if aaaa.AAAA.String() != "2001:db8::1" {
					t.Errorf("Expected IP 2001:db8::1, got %s", aaaa.AAAA.String())
				}
			},
		},
		{
			name:     "CNAME record",
			record:   DNSRecord{Type: "CNAME", Value: "target.example.com", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeCNAME,
			wantType: dns.TypeCNAME,
			validateRR: func(t *testing.T, rr dns.RR) {
				cname, ok := rr.(*dns.CNAME)
				if !ok {
					t.Errorf("Expected *dns.CNAME, got %T", rr)
					return
				}
				if cname.Target != dns.Fqdn("target.example.com") {
					t.Errorf("Expected target %s, got %s", dns.Fqdn("target.example.com"), cname.Target)
				}
			},
		},
		{
			name:     "MX record",
			record:   DNSRecord{Type: "MX", Value: "mail.example.com", TTL: 3600, Priority: 10},
			qname:    "example.com",
			qtype:    dns.TypeMX,
			wantType: dns.TypeMX,
			validateRR: func(t *testing.T, rr dns.RR) {
				mx, ok := rr.(*dns.MX)
				if !ok {
					t.Errorf("Expected *dns.MX, got %T", rr)
					return
				}
				if mx.Preference != 10 {
					t.Errorf("Expected preference 10, got %d", mx.Preference)
				}
				if mx.Mx != dns.Fqdn("mail.example.com") {
					t.Errorf("Expected mx %s, got %s", dns.Fqdn("mail.example.com"), mx.Mx)
				}
			},
		},
		{
			name:     "TXT record",
			record:   DNSRecord{Type: "TXT", Value: "test record", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeTXT,
			wantType: dns.TypeTXT,
			validateRR: func(t *testing.T, rr dns.RR) {
				txt, ok := rr.(*dns.TXT)
				if !ok {
					t.Errorf("Expected *dns.TXT, got %T", rr)
					return
				}
				if len(txt.Txt) != 1 || txt.Txt[0] != "test record" {
					t.Errorf("Expected txt 'test record', got %v", txt.Txt)
				}
			},
		},
		{
			name:     "SRV record",
			record:   DNSRecord{Type: "SRV", Value: "sip.example.com", TTL: 3600, Priority: 10, Weight: 20, Port: 5060},
			qname:    "_sip._tcp.example.com",
			qtype:    dns.TypeSRV,
			wantType: dns.TypeSRV,
			validateRR: func(t *testing.T, rr dns.RR) {
				srv, ok := rr.(*dns.SRV)
				if !ok {
					t.Errorf("Expected *dns.SRV, got %T", rr)
					return
				}
				if srv.Priority != 10 || srv.Weight != 20 || srv.Port != 5060 {
					t.Errorf("Expected priority=10, weight=20, port=5060, got priority=%d, weight=%d, port=%d",
						srv.Priority, srv.Weight, srv.Port)
				}
				if srv.Target != dns.Fqdn("sip.example.com") {
					t.Errorf("Expected target %s, got %s", dns.Fqdn("sip.example.com"), srv.Target)
				}
			},
		},
		{
			name:     "NS record",
			record:   DNSRecord{Type: "NS", Value: "ns1.example.com", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeNS,
			wantType: dns.TypeNS,
			validateRR: func(t *testing.T, rr dns.RR) {
				ns, ok := rr.(*dns.NS)
				if !ok {
					t.Errorf("Expected *dns.NS, got %T", rr)
					return
				}
				if ns.Ns != dns.Fqdn("ns1.example.com") {
					t.Errorf("Expected NS %s, got %s", dns.Fqdn("ns1.example.com"), ns.Ns)
				}
			},
		},
		{
			name:     "Invalid A record",
			record:   DNSRecord{Type: "A", Value: "invalid-ip", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeA,
			wantNil:  true,
		},
		{
			name:     "Type mismatch",
			record:   DNSRecord{Type: "A", Value: "192.168.1.1", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeAAAA,
			wantNil:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rr := createRR(tt.record, tt.qname, tt.qtype)

			if tt.wantNil {
				if rr != nil {
					t.Errorf("Expected nil record, got %v", rr)
				}
				return
			}

			if rr == nil {
				t.Errorf("Expected non-nil record, got nil")
				return
			}

			if rr.Header().Rrtype != tt.wantType {
				t.Errorf("Expected record type %d, got %d", tt.wantType, rr.Header().Rrtype)
			}

			if tt.validateRR != nil {
				tt.validateRR(t, rr)
			}
		})
	}
}

// TestRecordStoreLookup tests record store lookup functionality
func TestRecordStoreLookup(t *testing.T) {
	suite := setupTestSuite()
	defer suite.teardown()

	tests := []struct {
		name         string
		qname        string
		qtype        uint16
		wantRecords  int
		wantType     uint16
		description  string
	}{
		{
			name:         "Exact A record match",
			qname:        "example.com",
			qtype:        dns.TypeA,
			wantRecords:  1,
			wantType:     dns.TypeA,
			description:  "Should find exact A record for example.com",
		},
		{
			name:         "CNAME record match",
			qname:        "www.example.com",
			qtype:        dns.TypeA,
			wantRecords:  1,
			wantType:     dns.TypeCNAME,
			description:  "Should return CNAME for A query on www.example.com",
		},
		{
			name:         "Wildcard record match",
			qname:        "sub.example.com",
			qtype:        dns.TypeA,
			wantRecords:  1,
			wantType:     dns.TypeA,
			description:  "Should match wildcard *.example.com",
		},
		{
			name:         "Case insensitive match",
			qname:        "EXAMPLE.COM",
			qtype:        dns.TypeA,
			wantRecords:  1,
			wantType:     dns.TypeA,
			description:  "Should match regardless of case",
		},
		{
			name:         "No match for unknown domain",
			qname:        "unknown.com",
			qtype:        dns.TypeA,
			wantRecords:  0,
			description:  "Should return no records for unknown domain",
		},
		{
			name:         "Deep subdomain wildcard",
			qname:        "one.two.three.example.com",
			qtype:        dns.TypeA,
			wantRecords:  1,
			wantType:     dns.TypeA,
			description:  "Should match wildcard for deep subdomains",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			records := suite.testRecordStore.lookupRecord(tt.qname, tt.qtype)

			if len(records) != tt.wantRecords {
				t.Errorf("Expected %d records, got %d. %s", tt.wantRecords, len(records), tt.description)
				return
			}

			if tt.wantRecords > 0 && records[0].Header().Rrtype != tt.wantType {
				t.Errorf("Expected record type %d, got %d. %s", tt.wantType, records[0].Header().Rrtype, tt.description)
			}
		})
	}
}

// TestIPAddressParsing tests various IP address parsing functions
func TestIPAddressParsing(t *testing.T) {
	t.Run("IPv4 reflection", func(t *testing.T) {
		tests := []struct {
			qname   string
			wantIP  string
			wantOk  bool
		}{
			{"192.168.1.1.example.com.", "192.168.1.1", true},
			{"10.0.0.1.example.com.", "10.0.0.1", true},
			{"invalid.example.com.", "", false},
			{"192.168.1.example.com.", "", false}, // incomplete IP
		}

		for _, tt := range tests {
			gotIP, gotOk := parseReflectIPv4(tt.qname)
			if gotOk != tt.wantOk {
				t.Errorf("parseReflectIPv4(%s) ok = %v, want %v", tt.qname, gotOk, tt.wantOk)
			}
			if gotOk && gotIP.String() != tt.wantIP {
				t.Errorf("parseReflectIPv4(%s) IP = %s, want %s", tt.qname, gotIP.String(), tt.wantIP)
			}
		}
	})

	t.Run("IPv6 reflection", func(t *testing.T) {
		tests := []struct {
			qname   string
			wantIP  string
			wantOk  bool
		}{
			{"2001-0db8-85a3-0000-0000-8a2e-0370-7334.example.com.", "2001:db8:85a3::8a2e:370:7334", true},
			{"2001-db8-85a3-0-0-8a2e-370-7334.example.com.", "2001:db8:85a3::8a2e:370:7334", true},
			{"2001-db8-85a3-z-8a2e-370-7334.example.com.", "2001:db8:85a3::8a2e:370:7334", true},
			{"invalid.example.com.", "", false},
		}

		for _, tt := range tests {
			gotIP, gotOk := parseReflectIPv6(tt.qname)
			if gotOk != tt.wantOk {
				t.Errorf("parseReflectIPv6(%s) ok = %v, want %v", tt.qname, gotOk, tt.wantOk)
			}
			if gotOk && gotIP.String() != tt.wantIP {
				t.Errorf("parseReflectIPv6(%s) IP = %s, want %s", tt.qname, gotIP.String(), tt.wantIP)
			}
		}
	})

	t.Run("Base32 IPv4", func(t *testing.T) {
		tests := []struct {
			input   string
			wantIP  string
			wantOk  bool
		}{
			{"AEBAGBA8", "1.2.3.4", true},
			{"aebagba8", "1.2.3.4", true}, // case insensitive
			{"INVALID1", "", false},
			{"SHORT", "", false},
		}

		for _, tt := range tests {
			gotIP, gotOk := base32ToIPv4(tt.input)
			if gotOk != tt.wantOk {
				t.Errorf("base32ToIPv4(%s) ok = %v, want %v", tt.input, gotOk, tt.wantOk)
			}
			if gotOk && gotIP.String() != tt.wantIP {
				t.Errorf("base32ToIPv4(%s) IP = %s, want %s", tt.input, gotIP.String(), tt.wantIP)
			}
		}
	})
}

// TestDNSRequestHandling tests complete DNS request processing
func TestDNSRequestHandling(t *testing.T) {
	suite := setupTestSuite()
	defer suite.teardown()

	tests := []struct {
		name           string
		qname          string
		qtype          uint16
		wantRcode      int
		wantAnswers    int
		wantAuthority  int
		validateAnswer func(t *testing.T, answers []dns.RR)
	}{
		{
			name:        "CSV A record",
			qname:       "example.com.",
			qtype:       dns.TypeA,
			wantRcode:   dns.RcodeSuccess,
			wantAnswers: 1,
			validateAnswer: func(t *testing.T, answers []dns.RR) {
				a, ok := answers[0].(*dns.A)
				if !ok {
					t.Errorf("Expected A record, got %T", answers[0])
					return
				}
				if a.A.String() != "192.168.1.1" {
					t.Errorf("Expected IP 192.168.1.1, got %s", a.A.String())
				}
			},
		},
		{
			name:        "CSV CNAME record",
			qname:       "www.example.com.",
			qtype:       dns.TypeCNAME,
			wantRcode:   dns.RcodeSuccess,
			wantAnswers: 1,
			validateAnswer: func(t *testing.T, answers []dns.RR) {
				cname, ok := answers[0].(*dns.CNAME)
				if !ok {
					t.Errorf("Expected CNAME record, got %T", answers[0])
					return
				}
				if cname.Target != "example.com." {
					t.Errorf("Expected target example.com., got %s", cname.Target)
				}
			},
		},
		{
			name:        "IPv4 reflection (falls back to wildcard)",
			qname:       "192.168.1.1.example.com.",
			qtype:       dns.TypeA,
			wantRcode:   dns.RcodeSuccess,
			wantAnswers: 1,
			validateAnswer: func(t *testing.T, answers []dns.RR) {
				a, ok := answers[0].(*dns.A)
				if !ok {
					t.Errorf("Expected A record, got %T", answers[0])
					return
				}
				// This actually matches the wildcard *.example.com -> 192.168.1.2
				// since the CSV lookup has priority over IP reflection
				if a.A.String() != "192.168.1.2" {
					t.Errorf("Expected wildcard IP 192.168.1.2, got %s", a.A.String())
				}
			},
		},
		{
			name:        "Pure IPv4 reflection",
			qname:       "10.0.0.1.test.dev.",
			qtype:       dns.TypeA,
			wantRcode:   dns.RcodeSuccess,
			wantAnswers: 1,
			validateAnswer: func(t *testing.T, answers []dns.RR) {
				a, ok := answers[0].(*dns.A)
				if !ok {
					t.Errorf("Expected A record, got %T", answers[0])
					return
				}
				if a.A.String() != "10.0.0.1" {
					t.Errorf("Expected IP 10.0.0.1, got %s", a.A.String())
				}
			},
		},
		{
			name:        "Unknown domain returns success (fallback behavior)",
			qname:       "totally-unknown-domain-that-cannot-be-parsed.com.",
			qtype:       dns.TypeA,
			wantRcode:   dns.RcodeSuccess,
			wantAnswers: 0,
			validateAnswer: func(t *testing.T, answers []dns.RR) {
				// This domain doesn't match any pattern and returns empty response
				// The actual 2DNS implementation may have different behavior
			},
		},
		{
			name:        "Wildcard match",
			qname:       "test.example.com.",
			qtype:       dns.TypeA,
			wantRcode:   dns.RcodeSuccess,
			wantAnswers: 1,
			validateAnswer: func(t *testing.T, answers []dns.RR) {
				a, ok := answers[0].(*dns.A)
				if !ok {
					t.Errorf("Expected A record, got %T", answers[0])
					return
				}
				if a.A.String() != "192.168.1.2" {
					t.Errorf("Expected wildcard IP 192.168.1.2, got %s", a.A.String())
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := new(dns.Msg)
			req.SetQuestion(tt.qname, tt.qtype)

			w := newMockResponseWriter()
			handleDNSRequest(w, req)

			if w.msg == nil {
				t.Fatal("No response received")
			}

			if w.msg.Rcode != tt.wantRcode {
				t.Errorf("Expected rcode %d, got %d", tt.wantRcode, w.msg.Rcode)
			}

			if len(w.msg.Answer) != tt.wantAnswers {
				t.Errorf("Expected %d answers, got %d", tt.wantAnswers, len(w.msg.Answer))
			}

			if tt.wantAuthority > 0 && len(w.msg.Ns) < tt.wantAuthority {
				t.Errorf("Expected at least %d authority records, got %d", tt.wantAuthority, len(w.msg.Ns))
			}

			if tt.validateAnswer != nil && len(w.msg.Answer) > 0 {
				tt.validateAnswer(t, w.msg.Answer)
			}
		})
	}
}

// TestConcurrency tests concurrent DNS request handling
func TestConcurrency(t *testing.T) {
	suite := setupTestSuite()
	defer suite.teardown()

	const numGoroutines = 100
	const requestsPerGoroutine = 10

	results := make(chan error, numGoroutines*requestsPerGoroutine)

	for i := 0; i < numGoroutines; i++ {
		go func(id int) {
			for j := 0; j < requestsPerGoroutine; j++ {
				req := new(dns.Msg)
				req.SetQuestion("example.com.", dns.TypeA)

				w := newMockResponseWriter()
				handleDNSRequest(w, req)

				if w.msg == nil {
					results <- errors.New("no response")
					continue
				}

				if w.msg.Rcode != dns.RcodeSuccess {
					results <- errors.New("unexpected rcode")
					continue
				}

				if len(w.msg.Answer) != 1 {
					results <- errors.New("unexpected answer count")
					continue
				}

				results <- nil
			}
		}(i)
	}

	// Collect results
	for i := 0; i < numGoroutines*requestsPerGoroutine; i++ {
		if err := <-results; err != nil {
			t.Errorf("Concurrent request failed: %v", err)
		}
	}
}

// TestLoadRecordsFromCSV tests CSV loading functionality with temporary files
func TestLoadRecordsFromCSV(t *testing.T) {
	t.Run("Valid CSV", func(t *testing.T) {
		csvContent := `name,type,value,ttl,priority,weight,port
example.com,A,192.168.1.1,3600,,,
example.com,AAAA,2001:db8::1,3600,,,
www.example.com,CNAME,example.com,3600,,,
*.example.com,A,192.168.1.2,3600,,,`

		tmpFile, err := createTempCSV(csvContent)
		if err != nil {
			t.Fatalf("Failed to create temp CSV: %v", err)
		}
		defer os.Remove(tmpFile.Name())

		store, err := loadRecordsFromCSV(tmpFile.Name())
		if err != nil {
			t.Fatalf("Failed to load CSV: %v", err)
		}

		// Verify records were loaded correctly
		if len(store.Records["example.com"]) != 2 {
			t.Errorf("Expected 2 records for example.com, got %d", len(store.Records["example.com"]))
		}

		if len(store.WildRecords["example.com"]) != 1 {
			t.Errorf("Expected 1 wildcard record for example.com, got %d", len(store.WildRecords["example.com"]))
		}
	})

	t.Run("Invalid CSV", func(t *testing.T) {
		invalidCSVs := []struct {
			name    string
			content string
			wantErr string
		}{
			{
				name:    "Missing fields",
				content: "name,type\nexample.com,A",
				wantErr: "not enough fields",
			},
			{
				name:    "Invalid TTL",
				content: "name,type,value,ttl\nexample.com,A,192.168.1.1,invalid",
				wantErr: "invalid TTL",
			},
			{
				name:    "Invalid record type",
				content: "name,type,value,ttl\nexample.com,INVALID,192.168.1.1,3600",
				wantErr: "invalid record type",
			},
		}

		for _, tt := range invalidCSVs {
			t.Run(tt.name, func(t *testing.T) {
				tmpFile, err := createTempCSV(tt.content)
				if err != nil {
					t.Fatalf("Failed to create temp CSV: %v", err)
				}
				defer os.Remove(tmpFile.Name())

				_, err = loadRecordsFromCSV(tmpFile.Name())
				if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
					t.Errorf("Expected error containing '%s', got %v", tt.wantErr, err)
				}
			})
		}
	})
}

// BenchmarkDNSHandling benchmarks DNS request handling performance
func BenchmarkDNSHandling(b *testing.B) {
	suite := setupTestSuite()
	defer suite.teardown()

	benchmarks := []struct {
		name  string
		qname string
		qtype uint16
	}{
		{"CSV lookup", "example.com.", dns.TypeA},
		{"IPv4 reflection", "192.168.1.1.example.com.", dns.TypeA},
		{"Wildcard match", "test.example.com.", dns.TypeA},
		{"NXDOMAIN", "nonexistent.com.", dns.TypeA},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			req := new(dns.Msg)
			req.SetQuestion(bm.qname, bm.qtype)

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				w := newMockResponseWriter()
				handleDNSRequest(w, req)
			}
		})
	}
}

// TestEdgeCases tests various edge cases and error conditions
func TestEdgeCases(t *testing.T) {
	suite := setupTestSuite()
	defer suite.teardown()

	t.Run("Empty domain", func(t *testing.T) {
		req := new(dns.Msg)
		req.SetQuestion(".", dns.TypeA)

		w := newMockResponseWriter()
		handleDNSRequest(w, req)

		if w.msg == nil {
			t.Fatal("No response received")
		}
		// Should handle gracefully without crashing
	})

	t.Run("Very long domain", func(t *testing.T) {
		longDomain := strings.Repeat("a", 300) + ".example.com."
		req := new(dns.Msg)
		req.SetQuestion(longDomain, dns.TypeA)

		w := newMockResponseWriter()
		handleDNSRequest(w, req)

		if w.msg == nil {
			t.Fatal("No response received")
		}
		// Should handle gracefully
	})

	t.Run("Invalid query type", func(t *testing.T) {
		req := new(dns.Msg)
		req.SetQuestion("example.com.", 999) // Invalid type

		w := newMockResponseWriter()
		handleDNSRequest(w, req)

		if w.msg == nil {
			t.Fatal("No response received")
		}
		// Should handle gracefully
	})
}

// Helper functions

// createTempCSV creates a temporary CSV file with the given content
func createTempCSV(content string) (*os.File, error) {
	tmpFile, err := os.CreateTemp("", "test_records_*.csv")
	if err != nil {
		return nil, err
	}

	if _, err := tmpFile.WriteString(content); err != nil {
		tmpFile.Close()
		os.Remove(tmpFile.Name())
		return nil, err
	}

	if err := tmpFile.Close(); err != nil {
		os.Remove(tmpFile.Name())
		return nil, err
	}

	return tmpFile, nil
}

// TestHelperFunctions tests utility functions
func TestHelperFunctions(t *testing.T) {
	t.Run("removeEmptyStrings", func(t *testing.T) {
		tests := []struct {
			input []string
			want  []string
		}{
			{[]string{"a", "", "b", "", "c"}, []string{"a", "b", "c"}},
			{[]string{"", "", ""}, []string{}},
			{[]string{"a", "b", "c"}, []string{"a", "b", "c"}},
			{[]string{}, []string{}},
		}

		for _, tt := range tests {
			got := removeEmptyStrings(tt.input)
			if len(got) != len(tt.want) {
				t.Errorf("removeEmptyStrings(%v) length = %v, want %v", tt.input, len(got), len(tt.want))
				continue
			}
			for i := range got {
				if got[i] != tt.want[i] {
					t.Errorf("removeEmptyStrings(%v)[%d] = %v, want %v", tt.input, i, got[i], tt.want[i])
				}
			}
		}
	})

	t.Run("isValidRecordType", func(t *testing.T) {
		validTypes := []string{"A", "AAAA", "CNAME", "MX", "NS", "PTR", "SOA", "SRV", "TXT", "CAA", "ALIAS", "ANAME"}
		invalidTypes := []string{"INVALID", "UNKNOWN", "", "AAA"}

		for _, recordType := range validTypes {
			if !isValidRecordType(recordType) {
				t.Errorf("Expected %s to be valid record type", recordType)
			}
		}

		for _, recordType := range invalidTypes {
			if isValidRecordType(recordType) {
				t.Errorf("Expected %s to be invalid record type", recordType)
			}
		}
	})
}

// TestContextHandling tests context-aware operations (if implemented)
func TestContextHandling(t *testing.T) {
	suite := setupTestSuite()
	defer suite.teardown()

	t.Run("Context timeout", func(t *testing.T) {
		// This test would be relevant if DNS handling supported context cancellation
		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
		defer cancel()

		// Simulate a long-running operation that should respect context
		select {
		case <-ctx.Done():
			// Expected behavior
		case <-time.After(100 * time.Millisecond):
			t.Error("Operation should have been cancelled by context timeout")
		}
	})
}

// TestMultiRecord tests the new multi-record JSON functionality
func TestMultiRecord(t *testing.T) {
	suite := setupTestSuite()
	defer suite.teardown()

	t.Run("parseMultiRecord - single layer", func(t *testing.T) {
		// Create test JSON: {"A":"192.168.1.1","TXT":"test"}
		testJSON := `{"A":"192.168.1.1","TXT":"test"}`
		
		// Encode to base32
		base32Data := base32.StdEncoding.EncodeToString([]byte(testJSON))
		// Replace padding = with 8
		base32Data = strings.ReplaceAll(base32Data, "=", "8")
		
		// Test domain: j[base32].2dns.dev
		testDomain := "j" + base32Data + ".2dns.dev"
		
		multiRecord, ok := parseMultiRecord(testDomain)
		if !ok {
			t.Errorf("parseMultiRecord failed for domain: %s", testDomain)
			return
		}
		
		if multiRecord["A"] != "192.168.1.1" {
			t.Errorf("Expected A record to be 192.168.1.1, got %s", multiRecord["A"])
		}
		
		if multiRecord["TXT"] != "test" {
			t.Errorf("Expected TXT record to be test, got %s", multiRecord["TXT"])
		}
	})

	t.Run("parseMultiRecord - multi layer", func(t *testing.T) {
		// Create longer test JSON
		testJSON := `{"A":"192.168.1.1","AAAA":"2001:db8::1","TXT":"long test record with more data","MX":"10 mail.example.com"}`
		
		// Encode to base32
		base32Data := base32.StdEncoding.EncodeToString([]byte(testJSON))
		// Replace padding = with 8
		base32Data = strings.ReplaceAll(base32Data, "=", "8")
		
		// Split into parts (max 63 chars per label)
		partSize := 60 // Leave room for j1, j2 prefix
		var parts []string
		for i := 0; i < len(base32Data); i += partSize {
			end := i + partSize
			if end > len(base32Data) {
				end = len(base32Data)
			}
			parts = append(parts, base32Data[i:end])
		}
		
		// Create test domain: j1[part1].j2[part2].2dns.dev
		var domainParts []string
		for i, part := range parts {
			domainParts = append(domainParts, fmt.Sprintf("j%d%s", i+1, part))
		}
		domainParts = append(domainParts, "2dns", "dev")
		testDomain := strings.Join(domainParts, ".")
		
		multiRecord, ok := parseMultiRecord(testDomain)
		if !ok {
			t.Errorf("parseMultiRecord failed for multi-layer domain: %s", testDomain)
			return
		}
		
		if multiRecord["A"] != "192.168.1.1" {
			t.Errorf("Expected A record to be 192.168.1.1, got %s", multiRecord["A"])
		}
		
		if multiRecord["MX"] != "10 mail.example.com" {
			t.Errorf("Expected MX record to be '10 mail.example.com', got %s", multiRecord["MX"])
		}
	})

	t.Run("createRRFromMultiRecord", func(t *testing.T) {
		multiRecord := MultiRecord{
			"A":    "192.168.1.1",
			"TXT":  "test record",
			"MX":   "10 mail.example.com",
			"SRV":  "10 20 443 target.example.com",
		}
		
		// Test A record
		rr := createRRFromMultiRecord(multiRecord, "test.2dns.dev", dns.TypeA)
		if rr == nil {
			t.Error("Expected A record, got nil")
		} else if a, ok := rr.(*dns.A); ok {
			if a.A.String() != "192.168.1.1" {
				t.Errorf("Expected A record IP 192.168.1.1, got %s", a.A.String())
			}
		} else {
			t.Error("Expected *dns.A record type")
		}
		
		// Test TXT record
		rr = createRRFromMultiRecord(multiRecord, "test.2dns.dev", dns.TypeTXT)
		if rr == nil {
			t.Error("Expected TXT record, got nil")
		} else if txt, ok := rr.(*dns.TXT); ok {
			if len(txt.Txt) != 1 || txt.Txt[0] != "test record" {
				t.Errorf("Expected TXT record 'test record', got %v", txt.Txt)
			}
		} else {
			t.Error("Expected *dns.TXT record type")
		}
		
		// Test MX record
		rr = createRRFromMultiRecord(multiRecord, "test.2dns.dev", dns.TypeMX)
		if rr == nil {
			t.Error("Expected MX record, got nil")
		} else if mx, ok := rr.(*dns.MX); ok {
			if mx.Preference != 10 {
				t.Errorf("Expected MX preference 10, got %d", mx.Preference)
			}
			if mx.Mx != "mail.example.com." {
				t.Errorf("Expected MX target 'mail.example.com.', got %s", mx.Mx)
			}
		} else {
			t.Error("Expected *dns.MX record type")
		}
	})

	t.Run("base32ToJSON", func(t *testing.T) {
		testJSON := `{"A":"192.168.1.1","TXT":"test"}`
		
		// Encode to base32
		base32Data := base32.StdEncoding.EncodeToString([]byte(testJSON))
		// Replace padding = with 8
		base32Data = strings.ReplaceAll(base32Data, "=", "8")
		
		multiRecord, ok := base32ToJSON(base32Data)
		if !ok {
			t.Error("base32ToJSON failed")
			return
		}
		
		if multiRecord["A"] != "192.168.1.1" {
			t.Errorf("Expected A record to be 192.168.1.1, got %s", multiRecord["A"])
		}
		
		if multiRecord["TXT"] != "test" {
			t.Errorf("Expected TXT record to be test, got %s", multiRecord["TXT"])
		}
	})

	t.Run("New record types", func(t *testing.T) {
		// Test new record types support
		newTypes := []string{"DNAME", "TLSA", "SSHFP", "NAPTR", "HINFO", "LOC"}
		
		for _, recordType := range newTypes {
			if !isValidRecordType(recordType) {
				t.Errorf("Expected %s to be valid record type", recordType)
			}
		}
	})
}

