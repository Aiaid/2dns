/*
 * IP Reflection Module - Header
 * 
 * This module handles parsing IP addresses from domain names and creating
 * appropriate DNS records for IP reflection functionality.
 */

#ifndef _IP_REFLECTION_H
#define _IP_REFLECTION_H

#include "2dns-plugin.h"
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

/* IPv4 constants */
#define IPV4_ADDR_LEN 4
#define IPV4_BASE32_LEN 8   /* Base32 encoded IPv4 length */

/* IPv6 constants */
#define IPV6_ADDR_LEN 16
#define IPV6_BASE32_LEN 32  /* Base32 encoded IPv6 length */

/* Dual-stack constants */
#define DUAL_STACK_BASE32_LEN (IPV4_BASE32_LEN + IPV6_BASE32_LEN)

/* IP address parsing functions */

/**
 * Parse direct IPv4 address from domain name
 * Format: 1.2.3.4.2dns.dev
 */
bool parse_direct_ipv4(const char *domain, ip_address_t *addr);

/**
 * Parse direct IPv6 address from domain name
 * Format: 2001-db8-85a3-0-0-8a2e-370-7334.2dns.dev
 */
bool parse_direct_ipv6(const char *domain, ip_address_t *addr);

/**
 * Parse Base32-encoded IPv4 address
 * Format: AEBAGBA8.2dns.dev
 */
bool parse_base32_ipv4(const char *domain, ip_address_t *addr);

/**
 * Parse Base32-encoded IPv6 address
 * Format: <32-char-base32>.2dns.dev
 */
bool parse_base32_ipv6(const char *domain, ip_address_t *addr);

/**
 * Parse dual-stack address (Base32 IPv4 + IPv6)
 * Format: <ipv4-base32><ipv6-base32>.2dns.dev
 */
bool parse_dual_stack_domain(const char *domain, ip_address_t *ipv4_addr, ip_address_t *ipv6_addr);

/**
 * Generic IP parsing function - tries all formats
 */
bool parse_ip_from_domain(const char *domain, ip_address_t *addr);

/* DNS record creation functions */

/**
 * Add IP address record to DNS lookup result
 */
query_result_t add_ip_record_to_lookup(const ip_address_t *addr, dns_rdatatype_t qtype,
                                     uint32_t ttl, dns_sdlzlookup_t *lookup);

/* Utility functions */

/**
 * Check if string represents a valid IPv4 address
 */
bool is_valid_ipv4_string(const char *str);

/**
 * Check if string represents a valid IPv6 address
 */
bool is_valid_ipv6_string(const char *str);

/**
 * Convert IPv4 address to string
 */
bool ipv4_to_string(const ip_address_t *addr, char *buffer, size_t buflen);

/**
 * Convert IPv6 address to string
 */
bool ipv6_to_string(const ip_address_t *addr, char *buffer, size_t buflen);

/**
 * Extract domain prefix (everything before .2dns.dev)
 */
char *extract_domain_prefix(const char *domain);

/**
 * Parse IPv6 with various notations (omitted zeros, 'z' for zero groups)
 */
bool parse_ipv6_notation(const char *ipv6_str, ip_address_t *addr);

/* IPv6 notation helpers */

/**
 * Expand IPv6 address with omitted leading zeros
 * Example: 2001-db8-85a3-0-0-8a2e-370-7334 -> 2001:0db8:85a3:0000:0000:8a2e:0370:7334
 */
bool expand_ipv6_omitted(const char *input, char *output, size_t output_len);

/**
 * Expand IPv6 address with 'z' notation for zero groups
 * Example: 2001-db8-85a3-z-8a2e-370-7334 -> 2001:0db8:85a3:0000:0000:8a2e:0370:7334
 */
bool expand_ipv6_z_notation(const char *input, char *output, size_t output_len);

/* IP address validation */

/**
 * Validate parsed IP address structure
 */
bool validate_ip_address(const ip_address_t *addr);

/**
 * Check if IPv4 address is in private range
 */
bool is_private_ipv4(const ip_address_t *addr);

/**
 * Check if IPv6 address is in private/reserved range
 */
bool is_private_ipv6(const ip_address_t *addr);

#endif /* _IP_REFLECTION_H */