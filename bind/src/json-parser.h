/*
 * JSON Parser Module - Header
 * 
 * This module handles parsing JSON-encoded DNS records from domain names.
 * Supports both single-layer and multi-layer domain formats.
 */

#ifndef _JSON_PARSER_H
#define _JSON_PARSER_H

#include "2dns-plugin.h"
#include <json-c/json.h>

/* JSON format constants */
#define JSON_PREFIX_SINGLE 'j'      /* Single layer: j<base32> */
#define JSON_PREFIX_MULTI "j"       /* Multi layer: j1<part1>.j2<part2> */
#define MAX_JSON_PARTS 10           /* Maximum number of domain parts */
#define JSON_PART_PREFIX_LEN 2      /* Length of "j1", "j2", etc. */

/* JSON record parsing functions */

/**
 * Parse JSON domain and extract records
 * Handles both single and multi-layer formats
 */
json_recordset_t *parse_json_domain(const char *domain);

/**
 * Parse single-layer JSON domain
 * Format: j<base32-json>.2dns.dev
 */
json_recordset_t *parse_single_layer_json(const char *domain);

/**
 * Parse multi-layer JSON domain
 * Format: j1<part1>.j2<part2>.j3<part3>.2dns.dev
 */
json_recordset_t *parse_multi_layer_json(const char *domain);

/**
 * Extract Base32 JSON data from domain labels
 */
char *extract_json_base32(const char *domain, bool *is_multi_layer);

/**
 * Decode Base32 to JSON string
 */
char *base32_to_json(const char *base32_data);

/**
 * Parse JSON string into record set
 */
json_recordset_t *parse_json_string(const char *json_str);

/* JSON record set management */

/**
 * Create new JSON record set
 */
json_recordset_t *create_json_recordset(void);

/**
 * Add record to record set
 */
bool add_json_record(json_recordset_t *recordset, const char *type, const char *value);

/**
 * Free JSON record set and all associated memory
 */
void free_json_recordset(json_recordset_t *recordset);

/**
 * Find record of specific type in record set
 */
json_record_t *find_json_record(const json_recordset_t *recordset, const char *type);

/* DNS record creation from JSON */

/**
 * Add JSON records to DNS lookup result
 */
query_result_t add_json_records_to_lookup(const json_recordset_t *recordset,
                                        dns_rdatatype_t qtype, uint32_t ttl,
                                        dns_sdlzlookup_t *lookup);

/**
 * Create specific DNS record from JSON record
 */
isc_result_t create_dns_record_from_json(const json_record_t *record, uint32_t ttl,
                                       dns_sdlzlookup_t *lookup);

/* Multi-layer domain processing */

/**
 * Split multi-layer domain into parts
 * Returns array of domain parts (j1<data>, j2<data>, etc.)
 */
char **split_domain_parts(const char *domain, int *part_count);

/**
 * Extract part number from domain label (j1 -> 1, j2 -> 2, etc.)
 */
int extract_part_number(const char *label);

/**
 * Extract data from domain label (j1<data> -> <data>)
 */
char *extract_part_data(const char *label);

/**
 * Reassemble Base32 data from ordered parts
 */
char *reassemble_base32_parts(char **parts, int part_count);

/**
 * Validate part ordering (ensure j1, j2, j3, etc. are in sequence)
 */
bool validate_part_sequence(char **parts, int part_count);

/* JSON validation and parsing */

/**
 * Validate JSON record type
 */
bool is_valid_record_type(const char *type);

/**
 * Validate JSON record value for given type
 */
bool is_valid_record_value(const char *type, const char *value);

/**
 * Parse complex record types (MX, SRV, etc.)
 */
bool parse_mx_record(const char *value, uint16_t *priority, char *exchange, size_t exchange_len);
bool parse_srv_record(const char *value, uint16_t *priority, uint16_t *weight, 
                     uint16_t *port, char *target, size_t target_len);
bool parse_caa_record(const char *value, uint8_t *flags, char *tag, size_t tag_len,
                     char *val, size_t val_len);

/* Utility functions */

/**
 * Check if domain has JSON format
 */
bool is_json_domain(const char *domain);

/**
 * Check if domain has single-layer JSON format
 */
bool is_single_layer_json(const char *domain);

/**
 * Check if domain has multi-layer JSON format
 */
bool is_multi_layer_json(const char *domain);

/**
 * Convert DNS record type string to BIND type constant
 */
dns_rdatatype_t string_to_rdatatype(const char *type_str);

/**
 * Convert BIND type constant to string
 */
const char *rdatatype_to_string(dns_rdatatype_t type);

/* Debug and logging functions */

/**
 * Print JSON record set for debugging
 */
void debug_print_recordset(const json_recordset_t *recordset);

/**
 * Validate complete JSON record set
 */
bool validate_json_recordset(const json_recordset_t *recordset);

#endif /* _JSON_PARSER_H */