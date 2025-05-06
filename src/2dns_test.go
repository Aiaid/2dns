package main

import (
	"net"
	"testing"

	"github.com/miekg/dns"
)

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
			name:     "Invalid Base32 encoding",
			b32Str:   "INVALID8",
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
			b32Str:   "ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS", // Base32 encoding of 2001:0db8:85a3:0000:0000:8a2e:0370:7334
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
	dualStackPrefix := "AEBAGBA8ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS"
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

	// Test invalid prefix length
	t.Run("Invalid prefix length", func(t *testing.T) {
		_, gotBool := parseDualStackAddress("short."+domain, dns.TypeA)
		if gotBool {
			t.Errorf("parseDualStackAddress() return value = %v, expected false", gotBool)
		}
	})
}
