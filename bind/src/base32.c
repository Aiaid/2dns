/*
 * Base32 Encoding/Decoding Module - Implementation
 * 
 * This module provides Base32 encoding and decoding functionality
 * with DNS-safe modifications (using '8' instead of '=' for padding).
 */

#include "base32.h"
#include <ctype.h>

/* Standard Base32 alphabet (RFC 4648) */
const char base32_alphabet[33] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/* Reverse lookup table for decoding */
const int base32_decode_table[256] = {
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 0-15 */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 16-31 */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 32-47 */
    -1, -1, 26, 27, 28, 29, 30, 31, -1, -1, -1, -1, -1, -1, -1, -1,  /* 48-63 (2-7) */
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,  /* 64-79 (A-O) */
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,  /* 80-95 (P-Z) */
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,  /* 96-111 (a-o) */
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,  /* 112-127 (p-z) */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 128-143 */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 144-159 */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 160-175 */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 176-191 */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 192-207 */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 208-223 */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  /* 224-239 */
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1   /* 240-255 */
};

/*
 * Calculate required buffer size for Base32 encoding
 */
size_t base32_encode_size(size_t data_len) {
    return ((data_len + 4) / 5) * 8 + 1;  /* +1 for null terminator */
}

/*
 * Calculate required buffer size for Base32 decoding
 */
size_t base32_decode_size(const char *encoded) {
    if (!encoded) return 0;
    size_t len = strlen(encoded);
    return (len / 8) * 5;
}

/*
 * Check if character is valid in Base32 alphabet
 */
bool is_base32_char(char c) {
    return (c >= 'A' && c <= 'Z') || 
           (c >= 'a' && c <= 'z') || 
           (c >= '2' && c <= '7') ||
           c == '=' || c == '8';  /* Include both standard and DNS-safe padding */
}

/*
 * Check if string is valid Base32
 */
bool is_valid_base32(const char *str) {
    if (!str) return false;
    
    size_t len = strlen(str);
    if (len == 0) return false;
    
    /* Check each character */
    for (size_t i = 0; i < len; i++) {
        if (!is_base32_char(str[i])) {
            return false;
        }
    }
    
    /* Check padding rules */
    return validate_base32_format(str);
}

/*
 * Validate Base32 string length and padding
 */
bool validate_base32_format(const char *str) {
    if (!str) return false;
    
    size_t len = strlen(str);
    if (len == 0) return false;
    
    /* Base32 strings should be multiples of 8 characters (with padding) */
    if (len % 8 != 0) return false;
    
    /* Count padding characters at the end */
    size_t padding_count = 0;
    for (int i = len - 1; i >= 0 && (str[i] == '=' || str[i] == '8'); i--) {
        padding_count++;
    }
    
    /* Valid padding counts: 0, 1, 3, 4, 6 */
    return (padding_count == 0 || padding_count == 1 || padding_count == 3 || 
            padding_count == 4 || padding_count == 6);
}

/*
 * Convert Base32 string to uppercase
 */
void base32_to_upper(char *str) {
    if (!str) return;
    
    for (char *p = str; *p; p++) {
        *p = toupper((unsigned char)*p);
    }
}

/*
 * Convert DNS-safe padding ('8') back to standard ('=')
 */
char *base32_restore_standard(const char *dns_safe_base32) {
    if (!dns_safe_base32) return NULL;
    
    size_t len = strlen(dns_safe_base32);
    char *result = malloc(len + 1);
    if (!result) return NULL;
    
    strcpy(result, dns_safe_base32);
    
    /* Replace '8' with '=' */
    for (size_t i = 0; i < len; i++) {
        if (result[i] == '8') {
            result[i] = '=';
        }
    }
    
    return result;
}

/*
 * Convert standard Base32 padding ('=') to DNS-safe ('8')
 */
char *base32_make_dns_safe(const char *standard_base32) {
    if (!standard_base32) return NULL;
    
    size_t len = strlen(standard_base32);
    char *result = malloc(len + 1);
    if (!result) return NULL;
    
    strcpy(result, standard_base32);
    
    /* Replace '=' with '8' */
    for (size_t i = 0; i < len; i++) {
        if (result[i] == '=') {
            result[i] = '8';
        }
    }
    
    return result;
}

/*
 * Normalize Base32 string (uppercase, validate format)
 */
char *normalize_base32(const char *input) {
    if (!input) return NULL;
    
    size_t len = strlen(input);
    char *normalized = malloc(len + 1);
    if (!normalized) return NULL;
    
    strcpy(normalized, input);
    base32_to_upper(normalized);
    
    if (!is_valid_base32(normalized)) {
        free(normalized);
        return NULL;
    }
    
    return normalized;
}

/*
 * Encode binary data to Base32 string
 */
char *base32_encode(const uint8_t *data, size_t data_len) {
    if (!data || data_len == 0) return NULL;
    
    size_t output_len = base32_encode_size(data_len);
    char *output = malloc(output_len);
    if (!output) return NULL;
    
    if (!base32_encode_to_buffer(data, data_len, output, output_len)) {
        free(output);
        return NULL;
    }
    
    return output;
}

/*
 * Encode binary data to Base32 string with custom buffer
 */
bool base32_encode_to_buffer(const uint8_t *data, size_t data_len, 
                           char *output, size_t output_len) {
    if (!data || !output || data_len == 0) return false;
    
    size_t required_len = base32_encode_size(data_len);
    if (output_len < required_len) return false;
    
    size_t output_pos = 0;
    uint64_t buffer = 0;
    int bits_in_buffer = 0;
    
    /* Process input data */
    for (size_t i = 0; i < data_len; i++) {
        buffer = (buffer << 8) | data[i];
        bits_in_buffer += 8;
        
        /* Extract 5-bit groups */
        while (bits_in_buffer >= 5) {
            bits_in_buffer -= 5;
            int index = (buffer >> bits_in_buffer) & 0x1F;
            output[output_pos++] = base32_alphabet[index];
        }
    }
    
    /* Handle remaining bits */
    if (bits_in_buffer > 0) {
        int index = (buffer << (5 - bits_in_buffer)) & 0x1F;
        output[output_pos++] = base32_alphabet[index];
    }
    
    /* Add padding */
    while (output_pos % 8 != 0) {
        output[output_pos++] = BASE32_PADDING_CHAR;  /* Use DNS-safe padding */
    }
    
    output[output_pos] = '\0';
    return true;
}

/*
 * Decode Base32 string to binary data
 */
uint8_t *base32_decode(const char *encoded, size_t *decoded_len) {
    if (!encoded || !decoded_len) return NULL;
    
    /* Convert DNS-safe padding back to standard */
    char *standard_encoded = base32_restore_standard(encoded);
    if (!standard_encoded) return NULL;
    
    /* Normalize input */
    char *normalized = normalize_base32(standard_encoded);
    free(standard_encoded);
    if (!normalized) return NULL;
    
    size_t input_len = strlen(normalized);
    size_t output_len = base32_decode_size(normalized);
    
    uint8_t *output = malloc(output_len);
    if (!output) {
        free(normalized);
        return NULL;
    }
    
    bool success = base32_decode_to_buffer(normalized, output, output_len, decoded_len);
    free(normalized);
    
    if (!success) {
        free(output);
        return NULL;
    }
    
    return output;
}

/*
 * Decode Base32 string to binary data with custom buffer
 */
bool base32_decode_to_buffer(const char *encoded, uint8_t *output, 
                           size_t output_len, size_t *decoded_len) {
    if (!encoded || !output || !decoded_len) return false;
    
    size_t input_len = strlen(encoded);
    if (input_len == 0) return false;
    
    /* Remove padding for calculation */
    size_t effective_len = input_len;
    while (effective_len > 0 && (encoded[effective_len - 1] == '=' || encoded[effective_len - 1] == '8')) {
        effective_len--;
    }
    
    size_t expected_output_len = (effective_len * 5) / 8;
    if (output_len < expected_output_len) return false;
    
    uint64_t buffer = 0;
    int bits_in_buffer = 0;
    size_t output_pos = 0;
    
    /* Process input characters */
    for (size_t i = 0; i < effective_len; i++) {
        char c = toupper((unsigned char)encoded[i]);
        int value = base32_decode_table[(unsigned char)c];
        
        if (value < 0) return false;  /* Invalid character */
        
        buffer = (buffer << 5) | value;
        bits_in_buffer += 5;
        
        /* Extract 8-bit bytes */
        if (bits_in_buffer >= 8) {
            bits_in_buffer -= 8;
            output[output_pos++] = (buffer >> bits_in_buffer) & 0xFF;
        }
    }
    
    *decoded_len = output_pos;
    return true;
}

/*
 * Encode IPv4 address to Base32
 */
char *ipv4_to_base32(const uint8_t ipv4[4]) {
    if (!ipv4) return NULL;
    return base32_encode(ipv4, 4);
}

/*
 * Decode Base32 to IPv4 address
 */
bool base32_to_ipv4(const char *base32, uint8_t ipv4[4]) {
    if (!base32 || !ipv4) return false;
    
    size_t decoded_len;
    uint8_t *decoded = base32_decode(base32, &decoded_len);
    if (!decoded || decoded_len != 4) {
        SAFE_FREE(decoded);
        return false;
    }
    
    memcpy(ipv4, decoded, 4);
    free(decoded);
    return true;
}

/*
 * Encode IPv6 address to Base32
 */
char *ipv6_to_base32(const uint8_t ipv6[16]) {
    if (!ipv6) return NULL;
    return base32_encode(ipv6, 16);
}

/*
 * Decode Base32 to IPv6 address
 */
bool base32_to_ipv6(const char *base32, uint8_t ipv6[16]) {
    if (!base32 || !ipv6) return false;
    
    size_t decoded_len;
    uint8_t *decoded = base32_decode(base32, &decoded_len);
    if (!decoded || decoded_len != 16) {
        SAFE_FREE(decoded);
        return false;
    }
    
    memcpy(ipv6, decoded, 16);
    free(decoded);
    return true;
}

/*
 * Encode JSON string to Base32
 */
char *json_to_base32(const char *json_str) {
    if (!json_str) return NULL;
    
    size_t json_len = strlen(json_str);
    return base32_encode((const uint8_t *)json_str, json_len);
}

/*
 * Decode Base32 to JSON string
 */
char *base32_to_json_string(const char *base32) {
    if (!base32) return NULL;
    
    size_t decoded_len;
    uint8_t *decoded = base32_decode(base32, &decoded_len);
    if (!decoded) return NULL;
    
    /* Ensure null termination for string */
    char *json_str = malloc(decoded_len + 1);
    if (!json_str) {
        free(decoded);
        return NULL;
    }
    
    memcpy(json_str, decoded, decoded_len);
    json_str[decoded_len] = '\0';
    free(decoded);
    
    return json_str;
}

/*
 * Check if Base32 string could contain JSON data
 */
bool could_be_json_base32(const char *base32) {
    if (!base32) return false;
    
    size_t len = strlen(base32);
    
    /* JSON data would typically be longer than simple IP addresses */
    if (len < 16) return false;  /* Minimum reasonable JSON length */
    
    /* Try to decode and check if it looks like JSON */
    char *decoded = base32_to_json_string(base32);
    if (!decoded) return false;
    
    /* Simple heuristic: JSON starts with { or [ */
    bool looks_like_json = (decoded[0] == '{' || decoded[0] == '[');
    free(decoded);
    
    return looks_like_json;
}

/*
 * Get human-readable error message
 */
const char *base32_error_string(base32_error_t error) {
    switch (error) {
        case BASE32_SUCCESS: return "Success";
        case BASE32_ERROR_INVALID_INPUT: return "Invalid input";
        case BASE32_ERROR_INVALID_LENGTH: return "Invalid length";
        case BASE32_ERROR_INVALID_CHARACTER: return "Invalid character";
        case BASE32_ERROR_BUFFER_TOO_SMALL: return "Buffer too small";
        case BASE32_ERROR_MEMORY_ALLOCATION: return "Memory allocation failed";
        case BASE32_ERROR_INVALID_PADDING: return "Invalid padding";
        default: return "Unknown error";
    }
}

/*
 * Validate Base32 encoding/decoding round-trip
 */
bool test_base32_round_trip(const uint8_t *data, size_t len) {
    if (!data || len == 0) return false;
    
    /* Encode */
    char *encoded = base32_encode(data, len);
    if (!encoded) return false;
    
    /* Decode */
    size_t decoded_len;
    uint8_t *decoded = base32_decode(encoded, &decoded_len);
    
    bool success = (decoded && decoded_len == len && 
                   memcmp(data, decoded, len) == 0);
    
    SAFE_FREE(encoded);
    SAFE_FREE(decoded);
    
    return success;
}