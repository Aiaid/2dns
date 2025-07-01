#!/bin/bash
# 2DNS BIND Plugin Performance Test Script
# 
# This script measures the performance of the 2DNS plugin under various loads
# and query patterns to validate it can handle production traffic.

# Configuration
BIND_SERVER="${BIND_SERVER:-127.0.0.1}"
BIND_PORT="${BIND_PORT:-53}"
DOMAIN_SUFFIX="2dns.dev"
OUTPUT_DIR="./performance_results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Test parameters
WARMUP_QUERIES=100
PERFORMANCE_QUERIES=1000
CONCURRENT_CLIENTS=(1 5 10 20 50 100)
QUERY_TYPES=("ipv4" "ipv6" "base32_ipv4" "json_single" "json_multi")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Utility functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check requirements
check_requirements() {
    local missing=()
    
    if ! command -v dig &> /dev/null; then
        missing+=("dig")
    fi
    
    if ! command -v bc &> /dev/null; then
        missing+=("bc")
    fi
    
    if ! command -v time &> /dev/null; then
        missing+=("time")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}Missing required tools: ${missing[*]}${NC}"
        exit 1
    fi
}

# Setup output directory
setup_output() {
    mkdir -p "$OUTPUT_DIR"
    echo "Performance test started at $(date)" > "$OUTPUT_DIR/test_${TIMESTAMP}.log"
}

# Generate test queries for different types
generate_queries() {
    local query_type="$1"
    local count="$2"
    local output_file="$3"
    
    case "$query_type" in
        "ipv4")
            for ((i=1; i<=count; i++)); do
                local ip="192.168.$((i % 255)).$((i % 255))"
                echo "${ip}.${DOMAIN_SUFFIX} A"
            done > "$output_file"
            ;;
        "ipv6")
            for ((i=1; i<=count; i++)); do
                local hex=$(printf "%04x" $((i % 65536)))
                echo "2001-db8-${hex}-0-0-0-0-1.${DOMAIN_SUFFIX} AAAA"
            done > "$output_file"
            ;;
        "base32_ipv4")
            # Pre-computed Base32 values for common IPs
            local base32_ips=("AEBAGBA8" "YADQACAB" "BADQAQIB" "QEBAGBAFAYDQMCIB")
            for ((i=1; i<=count; i++)); do
                local base32="${base32_ips[$((i % ${#base32_ips[@]}))]}"
                echo "${base32}.${DOMAIN_SUFFIX} A"
            done > "$output_file"
            ;;
        "json_single")
            # Single-layer JSON queries
            local json_queries=("jNBSWY3DPEB2CA4DVMQQGI3DNNSXS8")
            for ((i=1; i<=count; i++)); do
                local query="${json_queries[0]}"
                echo "${query}.${DOMAIN_SUFFIX} A"
            done > "$output_file"
            ;;
        "json_multi")
            # Multi-layer JSON queries
            for ((i=1; i<=count; i++)); do
                echo "j1NBSWY3DPEB2CA4D.j2VMQQGI3DNNSXS8.${DOMAIN_SUFFIX} A"
            done > "$output_file"
            ;;
    esac
}

# Run single query and measure time
time_single_query() {
    local domain="$1"
    local record_type="$2"
    
    local start_time=$(date +%s.%N)
    dig @${BIND_SERVER} -p ${BIND_PORT} +short +time=5 +tries=1 "$domain" "$record_type" >/dev/null 2>&1
    local exit_code=$?
    local end_time=$(date +%s.%N)
    
    if [ $exit_code -eq 0 ]; then
        echo "$end_time - $start_time" | bc -l
    else
        echo "ERROR"
    fi
}

# Run concurrent queries
run_concurrent_test() {
    local query_file="$1"
    local concurrent_clients="$2"
    local output_file="$3"
    
    print_info "Running test with $concurrent_clients concurrent clients..."
    
    local temp_dir=$(mktemp -d)
    local pids=()
    local start_time=$(date +%s.%N)
    
    # Start concurrent clients
    for ((client=1; client<=concurrent_clients; client++)); do
        (
            local client_times=()
            while IFS=' ' read -r domain record_type; do
                local query_time=$(time_single_query "$domain" "$record_type")
                if [ "$query_time" != "ERROR" ]; then
                    echo "$query_time" >> "$temp_dir/client_${client}.times"
                fi
            done < "$query_file"
        ) &
        pids+=($!)
    done
    
    # Wait for all clients to complete
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    local end_time=$(date +%s.%N)
    local total_time=$(echo "$end_time - $start_time" | bc -l)
    
    # Collect and analyze results
    local all_times_file="$temp_dir/all_times.txt"
    cat "$temp_dir"/client_*.times > "$all_times_file" 2>/dev/null
    
    local total_queries=$(wc -l < "$all_times_file" 2>/dev/null || echo "0")
    local successful_queries=$total_queries
    
    if [ "$total_queries" -gt 0 ]; then
        local avg_time=$(awk '{sum+=$1} END {print sum/NR}' "$all_times_file")
        local min_time=$(sort -n "$all_times_file" | head -1)
        local max_time=$(sort -n "$all_times_file" | tail -1)
        local qps=$(echo "scale=2; $total_queries / $total_time" | bc -l)
        
        # Calculate percentiles
        local p50=$(sort -n "$all_times_file" | awk -v p=50 'NR==int((NR+1)*p/100){print $1}')
        local p95=$(sort -n "$all_times_file" | awk -v p=95 'NR==int((NR+1)*p/100){print $1}')
        local p99=$(sort -n "$all_times_file" | awk -v p=99 'NR==int((NR+1)*p/100){print $1}')
        
        # Write results
        {
            echo "Concurrent Clients: $concurrent_clients"
            echo "Total Time: ${total_time}s"
            echo "Total Queries: $total_queries"
            echo "Successful Queries: $successful_queries"
            echo "Queries Per Second: $qps"
            echo "Average Response Time: ${avg_time}s"
            echo "Min Response Time: ${min_time}s"
            echo "Max Response Time: ${max_time}s"
            echo "50th Percentile: ${p50}s"
            echo "95th Percentile: ${p95}s"
            echo "99th Percentile: ${p99}s"
            echo ""
        } >> "$output_file"
        
        echo "$concurrent_clients,$total_time,$total_queries,$successful_queries,$qps,$avg_time,$min_time,$max_time,$p50,$p95,$p99"
    else
        echo "$concurrent_clients,$total_time,0,0,0,0,0,0,0,0,0"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
}

# Warmup test
run_warmup() {
    print_header "Warming up DNS cache and plugin..."
    
    local warmup_file=$(mktemp)
    generate_queries "ipv4" $WARMUP_QUERIES "$warmup_file"
    
    local start_time=$(date +%s.%N)
    while IFS=' ' read -r domain record_type; do
        dig @${BIND_SERVER} -p ${BIND_PORT} +short "$domain" "$record_type" >/dev/null 2>&1
    done < "$warmup_file"
    local end_time=$(date +%s.%N)
    
    local warmup_time=$(echo "$end_time - $start_time" | bc -l)
    print_success "Warmup completed in ${warmup_time}s"
    
    rm -f "$warmup_file"
}

# Run performance test for a specific query type
test_query_type() {
    local query_type="$1"
    
    print_header "Testing Query Type: $query_type"
    
    local query_file="$OUTPUT_DIR/queries_${query_type}_${TIMESTAMP}.txt"
    local results_file="$OUTPUT_DIR/results_${query_type}_${TIMESTAMP}.txt"
    local csv_file="$OUTPUT_DIR/results_${query_type}_${TIMESTAMP}.csv"
    
    # Generate queries
    generate_queries "$query_type" $PERFORMANCE_QUERIES "$query_file"
    
    # CSV header
    echo "Concurrent_Clients,Total_Time,Total_Queries,Successful_Queries,QPS,Avg_Time,Min_Time,Max_Time,P50,P95,P99" > "$csv_file"
    
    # Test with different concurrency levels
    for clients in "${CONCURRENT_CLIENTS[@]}"; do
        local csv_line=$(run_concurrent_test "$query_file" $clients "$results_file")
        echo "$csv_line" >> "$csv_file"
    done
    
    print_success "Completed testing for $query_type"
}

# Generate performance report
generate_report() {
    local report_file="$OUTPUT_DIR/performance_report_${TIMESTAMP}.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>2DNS Plugin Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #e7f3ff; padding: 15px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #0066cc; }
        .metric-label { font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <h1>2DNS BIND Plugin Performance Report</h1>
    <p>Generated on: $(date)</p>
    <p>Server: ${BIND_SERVER}:${BIND_PORT}</p>
    
    <div class="summary">
        <h2>Test Summary</h2>
        <p>This report shows the performance characteristics of the 2DNS BIND plugin 
        under various load conditions and query types.</p>
    </div>
    
    <h2>Test Configuration</h2>
    <ul>
        <li>Warmup Queries: $WARMUP_QUERIES</li>
        <li>Performance Queries per Test: $PERFORMANCE_QUERIES</li>
        <li>Concurrent Client Levels: ${CONCURRENT_CLIENTS[*]}</li>
        <li>Query Types Tested: ${QUERY_TYPES[*]}</li>
    </ul>
EOF

    # Add results for each query type
    for query_type in "${QUERY_TYPES[@]}"; do
        local csv_file="$OUTPUT_DIR/results_${query_type}_${TIMESTAMP}.csv"
        if [ -f "$csv_file" ]; then
            echo "<h2>Results: $query_type</h2>" >> "$report_file"
            echo "<table>" >> "$report_file"
            
            # Convert CSV to HTML table
            head -1 "$csv_file" | sed 's/,/<\/th><th>/g; s/^/<tr><th>/; s/$/<\/th><\/tr>/' >> "$report_file"
            tail -n +2 "$csv_file" | sed 's/,/<\/td><td>/g; s/^/<tr><td>/; s/$/<\/td><\/tr>/' >> "$report_file"
            
            echo "</table>" >> "$report_file"
        fi
    done

    cat >> "$report_file" << EOF
    <h2>Notes</h2>
    <ul>
        <li>QPS: Queries Per Second</li>
        <li>All times are in seconds</li>
        <li>P50, P95, P99: 50th, 95th, and 99th percentile response times</li>
        <li>Higher QPS is better, lower response times are better</li>
    </ul>
</body>
</html>
EOF

    print_success "Performance report generated: $report_file"
}

# Main test execution
main() {
    print_header "2DNS BIND Plugin Performance Testing"
    
    check_requirements
    setup_output
    
    # Check if server is responding
    if ! dig @${BIND_SERVER} -p ${BIND_PORT} +short +time=5 . NS >/dev/null 2>&1; then
        echo -e "${RED}Error: Cannot connect to BIND server at ${BIND_SERVER}:${BIND_PORT}${NC}"
        exit 1
    fi
    
    print_success "Connected to BIND server at ${BIND_SERVER}:${BIND_PORT}"
    
    # Run warmup
    run_warmup
    
    # Test each query type
    for query_type in "${QUERY_TYPES[@]}"; do
        test_query_type "$query_type"
    done
    
    # Generate report
    generate_report
    
    print_header "Performance Testing Complete"
    print_info "Results saved in: $OUTPUT_DIR"
    print_info "View the HTML report at: $OUTPUT_DIR/performance_report_${TIMESTAMP}.html"
}

# Handle command line arguments
case "${1:-}" in
    "--help" | "-h")
        echo "2DNS BIND Plugin Performance Test Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Environment Variables:"
        echo "  BIND_SERVER    Target BIND server (default: 127.0.0.1)"
        echo "  BIND_PORT      Target BIND port (default: 53)"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --quick        Run a quick test with reduced load"
        echo "  --stress       Run extended stress test"
        echo ""
        exit 0
        ;;
    "--quick")
        PERFORMANCE_QUERIES=100
        CONCURRENT_CLIENTS=(1 5 10)
        QUERY_TYPES=("ipv4" "json_single")
        print_info "Running quick performance test"
        ;;
    "--stress")
        PERFORMANCE_QUERIES=5000
        CONCURRENT_CLIENTS=(1 5 10 20 50 100 200 500)
        print_info "Running extended stress test"
        ;;
esac

main