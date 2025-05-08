package main

import (
	"io/ioutil"
	"net"
	"os"
	"strings"
	"testing"

	"github.com/miekg/dns"
)

// Test creating resource records from DNSRecord
func TestCreateRR(t *testing.T) {
	// Initialize config for testing
	config = Config{
		TTL: 3600,
	}

	tests := []struct {
		name     string
		record   DNSRecord
		qname    string
		qtype    uint16
		wantType uint16
		wantNil  bool
	}{
		{
			name:     "A record",
			record:   DNSRecord{Type: "A", Value: "192.168.1.1", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeA,
			wantType: dns.TypeA,
			wantNil:  false,
		},
		{
			name:     "A record with wrong query type",
			record:   DNSRecord{Type: "A", Value: "192.168.1.1", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeAAAA,
			wantType: 0,
			wantNil:  true,
		},
		{
			name:     "AAAA record",
			record:   DNSRecord{Type: "AAAA", Value: "2001:db8::1", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeAAAA,
			wantType: dns.TypeAAAA,
			wantNil:  false,
		},
		{
			name:     "CNAME record",
			record:   DNSRecord{Type: "CNAME", Value: "target.example.com", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeCNAME,
			wantType: dns.TypeCNAME,
			wantNil:  false,
		},
		{
			name:     "CNAME record with A query",
			record:   DNSRecord{Type: "CNAME", Value: "target.example.com", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeA,
			wantType: dns.TypeCNAME,
			wantNil:  false,
		},
		{
			name:     "MX record",
			record:   DNSRecord{Type: "MX", Value: "mail.example.com", TTL: 3600, Priority: 10},
			qname:    "example.com",
			qtype:    dns.TypeMX,
			wantType: dns.TypeMX,
			wantNil:  false,
		},
		{
			name:     "TXT record",
			record:   DNSRecord{Type: "TXT", Value: "test record", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeTXT,
			wantType: dns.TypeTXT,
			wantNil:  false,
		},
		{
			name:     "SOA record",
			record:   DNSRecord{Type: "SOA", Value: "ns1.example.com. admin.example.com. 2025050801 3600 1800 604800 86400", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeSOA,
			wantType: dns.TypeSOA,
			wantNil:  false,
		},
		{
			name:     "SRV record",
			record:   DNSRecord{Type: "SRV", Value: "sip.example.com", TTL: 3600, Priority: 10, Weight: 20, Port: 5060},
			qname:    "_sip._tcp.example.com",
			qtype:    dns.TypeSRV,
			wantType: dns.TypeSRV,
			wantNil:  false,
		},
		{
			name:     "Invalid A record value",
			record:   DNSRecord{Type: "A", Value: "invalid-ip", TTL: 3600},
			qname:    "example.com",
			qtype:    dns.TypeA,
			wantType: 0,
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

			// Test specific record type values
			switch tt.record.Type {
			case "A":
				a, ok := rr.(*dns.A)
				if !ok {
					t.Errorf("Expected *dns.A, got %T", rr)
					return
				}
				if a.A.String() != tt.record.Value {
					t.Errorf("Expected IP %s, got %s", tt.record.Value, a.A.String())
				}
			case "AAAA":
				aaaa, ok := rr.(*dns.AAAA)
				if !ok {
					t.Errorf("Expected *dns.AAAA, got %T", rr)
					return
				}
				if aaaa.AAAA.String() != tt.record.Value {
					t.Errorf("Expected IP %s, got %s", tt.record.Value, aaaa.AAAA.String())
				}
			case "CNAME":
				cname, ok := rr.(*dns.CNAME)
				if !ok {
					t.Errorf("Expected *dns.CNAME, got %T", rr)
					return
				}
				if cname.Target != dns.Fqdn(tt.record.Value) {
					t.Errorf("Expected target %s, got %s", dns.Fqdn(tt.record.Value), cname.Target)
				}
			case "MX":
				mx, ok := rr.(*dns.MX)
				if !ok {
					t.Errorf("Expected *dns.MX, got %T", rr)
					return
				}
				if mx.Preference != tt.record.Priority {
					t.Errorf("Expected preference %d, got %d", tt.record.Priority, mx.Preference)
				}
				if mx.Mx != dns.Fqdn(tt.record.Value) {
					t.Errorf("Expected mx %s, got %s", dns.Fqdn(tt.record.Value), mx.Mx)
				}
			case "TXT":
				txt, ok := rr.(*dns.TXT)
				if !ok {
					t.Errorf("Expected *dns.TXT, got %T", rr)
					return
				}
				if len(txt.Txt) != 1 || txt.Txt[0] != tt.record.Value {
					t.Errorf("Expected txt %s, got %v", tt.record.Value, txt.Txt)
				}
			case "SRV":
				srv, ok := rr.(*dns.SRV)
				if !ok {
					t.Errorf("Expected *dns.SRV, got %T", rr)
					return
				}
				if srv.Priority != tt.record.Priority {
					t.Errorf("Expected priority %d, got %d", tt.record.Priority, srv.Priority)
				}
				if srv.Weight != tt.record.Weight {
					t.Errorf("Expected weight %d, got %d", tt.record.Weight, srv.Weight)
				}
				if srv.Port != tt.record.Port {
					t.Errorf("Expected port %d, got %d", tt.record.Port, srv.Port)
				}
				if srv.Target != dns.Fqdn(tt.record.Value) {
					t.Errorf("Expected target %s, got %s", dns.Fqdn(tt.record.Value), srv.Target)
				}
			}
		})
	}
}

// Test record store lookup
func TestRecordStoreLookup(t *testing.T) {
	// Create a test record store
	store := &RecordStore{
		Records: map[string][]DNSRecord{
			"example.com": {
				{Name: "example.com", Type: "A", Value: "192.168.1.1", TTL: 3600},
				{Name: "example.com", Type: "AAAA", Value: "2001:db8::1", TTL: 3600},
				{Name: "example.com", Type: "TXT", Value: "test record", TTL: 3600},
			},
			"www.example.com": {
				{Name: "www.example.com", Type: "CNAME", Value: "example.com", TTL: 3600},
			},
		},
		WildRecords: map[string][]DNSRecord{
			"example.com": {
				{Name: "*.example.com", Type: "A", Value: "192.168.1.2", TTL: 3600},
			},
		},
	}

	tests := []struct {
		name     string
		qname    string
		qtype    uint16
		wantLen  int
		wantType uint16
	}{
		{
			name:     "Exact A record match",
			qname:    "example.com",
			qtype:    dns.TypeA,
			wantLen:  1,
			wantType: dns.TypeA,
		},
		{
			name:     "Exact AAAA record match",
			qname:    "example.com",
			qtype:    dns.TypeAAAA,
			wantLen:  1,
			wantType: dns.TypeAAAA,
		},
		{
			name:     "Exact TXT record match",
			qname:    "example.com",
			qtype:    dns.TypeTXT,
			wantLen:  1,
			wantType: dns.TypeTXT,
		},
		{
			name:     "CNAME record match",
			qname:    "www.example.com",
			qtype:    dns.TypeA,
			wantLen:  1,
			wantType: dns.TypeCNAME,
		},
		{
			name:     "Wildcard record match",
			qname:    "sub.example.com",
			qtype:    dns.TypeA,
			wantLen:  1,
			wantType: dns.TypeA,
		},
		{
			name:     "No match",
			qname:    "nonexistent.com",
			qtype:    dns.TypeA,
			wantLen:  0,
			wantType: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			records := store.lookupRecord(tt.qname, tt.qtype)

			if len(records) != tt.wantLen {
				t.Errorf("Expected %d records, got %d", tt.wantLen, len(records))
				return
			}

			if tt.wantLen > 0 && records[0].Header().Rrtype != tt.wantType {
				t.Errorf("Expected record type %d, got %d", tt.wantType, records[0].Header().Rrtype)
			}
		})
	}
}

// Test loading records from CSV
func TestLoadRecordsFromCSV(t *testing.T) {
	// Create a temporary CSV file with test records
	csvContent := `name,type,value,ttl,priority,weight,port
example.com,A,192.168.1.1,3600,,,
example.com,AAAA,2001:db8::1,3600,,,
example.com,TXT,"This is a test record",3600,,,
www.example.com,CNAME,example.com,3600,,,
example.com,MX,mail.example.com,3600,10,,
_sip._tcp.example.com,SRV,sip.example.com,3600,10,20,5060
*.example.com,A,192.168.1.2,3600,,,
`
	tmpFile, err := ioutil.TempFile("", "dns_records_*.csv")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.Write([]byte(csvContent)); err != nil {
		t.Fatalf("Failed to write to temp file: %v", err)
	}
	if err := tmpFile.Close(); err != nil {
		t.Fatalf("Failed to close temp file: %v", err)
	}

	// Load records from the CSV file
	store, err := loadRecordsFromCSV(tmpFile.Name())
	if err != nil {
		t.Fatalf("Failed to load records from CSV: %v", err)
	}

	// Verify regular records
	if len(store.Records["example.com"]) != 4 {
		t.Errorf("Expected 4 records for example.com, got %d", len(store.Records["example.com"]))
	}

	// Verify wildcard records
	if len(store.WildRecords["example.com"]) != 1 {
		t.Errorf("Expected 1 wildcard record for example.com, got %d", len(store.WildRecords["example.com"]))
	}

	// Verify specific record types
	var foundA, foundAAAA, foundTXT, foundMX, foundSRV, foundCNAME bool
	for _, record := range store.Records["example.com"] {
		switch record.Type {
		case "A":
			foundA = true
			if record.Value != "192.168.1.1" {
				t.Errorf("Expected A record value 192.168.1.1, got %s", record.Value)
			}
		case "AAAA":
			foundAAAA = true
			if record.Value != "2001:db8::1" {
				t.Errorf("Expected AAAA record value 2001:db8::1, got %s", record.Value)
			}
		case "TXT":
			foundTXT = true
			if record.Value != "This is a test record" {
				t.Errorf("Expected TXT record value 'This is a test record', got %s", record.Value)
			}
		case "MX":
			foundMX = true
			if record.Value != "mail.example.com" || record.Priority != 10 {
				t.Errorf("Expected MX record value mail.example.com with priority 10, got %s with priority %d",
					record.Value, record.Priority)
			}
		}
	}

	for _, record := range store.Records["_sip._tcp.example.com"] {
		if record.Type == "SRV" {
			foundSRV = true
			if record.Value != "sip.example.com" || record.Priority != 10 ||
				record.Weight != 20 || record.Port != 5060 {
				t.Errorf("SRV record has incorrect values: %+v", record)
			}
		}
	}

	for _, record := range store.Records["www.example.com"] {
		if record.Type == "CNAME" {
			foundCNAME = true
			if record.Value != "example.com" {
				t.Errorf("Expected CNAME record value example.com, got %s", record.Value)
			}
		}
	}

	if !foundA || !foundAAAA || !foundTXT || !foundMX || !foundSRV || !foundCNAME {
		t.Errorf("Missing expected records: A=%v, AAAA=%v, TXT=%v, MX=%v, SRV=%v, CNAME=%v",
			foundA, foundAAAA, foundTXT, foundMX, foundSRV, foundCNAME)
	}
}

// Test loading invalid CSV files
func TestLoadRecordsFromCSVErrors(t *testing.T) {
	tests := []struct {
		name    string
		content string
		wantErr string
	}{
		{
			name: "Missing required fields",
			content: `name,type,value
example.com,A
`,
			wantErr: "not enough fields",
		},
		{
			name: "Invalid record type",
			content: `name,type,value,ttl
example.com,INVALID,192.168.1.1,3600
`,
			wantErr: "invalid record type",
		},
		{
			name: "Invalid TTL",
			content: `name,type,value,ttl
example.com,A,192.168.1.1,invalid
`,
			wantErr: "invalid TTL",
		},
		{
			name: "Invalid priority",
			content: `name,type,value,ttl,priority
example.com,MX,mail.example.com,3600,invalid
`,
			wantErr: "invalid priority",
		},
		{
			name: "Missing SRV port",
			content: `name,type,value,ttl,priority,weight
_sip._tcp.example.com,SRV,sip.example.com,3600,10,20
`,
			wantErr: "SRV record requires port",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a temporary CSV file
			tmpFile, err := ioutil.TempFile("", "dns_records_*.csv")
			if err != nil {
				t.Fatalf("Failed to create temp file: %v", err)
			}
			defer os.Remove(tmpFile.Name())

			// Write test content to the file
			if _, err := tmpFile.Write([]byte(tt.content)); err != nil {
				t.Fatalf("Failed to write to temp file: %v", err)
			}
			if err := tmpFile.Close(); err != nil {
				t.Fatalf("Failed to close temp file: %v", err)
			}

			// Try to load records from the CSV file
			_, err = loadRecordsFromCSV(tmpFile.Name())

			// Check if the error contains the expected message
			if err == nil {
				t.Errorf("Expected error containing '%s', got nil", tt.wantErr)
			} else if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("Expected error containing '%s', got '%s'", tt.wantErr, err.Error())
			}
		})
	}
}

// Test wildcard matching
func TestWildcardMatching(t *testing.T) {
	// Create a test record store with wildcard records
	store := &RecordStore{
		Records: map[string][]DNSRecord{
			"example.com": {
				{Name: "example.com", Type: "A", Value: "192.168.1.1", TTL: 3600},
			},
		},
		WildRecords: map[string][]DNSRecord{
			"example.com": {
				{Name: "*.example.com", Type: "A", Value: "192.168.1.2", TTL: 3600},
			},
			"sub.example.com": {
				{Name: "*.sub.example.com", Type: "A", Value: "192.168.1.3", TTL: 3600},
			},
		},
	}

	tests := []struct {
		name      string
		qname     string
		qtype     uint16
		wantValue string
		wantFound bool
	}{
		{
			name:      "Exact match",
			qname:     "example.com",
			qtype:     dns.TypeA,
			wantValue: "192.168.1.1",
			wantFound: true,
		},
		{
			name:      "First-level wildcard match",
			qname:     "test.example.com",
			qtype:     dns.TypeA,
			wantValue: "192.168.1.2",
			wantFound: true,
		},
		{
			name:      "Second-level wildcard match",
			qname:     "test.sub.example.com",
			qtype:     dns.TypeA,
			wantValue: "192.168.1.3",
			wantFound: true,
		},
		{
			name:      "Multi-level subdomain with first-level wildcard",
			qname:     "one.two.example.com",
			qtype:     dns.TypeA,
			wantValue: "192.168.1.2",
			wantFound: true,
		},
		{
			name:      "No match",
			qname:     "test.nonexistent.com",
			qtype:     dns.TypeA,
			wantValue: "",
			wantFound: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			records := store.lookupRecord(tt.qname, tt.qtype)

			if tt.wantFound {
				if len(records) == 0 {
					t.Errorf("Expected to find a record, got none")
					return
				}

				a, ok := records[0].(*dns.A)
				if !ok {
					t.Errorf("Expected *dns.A, got %T", records[0])
					return
				}

				if a.A.String() != tt.wantValue {
					t.Errorf("Expected IP %s, got %s", tt.wantValue, a.A.String())
				}
			} else {
				if len(records) > 0 {
					t.Errorf("Expected no records, got %d", len(records))
				}
			}
		})
	}
}

// Test DNS request handling with CSV records
func TestHandleDNSRequestWithCSV(t *testing.T) {
	// Save original recordStore
	originalRecordStore := recordStore
	defer func() { recordStore = originalRecordStore }()

	// Create a test record store
	recordStore = &RecordStore{
		Records: map[string][]DNSRecord{
			"example.com": {
				{Name: "example.com", Type: "A", Value: "192.168.1.1", TTL: 3600},
				{Name: "example.com", Type: "AAAA", Value: "2001:db8::1", TTL: 3600},
				{Name: "example.com", Type: "TXT", Value: "This is a test", TTL: 3600},
				{Name: "example.com", Type: "SOA", Value: "ns1.example.com. admin.example.com. 2025050801 3600 1800 604800 86400", TTL: 3600},
			},
			"www.example.com": {
				{Name: "www.example.com", Type: "CNAME", Value: "example.com", TTL: 3600},
			},
		},
		WildRecords: map[string][]DNSRecord{
			"wildcard.com": {
				{Name: "*.wildcard.com", Type: "A", Value: "192.168.1.2", TTL: 3600},
			},
		},
	}

	// Test cases
	tests := []struct {
		name      string
		qname     string
		qtype     uint16
		wantType  uint16
		wantValue string
	}{
		{
			name:      "A record from CSV",
			qname:     "example.com.",
			qtype:     dns.TypeA,
			wantType:  dns.TypeA,
			wantValue: "192.168.1.1",
		},
		{
			name:      "AAAA record from CSV",
			qname:     "example.com.",
			qtype:     dns.TypeAAAA,
			wantType:  dns.TypeAAAA,
			wantValue: "2001:db8::1",
		},
		{
			name:      "TXT record from CSV",
			qname:     "example.com.",
			qtype:     dns.TypeTXT,
			wantType:  dns.TypeTXT,
			wantValue: "This is a test",
		},
		{
			name:      "CNAME record from CSV",
			qname:     "www.example.com.",
			qtype:     dns.TypeCNAME,
			wantType:  dns.TypeCNAME,
			wantValue: "example.com.",
		},
		{
			name:      "Wildcard record from CSV",
			qname:     "test.wildcard.com.",
			qtype:     dns.TypeA,
			wantType:  dns.TypeA,
			wantValue: "192.168.1.2",
		},
		{
			name:      "Fallback to reflection",
			qname:     "192.168.1.1.example.com.",
			qtype:     dns.TypeA,
			wantType:  dns.TypeA,
			wantValue: "192.168.1.1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a mock DNS request
			req := new(dns.Msg)
			req.SetQuestion(tt.qname, tt.qtype)

			// Create a mock ResponseWriter
			w := &mockResponseWriter{}

			// Process the request
			handleDNSRequest(w, req)

			// Check the response
			if w.msg == nil {
				t.Fatal("No response received")
			}

			// Check the answer section of the response
			if len(w.msg.Answer) == 0 {
				t.Errorf("Expected at least one answer, got none")
				return
			}

			// Check answer type
			if w.msg.Answer[0].Header().Rrtype != tt.wantType {
				t.Errorf("Expected record type %d, got %d", tt.wantType, w.msg.Answer[0].Header().Rrtype)
			}

			// Check record value based on type
			switch tt.wantType {
			case dns.TypeA:
				a, ok := w.msg.Answer[0].(*dns.A)
				if !ok {
					t.Errorf("Expected *dns.A, got %T", w.msg.Answer[0])
					return
				}
				if a.A.String() != tt.wantValue {
					t.Errorf("Expected IP %s, got %s", tt.wantValue, a.A.String())
				}
			case dns.TypeAAAA:
				aaaa, ok := w.msg.Answer[0].(*dns.AAAA)
				if !ok {
					t.Errorf("Expected *dns.AAAA, got %T", w.msg.Answer[0])
					return
				}
				if aaaa.AAAA.String() != tt.wantValue {
					t.Errorf("Expected IP %s, got %s", tt.wantValue, aaaa.AAAA.String())
				}
			case dns.TypeTXT:
				txt, ok := w.msg.Answer[0].(*dns.TXT)
				if !ok {
					t.Errorf("Expected *dns.TXT, got %T", w.msg.Answer[0])
					return
				}
				if len(txt.Txt) != 1 || txt.Txt[0] != tt.wantValue {
					t.Errorf("Expected txt %s, got %v", tt.wantValue, txt.Txt)
				}
			case dns.TypeCNAME:
				cname, ok := w.msg.Answer[0].(*dns.CNAME)
				if !ok {
					t.Errorf("Expected *dns.CNAME, got %T", w.msg.Answer[0])
					return
				}
				if cname.Target != tt.wantValue {
					t.Errorf("Expected target %s, got %s", tt.wantValue, cname.Target)
				}
			}
		})
	}

	// Test NXDOMAIN response with SOA record in authority section
	t.Run("NXDOMAIN response with SOA", func(t *testing.T) {
		// Create a mock DNS request for a non-existent domain
		req := new(dns.Msg)
		req.SetQuestion("nonexistent.example.com.", dns.TypeA)

		// Create a mock ResponseWriter
		w := &mockResponseWriter{}

		// Process the request
		handleDNSRequest(w, req)

		// Check the response
		if w.msg == nil {
			t.Fatal("No response received")
		}

		// Check that there are no answers
		if len(w.msg.Answer) != 0 {
			t.Errorf("Expected 0 answers, got %d", len(w.msg.Answer))
		}

		// Check that the response code is NXDOMAIN
		if w.msg.Rcode != dns.RcodeNameError {
			t.Errorf("Expected response code %d (NXDOMAIN), got %d", dns.RcodeNameError, w.msg.Rcode)
		}

		// Check that there is an SOA record in the authority section
		if len(w.msg.Ns) == 0 {
			t.Errorf("Expected at least one record in authority section, got none")
		} else {
			soa, ok := w.msg.Ns[0].(*dns.SOA)
			if !ok {
				t.Errorf("Expected *dns.SOA in authority section, got %T", w.msg.Ns[0])
			} else {
				// Verify SOA record fields
				if soa.Hdr.Name != "example.com." {
					t.Errorf("Expected SOA name example.com., got %s", soa.Hdr.Name)
				}
				if soa.Ns != "ns1.example.com." {
					t.Errorf("Expected SOA primary NS ns1.example.com., got %s", soa.Ns)
				}
				if soa.Mbox != "admin.example.com." {
					t.Errorf("Expected SOA admin email admin.example.com., got %s", soa.Mbox)
				}
				if soa.Serial != 2025050801 {
					t.Errorf("Expected SOA serial 2025050801, got %d", soa.Serial)
				}
			}
		}
	})
}

// Test IPv4 address parsing
func TestParseReflectIPv4(t *testing.T) {
	tests := []struct {
		name     string
		qname    string
		wantIP   net.IP
		wantBool bool
	}{
		{
			name:     "Valid IPv4 address",
			qname:    "192.168.1.1.example.com.",
			wantIP:   net.ParseIP("192.168.1.1").To4(),
			wantBool: true,
		},
		{
			name:     "Invalid IPv4 address",
			qname:    "192.168.1.example.com.",
			wantIP:   nil,
			wantBool: false,
		},
		{
			name:     "Non-IP format",
			qname:    "example.com.",
			wantIP:   nil,
			wantBool: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotIP, gotBool := parseReflectIPv4(tt.qname)
			if tt.wantBool != gotBool {
				t.Errorf("parseReflectIPv4() return value = %v, expected %v", gotBool, tt.wantBool)
			}
			if tt.wantBool && !tt.wantIP.Equal(gotIP) {
				t.Errorf("parseReflectIPv4() IP = %v, expected %v", gotIP, tt.wantIP)
			}
		})
	}
}

// Test IPv6 address parsing
func TestParseReflectIPv6(t *testing.T) {
	tests := []struct {
		name     string
		qname    string
		wantIP   net.IP
		wantBool bool
	}{
		{
			name:     "Complete format",
			qname:    "2001-0db8-85a3-0000-0000-8a2e-0370-7334.example.com.",
			wantIP:   net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334"),
			wantBool: true,
		},
		{
			name:     "Omitted leading zeros",
			qname:    "2001-db8-85a3-0-0-8a2e-370-7334.example.com.",
			wantIP:   net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334"),
			wantBool: true,
		},
		{
			name:     "Using z to represent zero groups",
			qname:    "2001-db8-85a3-z-8a2e-370-7334.example.com.",
			wantIP:   net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334"),
			wantBool: true,
		},
		{
			name:     "Invalid IPv6 address",
			qname:    "not-an-ip.example.com.",
			wantIP:   nil,
			wantBool: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotIP, gotBool := parseReflectIPv6(tt.qname)
			if tt.wantBool != gotBool {
				t.Errorf("parseReflectIPv6() return value = %v, expected %v", gotBool, tt.wantBool)
			}
			if tt.wantBool && !tt.wantIP.Equal(gotIP) {
				t.Errorf("parseReflectIPv6() IP = %v, expected %v", gotIP, tt.wantIP)
			}
		})
	}
}

// Test compressed IPv6 notation parsing
func TestParseCompressedIPv6(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantIP   net.IP
		wantBool bool
	}{
		{
			name:     "Front compression",
			input:    "z-1-2-3-4-5-6",
			wantIP:   net.ParseIP("0000:0000:0001:0002:0003:0004:0005:0006"),
			wantBool: true,
		},
		{
			name:     "Middle compression",
			input:    "1-2-z-5-6-7-8",
			wantIP:   net.ParseIP("0001:0002:0000:0000:0005:0006:0007:0008"),
			wantBool: true,
		},
		{
			name:     "End compression",
			input:    "1-2-3-4-5-z",
			wantIP:   net.ParseIP("0001:0002:0003:0004:0005:0000:0000:0000"),
			wantBool: true,
		},
		{
			name:     "Invalid compression",
			input:    "1-2-z-4-z-7-8",
			wantIP:   nil,
			wantBool: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotIP, gotBool := parseCompressedIPv6(tt.input)
			if tt.wantBool != gotBool {
				t.Errorf("parseCompressedIPv6() return value = %v, expected %v", gotBool, tt.wantBool)
			}
			if tt.wantBool && !tt.wantIP.Equal(gotIP) {
				t.Errorf("parseCompressedIPv6() IP = %v, expected %v", gotIP, tt.wantIP)
			}
		})
	}
}

// Test DNS request handling
func TestHandleDNSRequest(t *testing.T) {
	// Create a mock DNS request
	req := new(dns.Msg)
	req.SetQuestion("192.168.1.1.example.com.", dns.TypeA)

	// Create a mock ResponseWriter
	w := &mockResponseWriter{}

	// Process the request
	handleDNSRequest(w, req)

	// Check the response
	if w.msg == nil {
		t.Fatal("No response received")
	}

	// Check the answer section of the response
	if len(w.msg.Answer) != 1 {
		t.Errorf("Expected 1 answer, got %d", len(w.msg.Answer))
	} else {
		// Check answer type
		if _, ok := w.msg.Answer[0].(*dns.A); !ok {
			t.Errorf("Expected A record, got %T", w.msg.Answer[0])
		}

		// Check IP address
		a := w.msg.Answer[0].(*dns.A)
		expectedIP := net.ParseIP("192.168.1.1").To4()
		if !a.A.Equal(expectedIP) {
			t.Errorf("Expected IP %v, got %v", expectedIP, a.A)
		}
	}
}

// Mock ResponseWriter
type mockResponseWriter struct {
	msg *dns.Msg
}

func (m *mockResponseWriter) LocalAddr() net.Addr {
	return &net.UDPAddr{IP: net.ParseIP("127.0.0.1"), Port: 53}
}

func (m *mockResponseWriter) RemoteAddr() net.Addr {
	return &net.UDPAddr{IP: net.ParseIP("127.0.0.1"), Port: 1234}
}

func (m *mockResponseWriter) WriteMsg(msg *dns.Msg) error {
	m.msg = msg
	return nil
}

func (m *mockResponseWriter) Write([]byte) (int, error) {
	return 0, nil
}

func (m *mockResponseWriter) Close() error {
	return nil
}

func (m *mockResponseWriter) TsigStatus() error {
	return nil
}

func (m *mockResponseWriter) TsigTimersOnly(bool) {
}

func (m *mockResponseWriter) Hijack() {
}

// Test helper functions
func TestRemoveEmptyStrings(t *testing.T) {
	tests := []struct {
		name  string
		input []string
		want  []string
	}{
		{
			name:  "With empty strings",
			input: []string{"a", "", "b", "", "c"},
			want:  []string{"a", "b", "c"},
		},
		{
			name:  "No empty strings",
			input: []string{"a", "b", "c"},
			want:  []string{"a", "b", "c"},
		},
		{
			name:  "All empty strings",
			input: []string{"", "", ""},
			want:  []string{},
		},
		{
			name:  "Empty slice",
			input: []string{},
			want:  []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := removeEmptyStrings(tt.input)
			if len(got) != len(tt.want) {
				t.Errorf("removeEmptyStrings() length = %v, expected %v", len(got), len(tt.want))
			}
			for i := range got {
				if got[i] != tt.want[i] {
					t.Errorf("removeEmptyStrings()[%d] = %v, expected %v", i, got[i], tt.want[i])
				}
			}
		})
	}
}

// Test IPv6 notation expansion
func TestExpandIPv6Notation(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  net.IP
	}{
		{
			name:  "Hyphen separated",
			input: "2001-db8-85a3-0-0-8a2e-370-7334",
			want:  net.ParseIP("2001:db8:85a3:0:0:8a2e:370:7334"),
		},
		{
			name:  "Underscore separated",
			input: "2001_db8_85a3_0_0_8a2e_370_7334",
			want:  net.ParseIP("2001:db8:85a3:0:0:8a2e:370:7334"),
		},
		{
			name:  "Dot separated",
			input: "2001.db8.85a3.0.0.8a2e.370.7334",
			want:  net.ParseIP("2001:db8:85a3:0:0:8a2e:370:7334"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := expandIPv6Notation(tt.input)
			gotIP := net.ParseIP(got)
			if gotIP == nil || !gotIP.Equal(tt.want) {
				t.Errorf("expandIPv6Notation() = %v (parsed as %v), expected %v", got, gotIP, tt.want)
			}
		})
	}
}

// Separately test z compression format, as this format's output may have multiple representations
func TestExpandIPv6NotationWithZCompression(t *testing.T) {
	input := "2001-db8-z-8a2e-370-7334"

	// Directly test parseReflectIPv6 function, as this is where expandIPv6Notation is actually used
	gotIP, gotBool := parseReflectIPv6(input + ".example.com.")

	if !gotBool {
		t.Errorf("parseReflectIPv6() return value = %v, expected true", gotBool)
	}

	// Check if IP is correct, not concerned with the exact string representation
	expectedIP := net.ParseIP("2001:db8::8a2e:370:7334")
	if !gotIP.Equal(expectedIP) {
		t.Errorf("parseReflectIPv6() IP = %v, expected %v", gotIP, expectedIP)
	}
}

// Test Base32 encoded IPv4 address parsing
func TestBase32ToIPv4(t *testing.T) {
	tests := []struct {
		name     string
		b32Str   string
		wantIP   net.IP
		wantBool bool
	}{
		{
			name:     "Valid Base32 encoded IPv4",
			b32Str:   "AEBAGBA8", // Base32 encoding of 1.2.3.4, with 8 replacing =
			wantIP:   net.ParseIP("1.2.3.4").To4(),
			wantBool: true,
		},
		{
			name:     "Valid Base32 encoded IPv4 with lowercase",
			b32Str:   "aebagba8", // Lowercase version of the same encoding
			wantIP:   net.ParseIP("1.2.3.4").To4(),
			wantBool: true,
		},
		{
			name:     "Valid Base32 encoded IPv4 with mixed case",
			b32Str:   "AebAgBa8", // Mixed case version
			wantIP:   net.ParseIP("1.2.3.4").To4(),
			wantBool: true,
		},
		{
			name:     "Invalid Base32 encoding",
			b32Str:   "INVALID1", // '1' is not in Base32 character set
			wantIP:   nil,
			wantBool: false,
		},
		{
			name:     "Base32 encoding with incorrect length",
			b32Str:   "AAAA8",
			wantIP:   nil,
			wantBool: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotIP, gotBool := base32ToIPv4(tt.b32Str)
			if tt.wantBool != gotBool {
				t.Errorf("base32ToIPv4() return value = %v, expected %v", gotBool, tt.wantBool)
			}
			if tt.wantBool && !tt.wantIP.Equal(gotIP) {
				t.Errorf("base32ToIPv4() IP = %v, expected %v", gotIP, tt.wantIP)
			}
		})
	}
}

// Test Base32 encoded IPv6 address parsing
func TestBase32ToIPv6(t *testing.T) {
	tests := []struct {
		name     string
		b32Str   string
		wantIP   net.IP
		wantBool bool
	}{
		{
			name:     "Valid Base32 encoded IPv6",
			b32Str:   "EAAQ3OEFUMAAAAAARIXAG4DTGQ888888", // Base32 encoding of 2001:0db8:85a3:0000:0000:8a2e:0370:7334
			wantIP:   net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334"),
			wantBool: true,
		},
		{
			name:     "Valid Base32 encoded IPv6 with lowercase",
			b32Str:   "eaaq3oefumaaaaaarixag4dtgq888888", // Lowercase version
			wantIP:   net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334"),
			wantBool: true,
		},
		{
			name:     "Valid Base32 encoded IPv6 with mixed case",
			b32Str:   "EaAq3OeFuMaAaAaArIxAg4DtGq888888", // Mixed case version
			wantIP:   net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334"),
			wantBool: true,
		},
		{
			name:     "Invalid Base32 encoding",
			b32Str:   "INVALID8888888888888888888888888888",
			wantIP:   nil,
			wantBool: false,
		},
		{
			name:     "Base32 encoding with incorrect length",
			b32Str:   "AAAA8",
			wantIP:   nil,
			wantBool: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotIP, gotBool := base32ToIPv6(tt.b32Str)
			if tt.wantBool != gotBool {
				t.Errorf("base32ToIPv6() return value = %v, expected %v", gotBool, tt.wantBool)
			}
			if tt.wantBool && !tt.wantIP.Equal(gotIP) {
				t.Errorf("base32ToIPv6() IP = %v, expected %v", gotIP, tt.wantIP)
			}
		})
	}
}

// Test dual-stack address parsing
func TestParseDualStackAddress(t *testing.T) {
	// Create a 40-character prefix, first 8 characters are Base32 encoding of IPv4, remaining 32 characters are Base32 encoding of IPv6
	dualStackPrefix := "AEBAGBA8EAAQ3OEFUMAAAAAARIXAG4DTGQ888888"
	domain := "example.com."
	qname := dualStackPrefix + "." + domain

	// Test TypeA query
	t.Run("TypeA query", func(t *testing.T) {
		gotIP, gotBool := parseDualStackAddress(qname, dns.TypeA)
		if !gotBool {
			t.Errorf("parseDualStackAddress() return value = %v, expected true", gotBool)
		}
		expectedIP := net.ParseIP("1.2.3.4").To4()
		if !gotIP.Equal(expectedIP) {
			t.Errorf("parseDualStackAddress() IP = %v, expected %v", gotIP, expectedIP)
		}
	})

	// Test TypeAAAA query
	t.Run("TypeAAAA query", func(t *testing.T) {
		gotIP, gotBool := parseDualStackAddress(qname, dns.TypeAAAA)
		if !gotBool {
			t.Errorf("parseDualStackAddress() return value = %v, expected true", gotBool)
		}
		expectedIP := net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
		if !gotIP.Equal(expectedIP) {
			t.Errorf("parseDualStackAddress() IP = %v, expected %v", gotIP, expectedIP)
		}
	})

	// Test with lowercase prefix
	lowercasePrefix := "aebagba8eaaq3oefumaaaaaarixag4dtgq888888"
	lowercaseQname := lowercasePrefix + "." + domain

	// Test TypeA query with lowercase
	t.Run("TypeA query with lowercase", func(t *testing.T) {
		gotIP, gotBool := parseDualStackAddress(lowercaseQname, dns.TypeA)
		if !gotBool {
			t.Errorf("parseDualStackAddress() return value = %v, expected true", gotBool)
		}
		expectedIP := net.ParseIP("1.2.3.4").To4()
		if !gotIP.Equal(expectedIP) {
			t.Errorf("parseDualStackAddress() IP = %v, expected %v", gotIP, expectedIP)
		}
	})

	// Test TypeAAAA query with lowercase
	t.Run("TypeAAAA query with lowercase", func(t *testing.T) {
		gotIP, gotBool := parseDualStackAddress(lowercaseQname, dns.TypeAAAA)
		if !gotBool {
			t.Errorf("parseDualStackAddress() return value = %v, expected true", gotBool)
		}
		expectedIP := net.ParseIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
		if !gotIP.Equal(expectedIP) {
			t.Errorf("parseDualStackAddress() IP = %v, expected %v", gotIP, expectedIP)
		}
	})

	// Test invalid prefix length
	t.Run("Invalid prefix length", func(t *testing.T) {
		_, gotBool := parseDualStackAddress("short."+domain, dns.TypeA)
		if gotBool {
			t.Errorf("parseDualStackAddress() return value = %v, expected false", gotBool)
		}
	})
}
