/*
 * Base32 Module Test Suite
 * 
 * Tests the Base32 encoding/decoding functionality including
 * DNS-safe padding conversion and IPv4/IPv6 specific operations.
 */

#include "../src/base32.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>

/* Test data structures */
typedef struct {
    const char *input;
    const char *expected_base32;
    const char *description;
} test_case_t;

/* Test cases for basic encoding/decoding */
test_case_t basic_tests[] = {
    {"", "", "Empty string"},
    {"f", "MY888888", "Single character"},
    {"fo", "MZXQ8888", "Two characters"},
    {"foo", "MZXW68888", "Three characters"},
    {"foob", "MZXW6YQ8", "Four characters"},
    {"fooba", "MZXW6YTB", "Five characters"},
    {"foobar", "MZXW6YTBOI888888", "Six characters"},
    {NULL, NULL, NULL}
};

/* IPv4 test cases */
typedef struct {
    uint8_t ipv4[4];
    const char *expected_base32;
    const char *description;
} ipv4_test_case_t;

ipv4_test_case_t ipv4_tests[] = {
    {{192, 168, 1, 1}, "YADQACAB", "192.168.1.1"},
    {{8, 8, 8, 8}, "BADQAQIB", "8.8.8.8"},
    {{127, 0, 0, 1}, "O4AAAAE8", "127.0.0.1"},
    {{10, 0, 0, 1}, "FAAAAAE8", "10.0.0.1"},
    {{0, 0, 0, 0}, "AAAAAAAA", "0.0.0.0"},
    {{255, 255, 255, 255}, "77777777", "255.255.255.255"},
    {{0, 0, 0, 0}, NULL, NULL}
};

/* IPv6 test cases */
typedef struct {
    uint8_t ipv6[16];
    const char *expected_base32;
    const char *description;
} ipv6_test_case_t;

ipv6_test_case_t ipv6_tests[] = {
    {{0x20, 0x01, 0x0d, 0xb8, 0x85, 0xa3, 0x00, 0x00, 
      0x00, 0x00, 0x8a, 0x2e, 0x03, 0x70, 0x73, 0x34}, 
     "EAANVEFEKYGAAAAAAARGMEBQ6NZTU", "2001:db8:85a3::8a2e:370:7334"},
    {{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1}, 
     "AAAAAAAAAAAAAAAAAAAAAAAAAAAE", "::1"},
    {{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}, 
     "AAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "::"},
    {{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}, 
     NULL, NULL}
};

/* Forward declarations */
bool test_basic_encoding(void);
bool test_basic_decoding(void);
bool test_dns_safe_padding(void);
bool test_ipv4_encoding(void);
bool test_ipv6_encoding(void);
bool test_json_encoding(void);
bool test_validation_functions(void);
bool test_error_handling(void);
bool test_round_trip(void);

/* Main test runner */
int main(void) {
    printf("Running Base32 Module Tests...\n\n");
    
    bool all_passed = true;
    
    /* Run test suites */
    if (!test_basic_encoding()) {
        printf("FAILED: Basic encoding tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Basic encoding tests\n");
    }
    
    if (!test_basic_decoding()) {
        printf("FAILED: Basic decoding tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Basic decoding tests\n");
    }
    
    if (!test_dns_safe_padding()) {
        printf("FAILED: DNS-safe padding tests\n");
        all_passed = false;
    } else {
        printf("PASSED: DNS-safe padding tests\n");
    }
    
    if (!test_ipv4_encoding()) {
        printf("FAILED: IPv4 encoding tests\n");
        all_passed = false;
    } else {
        printf("PASSED: IPv4 encoding tests\n");
    }
    
    if (!test_ipv6_encoding()) {
        printf("FAILED: IPv6 encoding tests\n");
        all_passed = false;
    } else {
        printf("PASSED: IPv6 encoding tests\n");
    }
    
    if (!test_json_encoding()) {
        printf("FAILED: JSON encoding tests\n");
        all_passed = false;
    } else {
        printf("PASSED: JSON encoding tests\n");
    }
    
    if (!test_validation_functions()) {
        printf("FAILED: Validation function tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Validation function tests\n");
    }
    
    if (!test_error_handling()) {
        printf("FAILED: Error handling tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Error handling tests\n");
    }
    
    if (!test_round_trip()) {
        printf("FAILED: Round-trip tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Round-trip tests\n");
    }
    
    printf("\n");
    if (all_passed) {
        printf("All Base32 tests PASSED!\n");
        return 0;
    } else {
        printf("Some Base32 tests FAILED!\n");
        return 1;
    }
}

/* Test basic encoding functionality */
bool test_basic_encoding(void) {
    for (int i = 0; basic_tests[i].input != NULL; i++) {
        const char *input = basic_tests[i].input;
        const char *expected = basic_tests[i].expected_base32;
        const char *desc = basic_tests[i].description;
        
        char *result = base32_encode((const uint8_t *)input, strlen(input));
        if (!result) {
            printf("  Encoding failed for: %s\n", desc);
            return false;
        }
        
        if (strcmp(result, expected) != 0) {
            printf("  Encoding mismatch for %s:\n", desc);
            printf("    Expected: %s\n", expected);
            printf("    Got:      %s\n", result);
            free(result);
            return false;
        }
        
        free(result);
    }
    
    return true;
}

/* Test basic decoding functionality */
bool test_basic_decoding(void) {
    for (int i = 0; basic_tests[i].input != NULL; i++) {
        const char *expected_input = basic_tests[i].input;
        const char *base32_input = basic_tests[i].expected_base32;
        const char *desc = basic_tests[i].description;
        
        size_t decoded_len;
        uint8_t *result = base32_decode(base32_input, &decoded_len);
        if (!result) {
            printf("  Decoding failed for: %s\n", desc);
            return false;
        }
        
        if (decoded_len != strlen(expected_input) || 
            memcmp(result, expected_input, decoded_len) != 0) {
            printf("  Decoding mismatch for %s:\n", desc);
            printf("    Expected: %s (len=%zu)\n", expected_input, strlen(expected_input));
            printf("    Got:      %.*s (len=%zu)\n", (int)decoded_len, result, decoded_len);
            free(result);
            return false;
        }
        
        free(result);
    }
    
    return true;
}

/* Test DNS-safe padding conversion */
bool test_dns_safe_padding(void) {
    const char *standard = "MZXW68==";
    const char *dns_safe = "MZXW6888";
    
    /* Test conversion to DNS-safe */
    char *converted = base32_make_dns_safe(standard);
    if (!converted || strcmp(converted, dns_safe) != 0) {
        printf("  DNS-safe conversion failed\n");
        printf("    Expected: %s\n", dns_safe);
        printf("    Got:      %s\n", converted ? converted : "NULL");
        SAFE_FREE(converted);
        return false;
    }
    free(converted);
    
    /* Test restoration to standard */
    char *restored = base32_restore_standard(dns_safe);
    if (!restored || strcmp(restored, standard) != 0) {
        printf("  Standard restoration failed\n");
        printf("    Expected: %s\n", standard);
        printf("    Got:      %s\n", restored ? restored : "NULL");
        SAFE_FREE(restored);
        return false;
    }
    free(restored);
    
    return true;
}

/* Test IPv4 encoding/decoding */
bool test_ipv4_encoding(void) {
    for (int i = 0; ipv4_tests[i].expected_base32 != NULL; i++) {
        const uint8_t *ipv4 = ipv4_tests[i].ipv4;
        const char *expected = ipv4_tests[i].expected_base32;
        const char *desc = ipv4_tests[i].description;
        
        /* Test encoding */
        char *encoded = ipv4_to_base32(ipv4);
        if (!encoded || strcmp(encoded, expected) != 0) {
            printf("  IPv4 encoding failed for %s:\n", desc);
            printf("    Expected: %s\n", expected);
            printf("    Got:      %s\n", encoded ? encoded : "NULL");
            SAFE_FREE(encoded);
            return false;
        }
        
        /* Test decoding */
        uint8_t decoded_ipv4[4];
        if (!base32_to_ipv4(encoded, decoded_ipv4)) {
            printf("  IPv4 decoding failed for %s\n", desc);
            free(encoded);
            return false;
        }
        
        if (memcmp(ipv4, decoded_ipv4, 4) != 0) {
            printf("  IPv4 round-trip failed for %s\n", desc);
            free(encoded);
            return false;
        }
        
        free(encoded);
    }
    
    return true;
}

/* Test IPv6 encoding/decoding */
bool test_ipv6_encoding(void) {
    for (int i = 0; ipv6_tests[i].expected_base32 != NULL; i++) {
        const uint8_t *ipv6 = ipv6_tests[i].ipv6;
        const char *expected = ipv6_tests[i].expected_base32;
        const char *desc = ipv6_tests[i].description;
        
        /* Test encoding */
        char *encoded = ipv6_to_base32(ipv6);
        if (!encoded || strcmp(encoded, expected) != 0) {
            printf("  IPv6 encoding failed for %s:\n", desc);
            printf("    Expected: %s\n", expected);
            printf("    Got:      %s\n", encoded ? encoded : "NULL");
            SAFE_FREE(encoded);
            return false;
        }
        
        /* Test decoding */
        uint8_t decoded_ipv6[16];
        if (!base32_to_ipv6(encoded, decoded_ipv6)) {
            printf("  IPv6 decoding failed for %s\n", desc);
            free(encoded);
            return false;
        }
        
        if (memcmp(ipv6, decoded_ipv6, 16) != 0) {
            printf("  IPv6 round-trip failed for %s\n", desc);
            free(encoded);
            return false;
        }
        
        free(encoded);
    }
    
    return true;
}

/* Test JSON encoding/decoding */
bool test_json_encoding(void) {
    const char *json_examples[] = {
        "{\"A\":\"1.2.3.4\"}",
        "{\"A\":\"192.168.1.1\",\"AAAA\":\"2001:db8::1\"}",
        "{\"MX\":\"10 mail.example.com\",\"TXT\":\"v=spf1 include:_spf.example.com ~all\"}",
        NULL
    };
    
    for (int i = 0; json_examples[i] != NULL; i++) {
        const char *json = json_examples[i];
        
        /* Test encoding */
        char *encoded = json_to_base32(json);
        if (!encoded) {
            printf("  JSON encoding failed for: %s\n", json);
            return false;
        }
        
        /* Test decoding */
        char *decoded = base32_to_json_string(encoded);
        if (!decoded || strcmp(json, decoded) != 0) {
            printf("  JSON round-trip failed:\n");
            printf("    Original: %s\n", json);
            printf("    Decoded:  %s\n", decoded ? decoded : "NULL");
            free(encoded);
            SAFE_FREE(decoded);
            return false;
        }
        
        /* Test heuristic detection */
        if (!could_be_json_base32(encoded)) {
            printf("  JSON detection failed for: %s\n", json);
            free(encoded);
            free(decoded);
            return false;
        }
        
        free(encoded);
        free(decoded);
    }
    
    return true;
}

/* Test validation functions */
bool test_validation_functions(void) {
    /* Test valid Base32 strings */
    const char *valid_strings[] = {
        "MZXW6YTB",
        "MZXW6YTB8888",
        "AAAAAAAA",
        "77777777",
        NULL
    };
    
    for (int i = 0; valid_strings[i] != NULL; i++) {
        if (!is_valid_base32(valid_strings[i])) {
            printf("  Validation failed for valid string: %s\n", valid_strings[i]);
            return false;
        }
    }
    
    /* Test invalid Base32 strings */
    const char *invalid_strings[] = {
        "MZXW6YT1",  /* Invalid character '1' */
        "MZXW6YT",   /* Invalid length */
        "MZXW6YT==", /* Invalid padding count */
        "",          /* Empty string */
        NULL
    };
    
    for (int i = 0; invalid_strings[i] != NULL; i++) {
        if (is_valid_base32(invalid_strings[i])) {
            printf("  Validation incorrectly passed for invalid string: %s\n", invalid_strings[i]);
            return false;
        }
    }
    
    return true;
}

/* Test error handling */
bool test_error_handling(void) {
    /* Test NULL inputs */
    if (base32_encode(NULL, 10) != NULL) {
        printf("  Error handling failed: NULL input should return NULL\n");
        return false;
    }
    
    size_t decoded_len;
    if (base32_decode(NULL, &decoded_len) != NULL) {
        printf("  Error handling failed: NULL decode input should return NULL\n");
        return false;
    }
    
    /* Test invalid Base32 */
    if (base32_decode("INVALID!", &decoded_len) != NULL) {
        printf("  Error handling failed: Invalid Base32 should return NULL\n");
        return false;
    }
    
    return true;
}

/* Test round-trip functionality */
bool test_round_trip(void) {
    /* Test various data patterns */
    uint8_t test_data[][16] = {
        {0x00, 0x01, 0x02, 0x03},                                    /* Simple pattern */
        {0xFF, 0xFE, 0xFD, 0xFC},                                    /* High bytes */
        {0x5A, 0xA5, 0x5A, 0xA5, 0x5A, 0xA5, 0x5A, 0xA5},          /* Alternating */
        {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00},          /* All zeros */
        {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF}           /* All ones */
    };
    
    size_t test_lens[] = {4, 4, 8, 8, 8};
    
    for (int i = 0; i < 5; i++) {
        if (!test_base32_round_trip(test_data[i], test_lens[i])) {
            printf("  Round-trip test failed for pattern %d\n", i);
            return false;
        }
    }
    
    return true;
}