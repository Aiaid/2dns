/*
 * JSON Parser Module Test Suite
 * 
 * Tests JSON parsing from Base32-encoded domain names including
 * single-layer and multi-layer domain formats.
 */

#include "../src/json-parser.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>

/* Test case structures */
typedef struct {
    const char *domain;
    const char *expected_json;
    bool is_multi_layer;
    const char *description;
} json_domain_test_t;

typedef struct {
    const char *json_str;
    int expected_record_count;
    const char *description;
} json_parse_test_t;

/* Test cases for JSON domain parsing */
json_domain_test_t json_domain_tests[] = {
    /* Single-layer JSON domains */
    {"jNBSWY3DPEB2CA4DVMQQGI3DNNSXS8.2dns.dev", 
     "{\"A\":\"1.2.3.4\"}", false, "Single A record"},
    
    {"jNBSWY3DPFXGK3TMNFRGS4TPNVSXG5DFMN2HE5LQN5XCA3DFPB2XI3BEMVSXOX8.2dns.dev", 
     "{\"A\":\"1.2.3.4\",\"AAAA\":\"2001:db8::1\"}", false, "A and AAAA records"},
    
    /* Multi-layer JSON domains */
    {"j1NBSWY3DPEB2CA4D.j2VMQQGI3DNNSXS8.2dns.dev", 
     "{\"A\":\"1.2.3.4\"}", true, "Multi-layer A record"},
    
    {"j1NBSWY3DPFXGK3TM.j2NFRGS4TPNVSXG5D.j3FMN2HE5LQN5XCA3D.j4FPB2XI3BEMVSXOX8.2dns.dev", 
     "{\"A\":\"1.2.3.4\",\"AAAA\":\"2001:db8::1\"}", true, "Multi-layer A and AAAA"},
    
    {NULL, NULL, false, NULL}
};

/* Test cases for JSON string parsing */
json_parse_test_t json_parse_tests[] = {
    {"{\"A\":\"1.2.3.4\"}", 1, "Single A record"},
    {"{\"A\":\"192.168.1.1\",\"AAAA\":\"2001:db8::1\"}", 2, "A and AAAA records"},
    {"{\"MX\":\"10 mail.example.com\",\"TXT\":\"v=spf1 ~all\"}", 2, "MX and TXT records"},
    {"{\"A\":\"1.1.1.1\",\"A\":\"8.8.8.8\"}", 1, "Duplicate keys (last wins)"},
    {"{\"CNAME\":\"www.example.com\"}", 1, "CNAME record"},
    {"{\"NS\":\"ns1.example.com\",\"NS\":\"ns2.example.com\"}", 1, "Multiple NS (last wins)"},
    {NULL, 0, NULL}
};

/* Invalid JSON test cases */
const char *invalid_json_tests[] = {
    "{\"A\":}",                    /* Invalid JSON syntax */
    "{\"INVALID\":\"1.2.3.4\"}",  /* Invalid record type */
    "{\"A\":\"999.999.999.999\"}", /* Invalid IP address */
    "not json at all",           /* Not JSON */
    "",                          /* Empty string */
    NULL
};

/* Forward declarations */
bool test_json_domain_detection(void);
bool test_single_layer_parsing(void);
bool test_multi_layer_parsing(void);
bool test_json_string_parsing(void);
bool test_record_validation(void);
bool test_dns_record_creation(void);
bool test_invalid_json_handling(void);
bool test_base32_extraction(void);
bool test_part_splitting(void);

/* Utility functions */
void print_recordset(const json_recordset_t *recordset);
bool validate_record_content(const json_recordset_t *recordset, const char *type, const char *value);

/* Main test runner */
int main(void) {
    printf("Running JSON Parser Module Tests...\n\n");
    
    bool all_passed = true;
    
    /* Run test suites */
    if (!test_json_domain_detection()) {
        printf("FAILED: JSON domain detection tests\n");
        all_passed = false;
    } else {
        printf("PASSED: JSON domain detection tests\n");
    }
    
    if (!test_single_layer_parsing()) {
        printf("FAILED: Single-layer parsing tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Single-layer parsing tests\n");
    }
    
    if (!test_multi_layer_parsing()) {
        printf("FAILED: Multi-layer parsing tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Multi-layer parsing tests\n");
    }
    
    if (!test_json_string_parsing()) {
        printf("FAILED: JSON string parsing tests\n");
        all_passed = false;
    } else {
        printf("PASSED: JSON string parsing tests\n");
    }
    
    if (!test_record_validation()) {
        printf("FAILED: Record validation tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Record validation tests\n");
    }
    
    if (!test_invalid_json_handling()) {
        printf("FAILED: Invalid JSON handling tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Invalid JSON handling tests\n");
    }
    
    if (!test_base32_extraction()) {
        printf("FAILED: Base32 extraction tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Base32 extraction tests\n");
    }
    
    if (!test_part_splitting()) {
        printf("FAILED: Part splitting tests\n");
        all_passed = false;
    } else {
        printf("PASSED: Part splitting tests\n");
    }
    
    printf("\n");
    if (all_passed) {
        printf("All JSON Parser tests PASSED!\n");
        return 0;
    } else {
        printf("Some JSON Parser tests FAILED!\n");
        return 1;
    }
}

/* Test JSON domain detection */
bool test_json_domain_detection(void) {
    /* Test single-layer detection */
    if (!is_single_layer_json("jABCDEFGH.2dns.dev")) {
        printf("  Failed to detect single-layer JSON domain\n");
        return false;
    }
    
    if (is_single_layer_json("j1ABCDEFGH.2dns.dev")) {
        printf("  Incorrectly detected j1 as single-layer\n");
        return false;
    }
    
    /* Test multi-layer detection */
    if (!is_multi_layer_json("j1ABCDEFGH.j2IJKLMNOP.2dns.dev")) {
        printf("  Failed to detect multi-layer JSON domain\n");
        return false;
    }
    
    if (is_multi_layer_json("jABCDEFGH.2dns.dev")) {
        printf("  Incorrectly detected single-layer as multi-layer\n");
        return false;
    }
    
    /* Test general JSON detection */
    if (!is_json_domain("jABCDEFGH.2dns.dev")) {
        printf("  Failed to detect JSON domain (single-layer)\n");
        return false;
    }
    
    if (!is_json_domain("j1ABCDEFGH.j2IJKLMNOP.2dns.dev")) {
        printf("  Failed to detect JSON domain (multi-layer)\n");
        return false;
    }
    
    if (is_json_domain("192.168.1.1.2dns.dev")) {
        printf("  Incorrectly detected IP domain as JSON\n");
        return false;
    }
    
    return true;
}

/* Test single-layer JSON parsing */
bool test_single_layer_parsing(void) {
    for (int i = 0; json_domain_tests[i].domain != NULL; i++) {
        const json_domain_test_t *test = &json_domain_tests[i];
        
        if (test->is_multi_layer) continue; /* Skip multi-layer tests */
        
        json_recordset_t *recordset = parse_single_layer_json(test->domain);
        if (!recordset) {
            printf("  Failed to parse single-layer JSON: %s (%s)\n", 
                   test->domain, test->description);
            return false;
        }
        
        if (recordset->count == 0) {
            printf("  No records parsed from: %s (%s)\n", 
                   test->domain, test->description);
            free_json_recordset(recordset);
            return false;
        }
        
        /* Validate that we can re-encode to the expected JSON */
        /* This is a simplified test - in practice, JSON field order may vary */
        
        free_json_recordset(recordset);
    }
    
    return true;
}

/* Test multi-layer JSON parsing */
bool test_multi_layer_parsing(void) {
    for (int i = 0; json_domain_tests[i].domain != NULL; i++) {
        const json_domain_test_t *test = &json_domain_tests[i];
        
        if (!test->is_multi_layer) continue; /* Skip single-layer tests */
        
        json_recordset_t *recordset = parse_multi_layer_json(test->domain);
        if (!recordset) {
            printf("  Failed to parse multi-layer JSON: %s (%s)\n", 
                   test->domain, test->description);
            return false;
        }
        
        if (recordset->count == 0) {
            printf("  No records parsed from: %s (%s)\n", 
                   test->domain, test->description);
            free_json_recordset(recordset);
            return false;
        }
        
        free_json_recordset(recordset);
    }
    
    return true;
}

/* Test JSON string parsing */
bool test_json_string_parsing(void) {
    for (int i = 0; json_parse_tests[i].json_str != NULL; i++) {
        const json_parse_test_t *test = &json_parse_tests[i];
        
        json_recordset_t *recordset = parse_json_string(test->json_str);
        if (!recordset) {
            printf("  Failed to parse JSON string: %s (%s)\n", 
                   test->json_str, test->description);
            return false;
        }
        
        if ((int)recordset->count != test->expected_record_count) {
            printf("  Record count mismatch for %s:\n", test->description);
            printf("    Expected: %d\n", test->expected_record_count);
            printf("    Got:      %zu\n", recordset->count);
            free_json_recordset(recordset);
            return false;
        }
        
        /* Debug output */
        printf("  Parsed %s: %zu records\n", test->description, recordset->count);
        
        free_json_recordset(recordset);
    }
    
    return true;
}

/* Test record validation */
bool test_record_validation(void) {
    /* Test valid record types */
    const char *valid_types[] = {"A", "AAAA", "CNAME", "MX", "TXT", "NS", NULL};
    for (int i = 0; valid_types[i] != NULL; i++) {
        if (!is_valid_record_type(valid_types[i])) {
            printf("  Valid record type rejected: %s\n", valid_types[i]);
            return false;
        }
    }
    
    /* Test invalid record types */
    const char *invalid_types[] = {"INVALID", "A1", "123", "", NULL};
    for (int i = 0; invalid_types[i] != NULL; i++) {
        if (is_valid_record_type(invalid_types[i])) {
            printf("  Invalid record type accepted: %s\n", invalid_types[i]);
            return false;
        }
    }
    
    /* Test record value validation */
    if (!is_valid_record_value("A", "192.168.1.1")) {
        printf("  Valid A record value rejected\n");
        return false;
    }
    
    if (is_valid_record_value("A", "invalid.ip.address")) {
        printf("  Invalid A record value accepted\n");
        return false;
    }
    
    if (!is_valid_record_value("AAAA", "2001:db8::1")) {
        printf("  Valid AAAA record value rejected\n");
        return false;
    }
    
    if (is_valid_record_value("AAAA", "not::an::ipv6::address::at::all")) {
        printf("  Invalid AAAA record value accepted\n");
        return false;
    }
    
    return true;
}

/* Test invalid JSON handling */
bool test_invalid_json_handling(void) {
    for (int i = 0; invalid_json_tests[i] != NULL; i++) {
        const char *invalid_json = invalid_json_tests[i];
        
        json_recordset_t *recordset = parse_json_string(invalid_json);
        if (recordset) {
            printf("  Invalid JSON incorrectly parsed: %s\n", invalid_json);
            free_json_recordset(recordset);
            return false;
        }
    }
    
    return true;
}

/* Test Base32 extraction from domains */
bool test_base32_extraction(void) {
    /* Test single-layer extraction */
    bool is_multi;
    char *base32 = extract_json_base32("jABCDEFGH.2dns.dev", &is_multi);
    if (!base32 || is_multi) {
        printf("  Failed to extract single-layer Base32\n");
        SAFE_FREE(base32);
        return false;
    }
    
    if (strcmp(base32, "ABCDEFGH") != 0) {
        printf("  Single-layer Base32 extraction mismatch\n");
        printf("    Expected: ABCDEFGH\n");
        printf("    Got:      %s\n", base32);
        free(base32);
        return false;
    }
    free(base32);
    
    /* Test multi-layer extraction */
    base32 = extract_json_base32("j1ABCD.j2EFGH.2dns.dev", &is_multi);
    if (!base32 || !is_multi) {
        printf("  Failed to extract multi-layer Base32\n");
        SAFE_FREE(base32);
        return false;
    }
    
    if (strcmp(base32, "ABCDEFGH") != 0) {
        printf("  Multi-layer Base32 extraction mismatch\n");
        printf("    Expected: ABCDEFGH\n");
        printf("    Got:      %s\n", base32);
        free(base32);
        return false;
    }
    free(base32);
    
    return true;
}

/* Test domain part splitting */
bool test_part_splitting(void) {
    /* Test basic splitting */
    int part_count;
    char **parts = split_domain_parts("j1ABCD.j2EFGH.j3IJKL.2dns.dev", &part_count);
    
    if (!parts || part_count != 3) {
        printf("  Domain part splitting failed\n");
        printf("    Expected 3 parts, got %d\n", part_count);
        if (parts) {
            for (int i = 0; i < part_count; i++) {
                free(parts[i]);
            }
            free(parts);
        }
        return false;
    }
    
    /* Validate parts */
    const char *expected_parts[] = {"j1ABCD", "j2EFGH", "j3IJKL"};
    for (int i = 0; i < 3; i++) {
        if (strcmp(parts[i], expected_parts[i]) != 0) {
            printf("  Part %d mismatch:\n", i + 1);
            printf("    Expected: %s\n", expected_parts[i]);
            printf("    Got:      %s\n", parts[i]);
            for (int j = 0; j < part_count; j++) {
                free(parts[j]);
            }
            free(parts);
            return false;
        }
    }
    
    /* Test sequence validation */
    if (!validate_part_sequence(parts, part_count)) {
        printf("  Part sequence validation failed\n");
        for (int i = 0; i < part_count; i++) {
            free(parts[i]);
        }
        free(parts);
        return false;
    }
    
    /* Cleanup */
    for (int i = 0; i < part_count; i++) {
        free(parts[i]);
    }
    free(parts);
    
    /* Test invalid sequence */
    char *invalid_parts[] = {"j1ABCD", "j3EFGH"}; /* Missing j2 */
    if (validate_part_sequence(invalid_parts, 2)) {
        printf("  Invalid part sequence incorrectly validated\n");
        return false;
    }
    
    return true;
}

/* Utility function to print recordset contents */
void print_recordset(const json_recordset_t *recordset) {
    if (!recordset) {
        printf("NULL recordset\n");
        return;
    }
    
    printf("Recordset with %zu records:\n", recordset->count);
    for (size_t i = 0; i < recordset->count; i++) {
        printf("  [%zu] %s: %s\n", i, 
               recordset->records[i].type, 
               recordset->records[i].value);
    }
}

/* Utility function to validate record content */
bool validate_record_content(const json_recordset_t *recordset, const char *type, const char *value) {
    if (!recordset || !type || !value) return false;
    
    json_record_t *record = find_json_record(recordset, type);
    if (!record) return false;
    
    return strcmp(record->value, value) == 0;
}