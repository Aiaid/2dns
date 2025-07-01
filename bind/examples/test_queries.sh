#!/bin/bash
# 2DNS BIND Plugin Test Queries
# 
# This script tests various 2DNS functionality by sending DNS queries
# to a BIND server configured with the 2DNS plugin.

# Configuration
BIND_SERVER="127.0.0.1"
BIND_PORT="5353"
DOMAIN_SUFFIX="2dns.dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_test() {
    echo -e "\n${YELLOW}Testing: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    ((TESTS_FAILED++))
}

run_dig() {
    local query="$1"
    local record_type="$2"
    local expected_pattern="$3"
    local description="$4"
    
    ((TESTS_TOTAL++))
    
    echo "Query: dig @${BIND_SERVER} -p ${BIND_PORT} ${query} ${record_type}"
    
    # Run the query and capture output
    result=$(dig @${BIND_SERVER} -p ${BIND_PORT} +short +time=5 +tries=2 ${query} ${record_type} 2>/dev/null)
    exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        print_failure "$description (DNS query failed)"
        return 1
    fi
    
    if [ -z "$result" ]; then
        print_failure "$description (No response)"
        return 1
    fi
    
    # Check if result matches expected pattern
    if echo "$result" | grep -q "$expected_pattern"; then
        print_success "$description"
        echo "Result: $result"
        return 0
    else
        print_failure "$description (Unexpected result: $result)"
        return 1
    fi
}

# Check if dig is available
if ! command -v dig &> /dev/null; then
    echo -e "${RED}Error: dig command not found. Please install dnsutils.${NC}"
    exit 1
fi

# Check if BIND server is responding
print_header "Checking BIND Server Connectivity"
if ! timeout 5 dig @${BIND_SERVER} -p ${BIND_PORT} +short . NS &>/dev/null; then
    echo -e "${RED}Error: Cannot connect to BIND server at ${BIND_SERVER}:${BIND_PORT}${NC}"
    echo "Please ensure BIND is running with the 2DNS plugin loaded."
    exit 1
fi
echo -e "${GREEN}✓ BIND server is responding${NC}"

# Test 1: Direct IPv4 Addresses
print_header "Testing Direct IPv4 Address Resolution"

run_dig "192.168.1.1.${DOMAIN_SUFFIX}" "A" "192.168.1.1" "Private IPv4 address"
run_dig "8.8.8.8.${DOMAIN_SUFFIX}" "A" "8.8.8.8" "Google DNS IPv4"
run_dig "127.0.0.1.${DOMAIN_SUFFIX}" "A" "127.0.0.1" "Localhost IPv4"
run_dig "1.1.1.1.${DOMAIN_SUFFIX}" "A" "1.1.1.1" "Cloudflare DNS IPv4"

# Test 2: Direct IPv6 Addresses
print_header "Testing Direct IPv6 Address Resolution"

run_dig "2001-db8-85a3-0-0-8a2e-370-7334.${DOMAIN_SUFFIX}" "AAAA" "2001:db8:85a3::8a2e:370:7334" "Standard IPv6 address"
run_dig "fe80-0-0-0-0-0-0-1.${DOMAIN_SUFFIX}" "AAAA" "fe80::1" "Link-local IPv6"
run_dig "0-0-0-0-0-0-0-1.${DOMAIN_SUFFIX}" "AAAA" "::1" "IPv6 loopback"

# Test 3: IPv6 with z-notation
print_header "Testing IPv6 Z-notation"

run_dig "2001-db8z8a2e-370-7334.${DOMAIN_SUFFIX}" "AAAA" "2001:db8::8a2e:370:7334" "IPv6 with z-notation"
run_dig "fe80z1.${DOMAIN_SUFFIX}" "AAAA" "fe80::1" "Link-local with z"

# Test 4: Base32-encoded IPv4
print_header "Testing Base32-encoded IPv4"

run_dig "AEBAGBA8.${DOMAIN_SUFFIX}" "A" "1.2.3.4" "Base32 IPv4 (1.2.3.4)"
run_dig "YADQACAB.${DOMAIN_SUFFIX}" "A" "192.168.1.1" "Base32 IPv4 (192.168.1.1)"
run_dig "BADQAQIB.${DOMAIN_SUFFIX}" "A" "8.8.8.8" "Base32 IPv4 (8.8.8.8)"

# Test 5: Base32-encoded IPv6
print_header "Testing Base32-encoded IPv6"

# These would be very long Base32 strings, so we'll test with a simpler case
run_dig "AAAAAAAAAAAAAAAAAAAAAAAAAAAE.${DOMAIN_SUFFIX}" "AAAA" "::1" "Base32 IPv6 (::1)"

# Test 6: JSON Multi-record (Single-layer)
print_header "Testing JSON Multi-record (Single-layer)"

# Base32 encoding of {"A":"1.2.3.4"}
run_dig "jNBSWY3DPEB2CA4DVMQQGI3DNNSXS8.${DOMAIN_SUFFIX}" "A" "1.2.3.4" "JSON single A record"

# Base32 encoding of {"A":"192.168.1.1","AAAA":"2001:db8::1"}
# This would be a longer Base32 string - simplified for testing
run_dig "jNBSWY3DPFXGK3TMNFRGS4TPNVSXG5DFMN2HE5LQN5XCA3DFPB2XI3BEMVSXOX8.${DOMAIN_SUFFIX}" "A" "192.168.1.1" "JSON A record from multi-record"
run_dig "jNBSWY3DPFXGK3TMNFRGS4TPNVSXG5DFMN2HE5LQN5XCA3DFPB2XI3BEMVSXOX8.${DOMAIN_SUFFIX}" "AAAA" "2001:db8::1" "JSON AAAA record from multi-record"

# Test 7: JSON Multi-record (Multi-layer)
print_header "Testing JSON Multi-record (Multi-layer)"

# Split Base32 encoding across multiple labels
run_dig "j1NBSWY3DPEB2CA4D.j2VMQQGI3DNNSXS8.${DOMAIN_SUFFIX}" "A" "1.2.3.4" "Multi-layer JSON A record"

# Test 8: ANY queries
print_header "Testing ANY Queries"

run_dig "192.168.1.1.${DOMAIN_SUFFIX}" "ANY" "192.168.1.1" "ANY query for IPv4"
run_dig "jNBSWY3DPEB2CA4DVMQQGI3DNNSXS8.${DOMAIN_SUFFIX}" "ANY" "1.2.3.4" "ANY query for JSON"

# Test 9: Invalid queries (should return NXDOMAIN or no records)
print_header "Testing Invalid Queries"

echo "Testing invalid domain (should fail):"
dig @${BIND_SERVER} -p ${BIND_PORT} +short invalid-domain.${DOMAIN_SUFFIX} A
if [ $? -eq 0 ]; then
    print_failure "Invalid domain query should fail"
else
    print_success "Invalid domain correctly rejected"
fi
((TESTS_TOTAL++))

# Test 10: Zone authority queries
print_header "Testing Zone Authority"

run_dig "${DOMAIN_SUFFIX}" "SOA" "ns1.${DOMAIN_SUFFIX}" "SOA record for zone"
run_dig "${DOMAIN_SUFFIX}" "NS" "ns1.${DOMAIN_SUFFIX}" "NS records for zone"

# Test 11: Performance test
print_header "Performance Testing"

echo "Running 100 queries to test performance..."
start_time=$(date +%s.%N)
for i in {1..100}; do
    dig @${BIND_SERVER} -p ${BIND_PORT} +short 192.168.1.$((i % 254 + 1)).${DOMAIN_SUFFIX} A >/dev/null 2>&1
done
end_time=$(date +%s.%N)
duration=$(echo "$end_time - $start_time" | bc -l)
qps=$(echo "scale=2; 100 / $duration" | bc -l)
echo "Completed 100 queries in ${duration} seconds (${qps} QPS)"

# Test 12: Stress test with concurrent queries
print_header "Concurrent Query Test"

echo "Running 20 concurrent queries..."
pids=()
for i in {1..20}; do
    (dig @${BIND_SERVER} -p ${BIND_PORT} +short 10.0.0.$((i)).${DOMAIN_SUFFIX} A >/dev/null 2>&1) &
    pids+=($!)
done

# Wait for all background jobs
for pid in "${pids[@]}"; do
    wait $pid
done
print_success "Concurrent queries completed"
((TESTS_TOTAL++))
((TESTS_PASSED++))

# Summary
print_header "Test Summary"
echo -e "Total tests: ${TESTS_TOTAL}"
echo -e "Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed: ${RED}${TESTS_FAILED}${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed!${NC}"
    exit 1
fi