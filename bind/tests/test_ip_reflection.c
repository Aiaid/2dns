/*
 * IP Reflection Module Test Suite
 * 
 * Tests IP address parsing from domain names including direct IPv4/IPv6,
 * Base32-encoded addresses, and dual-stack configurations.
 */

#include "../src/ip-reflection.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>

/* Test case structure */
typedef struct {
    const char *domain;
    int expected_family;
    const char *expected_ip;
    const char *description;
} ip_test_case_t;

/* Test cases for direct IPv4 addresses */
ip_test_case_t direct_ipv4_tests[] = {
    {"192.168.1.1.2dns.dev", AF_INET, "192.168.1.1", "Private IPv4"},
    {"8.8.8.8.2dns.dev", AF_INET, "8.8.8.8", "Google DNS"},
    {"127.0.0.1.2dns.dev", AF_INET, "127.0.0.1", "Localhost"},
    {"10.0.0.1.2dns.dev", AF_INET, "10.0.0.1", "Private Class A"},
    {"172.16.1.1.2dns.dev", AF_INET, "172.16.1.1", "Private Class B"},
    {"1.1.1.1.2dns.dev", AF_INET, "1.1.1.1", "Cloudflare DNS"},
    {"255.255.255.255.2dns.dev", AF_INET, "255.255.255.255", "Broadcast"},
    {NULL, 0, NULL, NULL}
};

/* Test cases for direct IPv6 addresses */
ip_test_case_t direct_ipv6_tests[] = {
    {"2001-db8-85a3-0-0-8a2e-370-7334.2dns.dev", AF_INET6, "2001:db8:85a3::8a2e:370:7334", "Standard IPv6"},
    {"fe80-0-0-0-0-0-0-1.2dns.dev", AF_INET6, "fe80::1", "Link-local"},
    {"0-0-0-0-0-0-0-1.2dns.dev", AF_INET6, "::1", "Loopback"},
    {"2001-4860-4860-0-0-0-0-8888.2dns.dev", AF_INET6, "2001:4860:4860::8888", "Google IPv6 DNS"},
    {NULL, 0, NULL, NULL}
};

/* Test cases for IPv6 with z-notation */
ip_test_case_t ipv6_z_tests[] = {
    {"2001-db8z8a2e-370-7334.2dns.dev", AF_INET6, "2001:db8::8a2e:370:7334", "IPv6 with z-notation"},
    {"fe80z1.2dns.dev", AF_INET6, "fe80::1", "Link-local with z"},
    {"2001-4860-4860z8888.2dns.dev", AF_INET6, "2001:4860:4860::8888", "Google DNS with z"},
    {NULL, 0, NULL, NULL}
};

/* Test cases for Base32-encoded IPv4 */
ip_test_case_t base32_ipv4_tests[] = {
    {"AEBAGBA8.2dns.dev", AF_INET, "1.2.3.4", "Base32 IPv4 1.2.3.4"},
    {"YADQACAB.2dns.dev", AF_INET, "192.168.1.1", "Base32 IPv4 192.168.1.1"},
    {"BADQAQIB.2dns.dev", AF_INET, "8.8.8.8", "Base32 IPv4 8.8.8.8"},
    {NULL, 0, NULL, NULL}
};

/* Test cases for invalid domains */
const char *invalid_domains[] = {
    "not-an-ip.2dns.dev",
    "999.999.999.999.2dns.dev",
    "invalid-ipv6.2dns.dev",
    "TOOLONG123456789.2dns.dev",
    "192.168.1.1.example.com",
    "j.2dns.dev",
    NULL
};

/* Forward declarations */
bool test_direct_ipv4_parsing(void);
bool test_direct_ipv6_parsing(void);
bool test_ipv6_z_notation(void);
bool test_base32_ipv4_parsing(void);
bool test_base32_ipv6_parsing(void);
bool test_dual_stack_parsing(void);
bool test_invalid_domains(void);
bool test_validation_functions(void);
bool test_ip_classification(void);
bool test_dns_record_creation(void);

/* Utility functions */
bool compare_ipv4(const ip_address_t *addr, const char *expected);
bool compare_ipv6(const ip_address_t *addr, const char *expected);
void print_ip_address(const ip_address_t *addr);

/* Main test runner */
int main(void) {
    printf("Running IP Reflection Module Tests...\n\n");
    
    bool all_passed = true;
    
    /* Run test suites */
    if (!test_direct_ipv4_parsing()) {
        printf("FAILED: Direct IPv4 parsing tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Direct IPv4 parsing tests\n");
    }
    
    if (!test_direct_ipv6_parsing()) {
        printf("FAILED: Direct IPv6 parsing tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Direct IPv6 parsing tests\n");
    }
    
    if (!test_ipv6_z_notation()) {
        printf("FAILED: IPv6 z-notation tests\n");
        all_passed = false;
    } else {
        printf("PASSED: IPv6 z-notation tests\n");
    }
    
    if (!test_base32_ipv4_parsing()) {
        printf("FAILED: Base32 IPv4 parsing tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Base32 IPv4 parsing tests\n");
    }
    
    if (!test_base32_ipv6_parsing()) {
        printf("FAILED: Base32 IPv6 parsing tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Base32 IPv6 parsing tests\n");
    }
    
    if (!test_dual_stack_parsing()) {
        printf("FAILED: Dual-stack parsing tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Dual-stack parsing tests\n");
    }
    
    if (!test_invalid_domains()) {
        printf("FAILED: Invalid domain tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Invalid domain tests\n");
    }
    
    if (!test_validation_functions()) {
        printf("FAILED: Validation function tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Validation function tests\n");
    }
    
    if (!test_ip_classification()) {
        printf("FAILED: IP classification tests\n");
        all_passed = false;
    } else {
        printf("PASSED: IP classification tests\n");
    }
    
    printf("\n");
    if (all_passed) {
        printf("All IP Reflection tests PASSED!\n");
        return 0;
    } else {
        printf("Some IP Reflection tests FAILED!\n");
        return 1;
    }
}

/* Test direct IPv4 address parsing */
bool test_direct_ipv4_parsing(void) {
    for (int i = 0; direct_ipv4_tests[i].domain != NULL; i++) {
        const char *domain = direct_ipv4_tests[i].domain;
        const char *expected_ip = direct_ipv4_tests[i].expected_ip;
        const char *desc = direct_ipv4_tests[i].description;
        
        ip_address_t addr;
        if (!parse_direct_ipv4(domain, &addr)) {
            printf("  Failed to parse IPv4 from: %s (%s)\n", domain, desc);
            return false;
        }
        
        if (!compare_ipv4(&addr, expected_ip)) {
            printf("  IPv4 mismatch for %s:\n", desc);
            printf("    Expected: %s\n", expected_ip);
            printf("    Got:      ");
            print_ip_address(&addr);
            printf("\n");
            return false;
        }
    }
    
    return true;
}

/* Test direct IPv6 address parsing */
bool test_direct_ipv6_parsing(void) {
    for (int i = 0; direct_ipv6_tests[i].domain != NULL; i++) {
        const char *domain = direct_ipv6_tests[i].domain;
        const char *expected_ip = direct_ipv6_tests[i].expected_ip;
        const char *desc = direct_ipv6_tests[i].description;
        
        ip_address_t addr;
        if (!parse_direct_ipv6(domain, &addr)) {
            printf("  Failed to parse IPv6 from: %s (%s)\n", domain, desc);
            return false;
        }
        
        if (!compare_ipv6(&addr, expected_ip)) {
            printf("  IPv6 mismatch for %s:\n", desc);
            printf("    Expected: %s\n", expected_ip);
            printf("    Got:      ");
            print_ip_address(&addr);
            printf("\n");
            return false;
        }
    }
    
    return true;
}

/* Test IPv6 z-notation parsing */
bool test_ipv6_z_notation(void) {
    for (int i = 0; ipv6_z_tests[i].domain != NULL; i++) {
        const char *domain = ipv6_z_tests[i].domain;
        const char *expected_ip = ipv6_z_tests[i].expected_ip;
        const char *desc = ipv6_z_tests[i].description;
        
        ip_address_t addr;
        if (!parse_direct_ipv6(domain, &addr)) {
            printf("  Failed to parse IPv6 z-notation from: %s (%s)\n", domain, desc);
            return false;
        }
        
        if (!compare_ipv6(&addr, expected_ip)) {
            printf("  IPv6 z-notation mismatch for %s:\n", desc);
            printf("    Expected: %s\n", expected_ip);
            printf("    Got:      ");
            print_ip_address(&addr);
            printf("\n");
            return false;
        }
    }
    
    return true;
}

/* Test Base32 IPv4 parsing */
bool test_base32_ipv4_parsing(void) {
    for (int i = 0; base32_ipv4_tests[i].domain != NULL; i++) {
        const char *domain = base32_ipv4_tests[i].domain;
        const char *expected_ip = base32_ipv4_tests[i].expected_ip;
        const char *desc = base32_ipv4_tests[i].description;
        
        ip_address_t addr;
        if (!parse_base32_ipv4(domain, &addr)) {
            printf("  Failed to parse Base32 IPv4 from: %s (%s)\n", domain, desc);
            return false;
        }
        
        if (!compare_ipv4(&addr, expected_ip)) {
            printf("  Base32 IPv4 mismatch for %s:\n", desc);
            printf("    Expected: %s\n", expected_ip);
            printf("    Got:      ");
            print_ip_address(&addr);
            printf("\n");
            return false;
        }
    }
    
    return true;
}

/* Test Base32 IPv6 parsing */
bool test_base32_ipv6_parsing(void) {
    /* Test specific Base32 IPv6 case */
    const char *domain = "EAANVEFEKYGAAAAAAARGMEBQ6NZTU888.2dns.dev";
    const char *expected = "2001:db8:85a3::8a2e:370:7334";
    
    ip_address_t addr;
    if (!parse_base32_ipv6(domain, &addr)) {
        printf("  Failed to parse Base32 IPv6 from: %s\n", domain);
        return false;
    }
    
    if (!compare_ipv6(&addr, expected)) {
        printf("  Base32 IPv6 mismatch:\n");
        printf("    Expected: %s\n", expected);
        printf("    Got:      ");
        print_ip_address(&addr);
        printf("\n");
        return false;
    }
    
    return true;
}

/* Test dual-stack parsing */
bool test_dual_stack_parsing(void) {
    /* Create test case: IPv4 1.2.3.4 + IPv6 ::1 */
    const char *domain = "AEBAGBA8AAAAAAAAAAAAAAAAAAAAAAAAAAAE.2dns.dev";
    
    ip_address_t ipv4_addr, ipv6_addr;
    if (!parse_dual_stack_domain(domain, &ipv4_addr, &ipv6_addr)) {
        printf("  Failed to parse dual-stack from: %s\n", domain);
        return false;
    }
    
    /* Validate IPv4 part */
    if (!compare_ipv4(&ipv4_addr, "1.2.3.4")) {
        printf("  Dual-stack IPv4 mismatch\n");
        return false;
    }
    
    /* Validate IPv6 part */
    if (!compare_ipv6(&ipv6_addr, "::1")) {
        printf("  Dual-stack IPv6 mismatch\n");
        return false;
    }
    
    return true;
}

/* Test invalid domains */
bool test_invalid_domains(void) {
    for (int i = 0; invalid_domains[i] != NULL; i++) {
        const char *domain = invalid_domains[i];
        
        ip_address_t addr;
        if (parse_ip_from_domain(domain, &addr)) {
            printf("  Invalid domain incorrectly parsed: %s\n", domain);
            return false;
        }
    }
    
    return true;
}

/* Test validation functions */
bool test_validation_functions(void) {
    /* Test valid IP strings */
    if (!is_valid_ipv4_string("192.168.1.1")) {
        printf("  IPv4 validation failed for valid address\n");
        return false;
    }
    
    if (!is_valid_ipv6_string("2001:db8::1")) {
        printf("  IPv6 validation failed for valid address\n");
        return false;
    }
    
    /* Test invalid IP strings */
    if (is_valid_ipv4_string("999.999.999.999")) {
        printf("  IPv4 validation incorrectly passed for invalid address\n");
        return false;
    }
    
    if (is_valid_ipv6_string("invalid::address::format")) {
        printf("  IPv6 validation incorrectly passed for invalid address\n");
        return false;
    }
    
    return true;
}

/* Test IP address classification */
bool test_ip_classification(void) {
    /* Test private IPv4 detection */
    ip_address_t private_ipv4 = {AF_INET, {{192, 168, 1, 1}}};
    if (!is_private_ipv4(&private_ipv4)) {
        printf("  Private IPv4 detection failed\n");
        return false;
    }
    
    ip_address_t public_ipv4 = {AF_INET, {{8, 8, 8, 8}}};
    if (is_private_ipv4(&public_ipv4)) {
        printf("  Public IPv4 incorrectly classified as private\n");
        return false;
    }
    
    /* Test link-local IPv6 detection */
    ip_address_t link_local = {AF_INET6, {{0xfe, 0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1}}};
    if (!is_private_ipv6(&link_local)) {
        printf("  Link-local IPv6 detection failed\n");
        return false;
    }
    
    return true;
}

/* Utility function to compare IPv4 addresses */
bool compare_ipv4(const ip_address_t *addr, const char *expected) {
    if (!addr || addr->family != AF_INET) return false;
    
    char ip_str[INET_ADDRSTRLEN];
    if (!ipv4_to_string(addr, ip_str, sizeof(ip_str))) return false;
    
    return strcmp(ip_str, expected) == 0;
}

/* Utility function to compare IPv6 addresses */
bool compare_ipv6(const ip_address_t *addr, const char *expected) {
    if (!addr || addr->family != AF_INET6) return false;
    
    char ip_str[INET6_ADDRSTRLEN];
    if (!ipv6_to_string(addr, ip_str, sizeof(ip_str))) return false;
    
    /* Parse expected address for comparison */
    struct sockaddr_in6 expected_addr;
    if (inet_pton(AF_INET6, expected, &expected_addr.sin6_addr) != 1) return false;
    
    return memcmp(addr->addr.ipv6, &expected_addr.sin6_addr, 16) == 0;
}

/* Utility function to print IP address */
void print_ip_address(const ip_address_t *addr) {
    if (!addr) {
        printf("NULL");
        return;
    }
    
    char ip_str[INET6_ADDRSTRLEN];
    if (addr->family == AF_INET) {
        if (ipv4_to_string(addr, ip_str, sizeof(ip_str))) {
            printf("%s", ip_str);
        } else {
            printf("INVALID_IPv4");
        }
    } else if (addr->family == AF_INET6) {
        if (ipv6_to_string(addr, ip_str, sizeof(ip_str))) {
            printf("%s", ip_str);
        } else {
            printf("INVALID_IPv6");
        }
    } else {
        printf("UNKNOWN_FAMILY_%d", addr->family);
    }
}