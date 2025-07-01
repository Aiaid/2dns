/*
 * Base32 Encoding/Decoding Module - Header
 * 
 * This module provides Base32 encoding and decoding functionality
 * with DNS-safe modifications (using '8' instead of '=' for padding).
 */

#ifndef _BASE32_H
#define _BASE32_H

#include "2dns-plugin.h"

/* Base32 constants */
#define BASE32_ENCODE_LEN(n) (((n) + 4) / 5 * 8)
#define BASE32_DECODE_LEN(n) ((n) / 8 * 5)

/* Standard Base32 alphabet (RFC 4648) */
extern const char base32_alphabet[33];

/* Reverse lookup table for decoding */
extern const int base32_decode_table[256];

/* Base32 encoding functions */

/**
 * Encode binary data to Base32 string
 * Uses DNS-safe padding ('8' instead of '=')
 */
char *base32_encode(const uint8_t *data, size_t data_len);

/**
 * Encode binary data to Base32 string with custom buffer
 */
bool base32_encode_to_buffer(const uint8_t *data, size_t data_len, 
                           char *output, size_t output_len);

/**
 * Calculate required buffer size for Base32 encoding
 */
size_t base32_encode_size(size_t data_len);

/* Base32 decoding functions */

/**
 * Decode Base32 string to binary data
 * Handles DNS-safe padding ('8' converted back to '=')
 */
uint8_t *base32_decode(const char *encoded, size_t *decoded_len);

/**
 * Decode Base32 string to binary data with custom buffer
 */
bool base32_decode_to_buffer(const char *encoded, uint8_t *output, 
                           size_t output_len, size_t *decoded_len);

/**
 * Calculate required buffer size for Base32 decoding
 */
size_t base32_decode_size(const char *encoded);

/* Base32 validation functions */

/**
 * Check if string is valid Base32
 */
bool is_valid_base32(const char *str);

/**
 * Check if character is valid in Base32 alphabet
 */
bool is_base32_char(char c);

/**
 * Validate Base32 string length and padding
 */
bool validate_base32_format(const char *str);

/* DNS-safe Base32 functions */

/**
 * Convert standard Base32 padding ('=') to DNS-safe ('8')
 */
char *base32_make_dns_safe(const char *standard_base32);

/**
 * Convert DNS-safe padding ('8') back to standard ('=')
 */
char *base32_restore_standard(const char *dns_safe_base32);

/**
 * Count padding characters in Base32 string
 */
size_t count_base32_padding(const char *str);

/**
 * Remove padding from Base32 string
 */
char *base32_remove_padding(const char *str);

/**
 * Add appropriate padding to Base32 string
 */
char *base32_add_padding(const char *str);

/* Utility functions */

/**
 * Normalize Base32 string (uppercase, validate format)
 */
char *normalize_base32(const char *input);

/**
 * Convert Base32 string to uppercase
 */
void base32_to_upper(char *str);

/**
 * Convert Base32 string to lowercase
 */
void base32_to_lower(char *str);

/* IPv4/IPv6 specific Base32 functions */

/**
 * Encode IPv4 address to Base32
 */
char *ipv4_to_base32(const uint8_t ipv4[4]);

/**
 * Decode Base32 to IPv4 address
 */
bool base32_to_ipv4(const char *base32, uint8_t ipv4[4]);

/**
 * Encode IPv6 address to Base32
 */
char *ipv6_to_base32(const uint8_t ipv6[16]);

/**
 * Decode Base32 to IPv6 address
 */
bool base32_to_ipv6(const char *base32, uint8_t ipv6[16]);

/* JSON-specific Base32 functions */

/**
 * Encode JSON string to Base32
 */
char *json_to_base32(const char *json_str);

/**
 * Decode Base32 to JSON string
 */
char *base32_to_json_string(const char *base32);

/**
 * Check if Base32 string could contain JSON data
 * (based on length and content heuristics)
 */
bool could_be_json_base32(const char *base32);

/* Error handling */

typedef enum {
    BASE32_SUCCESS = 0,
    BASE32_ERROR_INVALID_INPUT,
    BASE32_ERROR_INVALID_LENGTH,
    BASE32_ERROR_INVALID_CHARACTER,
    BASE32_ERROR_BUFFER_TOO_SMALL,
    BASE32_ERROR_MEMORY_ALLOCATION,
    BASE32_ERROR_INVALID_PADDING
} base32_error_t;

/**
 * Get human-readable error message
 */
const char *base32_error_string(base32_error_t error);

/* Debug functions */

/**
 * Print Base32 encoding/decoding debug information
 */
void debug_base32_operation(const char *operation, const char *input, 
                          const char *output, base32_error_t error);

/**
 * Validate Base32 encoding/decoding round-trip
 */
bool test_base32_round_trip(const uint8_t *data, size_t len);

#endif /* _BASE32_H */