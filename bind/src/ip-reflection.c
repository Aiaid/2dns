/*
 * IP Reflection Module - Implementation
 * 
 * This module handles parsing IP addresses from domain names and creating
 * appropriate DNS records for IP reflection functionality.
 */

#include "ip-reflection.h"
#include "base32.h"

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

/*
 * Extract domain prefix (everything before .2dns.dev)
 */
char *extract_domain_prefix(const char *domain) {
    if (!domain) return NULL;
    
    /* Find .2dns.dev suffix */
    const char *suffix = strstr(domain, ".2dns.dev");
    if (!suffix) return NULL;
    
    size_t prefix_len = suffix - domain;
    if (prefix_len == 0) return NULL;
    
    char *prefix = malloc(prefix_len + 1);
    if (!prefix) return NULL;
    
    strncpy(prefix, domain, prefix_len);
    prefix[prefix_len] = '\0';
    
    return prefix;
}

/*
 * Check if string represents a valid IPv4 address
 */
bool is_valid_ipv4_string(const char *str) {
    if (!str) return false;
    
    struct sockaddr_in sa;
    return inet_pton(AF_INET, str, &(sa.sin_addr)) == 1;
}

/*
 * Check if string represents a valid IPv6 address
 */
bool is_valid_ipv6_string(const char *str) {
    if (!str) return false;
    
    struct sockaddr_in6 sa6;
    return inet_pton(AF_INET6, str, &(sa6.sin6_addr)) == 1;
}

/*
 * Convert IPv4 address to string
 */
bool ipv4_to_string(const ip_address_t *addr, char *buffer, size_t buflen) {
    if (!addr || !buffer || buflen < INET_ADDRSTRLEN) return false;
    if (addr->family != AF_INET) return false;
    
    return inet_ntop(AF_INET, addr->addr.ipv4, buffer, buflen) != NULL;
}

/*
 * Convert IPv6 address to string
 */
bool ipv6_to_string(const ip_address_t *addr, char *buffer, size_t buflen) {
    if (!addr || !buffer || buflen < INET6_ADDRSTRLEN) return false;
    if (addr->family != AF_INET6) return false;
    
    return inet_ntop(AF_INET6, addr->addr.ipv6, buffer, buflen) != NULL;
}

/*
 * Parse direct IPv4 address from domain name
 * Format: 1.2.3.4.2dns.dev
 */
bool parse_direct_ipv4(const char *domain, ip_address_t *addr) {
    if (!domain || !addr) return false;
    
    char *prefix = extract_domain_prefix(domain);
    if (!prefix) return false;
    
    /* Check if prefix is a valid IPv4 address */
    struct sockaddr_in sa;
    bool valid = inet_pton(AF_INET, prefix, &(sa.sin_addr)) == 1;
    
    if (valid) {
        addr->family = AF_INET;
        memcpy(addr->addr.ipv4, &(sa.sin_addr), 4);
    }
    
    free(prefix);
    return valid;
}

/*
 * Expand IPv6 address with omitted leading zeros
 */
bool expand_ipv6_omitted(const char *input, char *output, size_t output_len) {
    if (!input || !output || output_len < INET6_ADDRSTRLEN) return false;
    
    /* Replace hyphens with colons */
    char temp[INET6_ADDRSTRLEN];
    size_t input_len = strlen(input);
    if (input_len >= sizeof(temp)) return false;
    
    strcpy(temp, input);
    for (char *p = temp; *p; p++) {
        if (*p == '-') *p = ':';
    }
    
    /* Parse and reformat to expand zeros */
    struct sockaddr_in6 sa6;
    if (inet_pton(AF_INET6, temp, &(sa6.sin6_addr)) != 1) {
        return false;
    }
    
    return inet_ntop(AF_INET6, &(sa6.sin6_addr), output, output_len) != NULL;
}

/*
 * Expand IPv6 address with 'z' notation for zero groups
 */
bool expand_ipv6_z_notation(const char *input, char *output, size_t output_len) {
    if (!input || !output || output_len < INET6_ADDRSTRLEN) return false;
    
    char temp[INET6_ADDRSTRLEN];
    size_t input_len = strlen(input);
    if (input_len >= sizeof(temp)) return false;
    
    /* Replace 'z' with '::' and hyphens with colons */
    const char *src = input;
    char *dst = temp;
    
    while (*src && (dst - temp) < (sizeof(temp) - 3)) {
        if (*src == 'z') {
            *dst++ = ':';
            *dst++ = ':';
            src++;
        } else if (*src == '-') {
            *dst++ = ':';
            src++;
        } else {
            *dst++ = *src++;
        }
    }
    *dst = '\0';
    
    /* Parse the resulting IPv6 address */
    struct sockaddr_in6 sa6;
    if (inet_pton(AF_INET6, temp, &(sa6.sin6_addr)) != 1) {
        return false;
    }
    
    return inet_ntop(AF_INET6, &(sa6.sin6_addr), output, output_len) != NULL;
}

/*
 * Parse IPv6 with various notations
 */
bool parse_ipv6_notation(const char *ipv6_str, ip_address_t *addr) {
    if (!ipv6_str || !addr) return false;
    
    char expanded[INET6_ADDRSTRLEN];
    bool expanded_successfully = false;
    
    /* Try different expansion methods */
    if (strchr(ipv6_str, 'z')) {
        expanded_successfully = expand_ipv6_z_notation(ipv6_str, expanded, sizeof(expanded));
    } else {
        expanded_successfully = expand_ipv6_omitted(ipv6_str, expanded, sizeof(expanded));
    }
    
    if (!expanded_successfully) return false;
    
    /* Parse the expanded address */
    struct sockaddr_in6 sa6;
    if (inet_pton(AF_INET6, expanded, &(sa6.sin6_addr)) != 1) {
        return false;
    }
    
    addr->family = AF_INET6;
    memcpy(addr->addr.ipv6, &(sa6.sin6_addr), 16);
    return true;
}

/*
 * Parse direct IPv6 address from domain name
 * Format: 2001-db8-85a3-0-0-8a2e-370-7334.2dns.dev
 */
bool parse_direct_ipv6(const char *domain, ip_address_t *addr) {
    if (!domain || !addr) return false;
    
    char *prefix = extract_domain_prefix(domain);
    if (!prefix) return false;
    
    bool valid = parse_ipv6_notation(prefix, addr);
    free(prefix);
    return valid;
}

/*
 * Parse Base32-encoded IPv4 address
 * Format: AEBAGBA8.2dns.dev
 */
bool parse_base32_ipv4(const char *domain, ip_address_t *addr) {
    if (!domain || !addr) return false;
    
    char *prefix = extract_domain_prefix(domain);
    if (!prefix) return false;
    
    /* Check if prefix length matches Base32 IPv4 (8 characters) */
    if (strlen(prefix) != IPV4_BASE32_LEN) {
        free(prefix);
        return false;
    }
    
    /* Decode Base32 to IPv4 */
    uint8_t ipv4_bytes[4];
    bool valid = base32_to_ipv4(prefix, ipv4_bytes);
    
    if (valid) {
        addr->family = AF_INET;
        memcpy(addr->addr.ipv4, ipv4_bytes, 4);
    }
    
    free(prefix);
    return valid;
}

/*
 * Parse Base32-encoded IPv6 address
 * Format: <32-char-base32>.2dns.dev
 */
bool parse_base32_ipv6(const char *domain, ip_address_t *addr) {
    if (!domain || !addr) return false;
    
    char *prefix = extract_domain_prefix(domain);
    if (!prefix) return false;
    
    /* Check if prefix length matches Base32 IPv6 (32 characters) */
    if (strlen(prefix) != IPV6_BASE32_LEN) {
        free(prefix);
        return false;
    }
    
    /* Decode Base32 to IPv6 */
    uint8_t ipv6_bytes[16];
    bool valid = base32_to_ipv6(prefix, ipv6_bytes);
    
    if (valid) {
        addr->family = AF_INET6;
        memcpy(addr->addr.ipv6, ipv6_bytes, 16);
    }
    
    free(prefix);
    return valid;
}

/*
 * Parse dual-stack address (Base32 IPv4 + IPv6)
 * Format: <ipv4-base32><ipv6-base32>.2dns.dev
 */
bool parse_dual_stack_domain(const char *domain, ip_address_t *ipv4_addr, ip_address_t *ipv6_addr) {
    if (!domain || !ipv4_addr || !ipv6_addr) return false;
    
    char *prefix = extract_domain_prefix(domain);
    if (!prefix) return false;
    
    /* Check if prefix length matches dual-stack (40 characters) */
    if (strlen(prefix) != DUAL_STACK_BASE32_LEN) {
        free(prefix);
        return false;
    }
    
    /* Split into IPv4 and IPv6 parts */
    char ipv4_part[IPV4_BASE32_LEN + 1];
    char ipv6_part[IPV6_BASE32_LEN + 1];
    
    strncpy(ipv4_part, prefix, IPV4_BASE32_LEN);
    ipv4_part[IPV4_BASE32_LEN] = '\0';
    
    strncpy(ipv6_part, prefix + IPV4_BASE32_LEN, IPV6_BASE32_LEN);
    ipv6_part[IPV6_BASE32_LEN] = '\0';
    
    /* Decode both parts */
    uint8_t ipv4_bytes[4], ipv6_bytes[16];
    bool ipv4_valid = base32_to_ipv4(ipv4_part, ipv4_bytes);
    bool ipv6_valid = base32_to_ipv6(ipv6_part, ipv6_bytes);
    
    if (ipv4_valid && ipv6_valid) {
        ipv4_addr->family = AF_INET;
        memcpy(ipv4_addr->addr.ipv4, ipv4_bytes, 4);
        
        ipv6_addr->family = AF_INET6;
        memcpy(ipv6_addr->addr.ipv6, ipv6_bytes, 16);
    }
    
    free(prefix);
    return ipv4_valid && ipv6_valid;
}

/*
 * Generic IP parsing function - tries all formats
 */
bool parse_ip_from_domain(const char *domain, ip_address_t *addr) {
    if (!domain || !addr) return false;
    
    /* Try direct IPv4 first */
    if (parse_direct_ipv4(domain, addr)) {
        plugin_log(LOG_DEBUG, "Parsed direct IPv4 from: %s", domain);
        return true;
    }
    
    /* Try direct IPv6 */
    if (parse_direct_ipv6(domain, addr)) {
        plugin_log(LOG_DEBUG, "Parsed direct IPv6 from: %s", domain);
        return true;
    }
    
    /* Try Base32 IPv4 */
    if (parse_base32_ipv4(domain, addr)) {
        plugin_log(LOG_DEBUG, "Parsed Base32 IPv4 from: %s", domain);
        return true;
    }
    
    /* Try Base32 IPv6 */
    if (parse_base32_ipv6(domain, addr)) {
        plugin_log(LOG_DEBUG, "Parsed Base32 IPv6 from: %s", domain);
        return true;
    }
    
    return false;
}

/*
 * Validate parsed IP address structure
 */
bool validate_ip_address(const ip_address_t *addr) {
    if (!addr) return false;
    
    return (addr->family == AF_INET || addr->family == AF_INET6);
}

/*
 * Check if IPv4 address is in private range
 */
bool is_private_ipv4(const ip_address_t *addr) {
    if (!addr || addr->family != AF_INET) return false;
    
    uint32_t ip = ntohl(*(uint32_t*)addr->addr.ipv4);
    
    /* Check private ranges:
     * 10.0.0.0/8        (10.0.0.0 - 10.255.255.255)
     * 172.16.0.0/12     (172.16.0.0 - 172.31.255.255)
     * 192.168.0.0/16    (192.168.0.0 - 192.168.255.255)
     */
    return ((ip & 0xFF000000) == 0x0A000000) ||      /* 10.0.0.0/8 */
           ((ip & 0xFFF00000) == 0xAC100000) ||      /* 172.16.0.0/12 */
           ((ip & 0xFFFF0000) == 0xC0A80000);        /* 192.168.0.0/16 */
}

/*
 * Check if IPv6 address is in private/reserved range
 */
bool is_private_ipv6(const ip_address_t *addr) {
    if (!addr || addr->family != AF_INET6) return false;
    
    const uint8_t *ip = addr->addr.ipv6;
    
    /* Check common private/reserved ranges */
    if (ip[0] == 0xFE && (ip[1] & 0xC0) == 0x80) {
        return true;  /* Link-local fe80::/10 */
    }
    
    if (ip[0] == 0xFC || ip[0] == 0xFD) {
        return true;  /* Unique local fc00::/7 */
    }
    
    return false;
}

/*
 * Add IP address record to DNS lookup result
 */
query_result_t add_ip_record_to_lookup(const ip_address_t *addr, dns_rdatatype_t qtype,
                                     uint32_t ttl, dns_sdlzlookup_t *lookup) {
    if (!addr || !lookup) return QUERY_RESULT_ERROR;
    
    if (!validate_ip_address(addr)) {
        return QUERY_RESULT_INVALID_FORMAT;
    }
    
    char ip_str[INET6_ADDRSTRLEN];
    isc_result_t result = ISC_R_SUCCESS;
    
    /* Handle IPv4 addresses */
    if (addr->family == AF_INET && (qtype == dns_rdatatype_a || qtype == dns_rdatatype_any)) {
        if (!ipv4_to_string(addr, ip_str, sizeof(ip_str))) {
            return QUERY_RESULT_ERROR;
        }
        
        result = dns_sdlz_putrr(lookup, "A", ttl, ip_str);
        if (result != ISC_R_SUCCESS) {
            plugin_log(LOG_ERROR, "Failed to add A record: %s", isc_result_totext(result));
            return QUERY_RESULT_ERROR;
        }
        
        plugin_log(LOG_DEBUG, "Added A record: %s", ip_str);
        return QUERY_RESULT_SUCCESS;
    }
    
    /* Handle IPv6 addresses */
    if (addr->family == AF_INET6 && (qtype == dns_rdatatype_aaaa || qtype == dns_rdatatype_any)) {
        if (!ipv6_to_string(addr, ip_str, sizeof(ip_str))) {
            return QUERY_RESULT_ERROR;
        }
        
        result = dns_sdlz_putrr(lookup, "AAAA", ttl, ip_str);
        if (result != ISC_R_SUCCESS) {
            plugin_log(LOG_ERROR, "Failed to add AAAA record: %s", isc_result_totext(result));
            return QUERY_RESULT_ERROR;
        }
        
        plugin_log(LOG_DEBUG, "Added AAAA record: %s", ip_str);
        return QUERY_RESULT_SUCCESS;
    }
    
    /* Query type doesn't match address family */
    return QUERY_RESULT_NOT_FOUND;
}