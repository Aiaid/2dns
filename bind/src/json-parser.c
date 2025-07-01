/*
 * JSON Parser Module - Implementation
 * 
 * This module handles parsing JSON-encoded DNS records from domain names.
 * Supports both single-layer and multi-layer domain formats.
 */

#include "json-parser.h"
#include "base32.h"

#include <json-c/json.h>

/*
 * Create new JSON record set
 */
json_recordset_t *create_json_recordset(void) {
    json_recordset_t *recordset = malloc(sizeof(json_recordset_t));
    if (!recordset) return NULL;
    
    recordset->records = NULL;
    recordset->count = 0;
    recordset->capacity = 0;
    
    return recordset;
}

/*
 * Add record to record set
 */
bool add_json_record(json_recordset_t *recordset, const char *type, const char *value) {
    if (!recordset || !type || !value) return false;
    
    /* Expand capacity if needed */
    if (recordset->count >= recordset->capacity) {
        size_t new_capacity = recordset->capacity == 0 ? 8 : recordset->capacity * 2;
        json_record_t *new_records = realloc(recordset->records, 
                                            new_capacity * sizeof(json_record_t));
        if (!new_records) return false;
        
        recordset->records = new_records;
        recordset->capacity = new_capacity;
    }
    
    /* Add new record */
    json_record_t *record = &recordset->records[recordset->count];
    record->type = strdup(type);
    record->value = strdup(value);
    
    if (!record->type || !record->value) {
        SAFE_FREE(record->type);
        SAFE_FREE(record->value);
        return false;
    }
    
    recordset->count++;
    return true;
}

/*
 * Free JSON record set and all associated memory
 */
void free_json_recordset(json_recordset_t *recordset) {
    if (!recordset) return;
    
    for (size_t i = 0; i < recordset->count; i++) {
        SAFE_FREE(recordset->records[i].type);
        SAFE_FREE(recordset->records[i].value);
    }
    
    SAFE_FREE(recordset->records);
    free(recordset);
}

/*
 * Find record of specific type in record set
 */
json_record_t *find_json_record(const json_recordset_t *recordset, const char *type) {
    if (!recordset || !type) return NULL;
    
    for (size_t i = 0; i < recordset->count; i++) {
        if (strcasecmp(recordset->records[i].type, type) == 0) {
            return &recordset->records[i];
        }
    }
    
    return NULL;
}

/*
 * Check if domain has JSON format
 */
bool is_json_domain(const char *domain) {
    if (!domain) return false;
    
    return is_single_layer_json(domain) || is_multi_layer_json(domain);
}

/*
 * Check if domain has single-layer JSON format
 */
bool is_single_layer_json(const char *domain) {
    if (!domain) return false;
    
    /* Look for j<data>.2dns.dev format */
    char *prefix = extract_domain_prefix(domain);
    if (!prefix) return false;
    
    bool is_json = (prefix[0] == JSON_PREFIX_SINGLE && strlen(prefix) > 1 &&
                   !isdigit((unsigned char)prefix[1]));  /* Not j1, j2, etc. */
    
    free(prefix);
    return is_json;
}

/*
 * Check if domain has multi-layer JSON format
 */
bool is_multi_layer_json(const char *domain) {
    if (!domain) return false;
    
    /* Look for j1<data>.j2<data>.2dns.dev format */
    return strstr(domain, "j1") != NULL && strstr(domain, "j2") != NULL;
}

/*
 * Extract part number from domain label (j1 -> 1, j2 -> 2, etc.)
 */
int extract_part_number(const char *label) {
    if (!label || label[0] != 'j' || !isdigit((unsigned char)label[1])) {
        return -1;
    }
    
    return atoi(label + 1);
}

/*
 * Extract data from domain label (j1<data> -> <data>)
 */
char *extract_part_data(const char *label) {
    if (!label || label[0] != 'j' || !isdigit((unsigned char)label[1])) {
        return NULL;
    }
    
    /* Find where the number ends and data begins */
    const char *data_start = label + 1;
    while (*data_start && isdigit((unsigned char)*data_start)) {
        data_start++;
    }
    
    if (*data_start == '\0') return NULL;  /* No data part */
    
    return strdup(data_start);
}

/*
 * Split multi-layer domain into parts
 */
char **split_domain_parts(const char *domain, int *part_count) {
    if (!domain || !part_count) return NULL;
    
    *part_count = 0;
    
    /* Count parts and allocate array */
    char *domain_copy = strdup(domain);
    if (!domain_copy) return NULL;
    
    char **parts = malloc(MAX_JSON_PARTS * sizeof(char*));
    if (!parts) {
        free(domain_copy);
        return NULL;
    }
    
    /* Split by dots and collect j-prefixed parts */
    char *token = strtok(domain_copy, ".");
    while (token && *part_count < MAX_JSON_PARTS) {
        if (token[0] == 'j' && isdigit((unsigned char)token[1])) {
            parts[*part_count] = strdup(token);
            if (!parts[*part_count]) {
                /* Cleanup on error */
                for (int i = 0; i < *part_count; i++) {
                    free(parts[i]);
                }
                free(parts);
                free(domain_copy);
                return NULL;
            }
            (*part_count)++;
        }
        token = strtok(NULL, ".");
    }
    
    free(domain_copy);
    
    if (*part_count == 0) {
        free(parts);
        return NULL;
    }
    
    return parts;
}

/*
 * Validate part ordering (ensure j1, j2, j3, etc. are in sequence)
 */
bool validate_part_sequence(char **parts, int part_count) {
    if (!parts || part_count <= 0) return false;
    
    /* Create array to track which part numbers we have */
    bool found_parts[MAX_JSON_PARTS] = {false};
    
    for (int i = 0; i < part_count; i++) {
        int part_num = extract_part_number(parts[i]);
        if (part_num <= 0 || part_num > MAX_JSON_PARTS) {
            return false;
        }
        
        if (found_parts[part_num - 1]) {
            return false;  /* Duplicate part number */
        }
        
        found_parts[part_num - 1] = true;
    }
    
    /* Check that parts are sequential starting from 1 */
    for (int i = 0; i < part_count; i++) {
        if (!found_parts[i]) {
            return false;  /* Missing part in sequence */
        }
    }
    
    return true;
}

/*
 * Reassemble Base32 data from ordered parts
 */
char *reassemble_base32_parts(char **parts, int part_count) {
    if (!parts || part_count <= 0) return NULL;
    
    /* Calculate total length needed */
    size_t total_len = 0;
    for (int i = 0; i < part_count; i++) {
        char *data = extract_part_data(parts[i]);
        if (!data) return NULL;
        total_len += strlen(data);
        free(data);
    }
    
    /* Allocate result buffer */
    char *result = malloc(total_len + 1);
    if (!result) return NULL;
    
    result[0] = '\0';
    
    /* Sort parts by number and concatenate data */
    for (int part_num = 1; part_num <= part_count; part_num++) {
        for (int i = 0; i < part_count; i++) {
            if (extract_part_number(parts[i]) == part_num) {
                char *data = extract_part_data(parts[i]);
                if (data) {
                    strcat(result, data);
                    free(data);
                }
                break;
            }
        }
    }
    
    return result;
}

/*
 * Extract Base32 JSON data from domain labels
 */
char *extract_json_base32(const char *domain, bool *is_multi_layer) {
    if (!domain || !is_multi_layer) return NULL;
    
    *is_multi_layer = false;
    
    /* Try single-layer first */
    if (is_single_layer_json(domain)) {
        char *prefix = extract_domain_prefix(domain);
        if (!prefix) return NULL;
        
        /* Skip 'j' prefix */
        char *base32_data = strdup(prefix + 1);
        free(prefix);
        return base32_data;
    }
    
    /* Try multi-layer */
    if (is_multi_layer_json(domain)) {
        *is_multi_layer = true;
        
        int part_count;
        char **parts = split_domain_parts(domain, &part_count);
        if (!parts) return NULL;
        
        if (!validate_part_sequence(parts, part_count)) {
            for (int i = 0; i < part_count; i++) {
                free(parts[i]);
            }
            free(parts);
            return NULL;
        }
        
        char *base32_data = reassemble_base32_parts(parts, part_count);
        
        /* Cleanup */
        for (int i = 0; i < part_count; i++) {
            free(parts[i]);
        }
        free(parts);
        
        return base32_data;
    }
    
    return NULL;
}

/*
 * Decode Base32 to JSON string
 */
char *base32_to_json(const char *base32_data) {
    if (!base32_data) return NULL;
    
    return base32_to_json_string(base32_data);
}

/*
 * Convert DNS record type string to BIND type constant
 */
dns_rdatatype_t string_to_rdatatype(const char *type_str) {
    if (!type_str) return dns_rdatatype_none;
    
    if (strcasecmp(type_str, "A") == 0) return dns_rdatatype_a;
    if (strcasecmp(type_str, "AAAA") == 0) return dns_rdatatype_aaaa;
    if (strcasecmp(type_str, "CNAME") == 0) return dns_rdatatype_cname;
    if (strcasecmp(type_str, "MX") == 0) return dns_rdatatype_mx;
    if (strcasecmp(type_str, "TXT") == 0) return dns_rdatatype_txt;
    if (strcasecmp(type_str, "NS") == 0) return dns_rdatatype_ns;
    if (strcasecmp(type_str, "PTR") == 0) return dns_rdatatype_ptr;
    if (strcasecmp(type_str, "SRV") == 0) return dns_rdatatype_srv;
    if (strcasecmp(type_str, "SOA") == 0) return dns_rdatatype_soa;
    if (strcasecmp(type_str, "CAA") == 0) return dns_rdatatype_caa;
    if (strcasecmp(type_str, "DNAME") == 0) return dns_rdatatype_dname;
    if (strcasecmp(type_str, "TLSA") == 0) return dns_rdatatype_tlsa;
    if (strcasecmp(type_str, "SSHFP") == 0) return dns_rdatatype_sshfp;
    if (strcasecmp(type_str, "NAPTR") == 0) return dns_rdatatype_naptr;
    if (strcasecmp(type_str, "HINFO") == 0) return dns_rdatatype_hinfo;
    if (strcasecmp(type_str, "LOC") == 0) return dns_rdatatype_loc;
    
    return dns_rdatatype_none;
}

/*
 * Check if JSON record type is valid
 */
bool is_valid_record_type(const char *type) {
    return string_to_rdatatype(type) != dns_rdatatype_none;
}

/*
 * Parse MX record value
 */
bool parse_mx_record(const char *value, uint16_t *priority, char *exchange, size_t exchange_len) {
    if (!value || !priority || !exchange) return false;
    
    /* Format: "priority exchange" */
    char *value_copy = strdup(value);
    if (!value_copy) return false;
    
    char *space = strchr(value_copy, ' ');
    if (!space) {
        free(value_copy);
        return false;
    }
    
    *space = '\0';
    *priority = (uint16_t)atoi(value_copy);
    
    strncpy(exchange, space + 1, exchange_len - 1);
    exchange[exchange_len - 1] = '\0';
    
    free(value_copy);
    return true;
}

/*
 * Parse SRV record value
 */
bool parse_srv_record(const char *value, uint16_t *priority, uint16_t *weight, 
                     uint16_t *port, char *target, size_t target_len) {
    if (!value || !priority || !weight || !port || !target) return false;
    
    /* Format: "priority weight port target" */
    char *value_copy = strdup(value);
    if (!value_copy) return false;
    
    char *token = strtok(value_copy, " ");
    if (!token) { free(value_copy); return false; }
    *priority = (uint16_t)atoi(token);
    
    token = strtok(NULL, " ");
    if (!token) { free(value_copy); return false; }
    *weight = (uint16_t)atoi(token);
    
    token = strtok(NULL, " ");
    if (!token) { free(value_copy); return false; }
    *port = (uint16_t)atoi(token);
    
    token = strtok(NULL, " ");
    if (!token) { free(value_copy); return false; }
    strncpy(target, token, target_len - 1);
    target[target_len - 1] = '\0';
    
    free(value_copy);
    return true;
}

/*
 * Parse CAA record value
 */
bool parse_caa_record(const char *value, uint8_t *flags, char *tag, size_t tag_len,
                     char *val, size_t val_len) {
    if (!value || !flags || !tag || !val) return false;
    
    /* Format: "flags tag value" */
    char *value_copy = strdup(value);
    if (!value_copy) return false;
    
    char *token = strtok(value_copy, " ");
    if (!token) { free(value_copy); return false; }
    *flags = (uint8_t)atoi(token);
    
    token = strtok(NULL, " ");
    if (!token) { free(value_copy); return false; }
    strncpy(tag, token, tag_len - 1);
    tag[tag_len - 1] = '\0';
    
    token = strtok(NULL, "");  /* Rest of string */
    if (!token) { free(value_copy); return false; }
    strncpy(val, token, val_len - 1);
    val[val_len - 1] = '\0';
    
    free(value_copy);
    return true;
}

/*
 * Validate JSON record value for given type
 */
bool is_valid_record_value(const char *type, const char *value) {
    if (!type || !value) return false;
    
    /* Basic validation - could be expanded */
    if (strcasecmp(type, "A") == 0) {
        return is_valid_ipv4_string(value);
    }
    
    if (strcasecmp(type, "AAAA") == 0) {
        return is_valid_ipv6_string(value);
    }
    
    if (strcasecmp(type, "MX") == 0) {
        uint16_t priority;
        char exchange[256];
        return parse_mx_record(value, &priority, exchange, sizeof(exchange));
    }
    
    /* For other types, just check that value is non-empty */
    return strlen(value) > 0;
}

/*
 * Parse JSON string into record set
 */
json_recordset_t *parse_json_string(const char *json_str) {
    if (!json_str) return NULL;
    
    json_object *json_obj = json_tokener_parse(json_str);
    if (!json_obj) {
        plugin_log(LOG_WARNING, "Failed to parse JSON: %s", json_str);
        return NULL;
    }
    
    json_recordset_t *recordset = create_json_recordset();
    if (!recordset) {
        json_object_put(json_obj);
        return NULL;
    }
    
    /* Iterate through JSON object properties */
    json_object_object_foreach(json_obj, key, val) {
        if (!is_valid_record_type(key)) {
            plugin_log(LOG_WARNING, "Invalid record type in JSON: %s", key);
            continue;
        }
        
        const char *value_str = json_object_get_string(val);
        if (!value_str || !is_valid_record_value(key, value_str)) {
            plugin_log(LOG_WARNING, "Invalid record value for type %s: %s", key, value_str);
            continue;
        }
        
        if (!add_json_record(recordset, key, value_str)) {
            plugin_log(LOG_ERROR, "Failed to add JSON record: %s = %s", key, value_str);
        } else {
            plugin_log(LOG_DEBUG, "Added JSON record: %s = %s", key, value_str);
        }
    }
    
    json_object_put(json_obj);
    
    if (recordset->count == 0) {
        free_json_recordset(recordset);
        return NULL;
    }
    
    return recordset;
}

/*
 * Parse single-layer JSON domain
 */
json_recordset_t *parse_single_layer_json(const char *domain) {
    if (!domain) return NULL;
    
    bool is_multi;
    char *base32_data = extract_json_base32(domain, &is_multi);
    if (!base32_data || is_multi) {
        SAFE_FREE(base32_data);
        return NULL;
    }
    
    char *json_str = base32_to_json(base32_data);
    free(base32_data);
    
    if (!json_str) return NULL;
    
    json_recordset_t *recordset = parse_json_string(json_str);
    free(json_str);
    
    return recordset;
}

/*
 * Parse multi-layer JSON domain
 */
json_recordset_t *parse_multi_layer_json(const char *domain) {
    if (!domain) return NULL;
    
    bool is_multi;
    char *base32_data = extract_json_base32(domain, &is_multi);
    if (!base32_data || !is_multi) {
        SAFE_FREE(base32_data);
        return NULL;
    }
    
    char *json_str = base32_to_json(base32_data);
    free(base32_data);
    
    if (!json_str) return NULL;
    
    json_recordset_t *recordset = parse_json_string(json_str);
    free(json_str);
    
    return recordset;
}

/*
 * Parse JSON domain and extract records
 */
json_recordset_t *parse_json_domain(const char *domain) {
    if (!domain) return NULL;
    
    plugin_log(LOG_DEBUG, "Attempting to parse JSON domain: %s", domain);
    
    /* Try single-layer first */
    json_recordset_t *recordset = parse_single_layer_json(domain);
    if (recordset) {
        plugin_log(LOG_DEBUG, "Parsed single-layer JSON with %zu records", recordset->count);
        return recordset;
    }
    
    /* Try multi-layer */
    recordset = parse_multi_layer_json(domain);
    if (recordset) {
        plugin_log(LOG_DEBUG, "Parsed multi-layer JSON with %zu records", recordset->count);
        return recordset;
    }
    
    return NULL;
}

/*
 * Create specific DNS record from JSON record
 */
isc_result_t create_dns_record_from_json(const json_record_t *record, uint32_t ttl,
                                       dns_sdlzlookup_t *lookup) {
    if (!record || !lookup) return ISC_R_FAILURE;
    
    /* Handle simple record types directly */
    if (strcasecmp(record->type, "A") == 0 || 
        strcasecmp(record->type, "AAAA") == 0 ||
        strcasecmp(record->type, "CNAME") == 0 ||
        strcasecmp(record->type, "TXT") == 0 ||
        strcasecmp(record->type, "NS") == 0 ||
        strcasecmp(record->type, "PTR") == 0) {
        
        return dns_sdlz_putrr(lookup, record->type, ttl, record->value);
    }
    
    /* Handle MX records */
    if (strcasecmp(record->type, "MX") == 0) {
        return dns_sdlz_putrr(lookup, "MX", ttl, record->value);
    }
    
    /* Handle SRV records */
    if (strcasecmp(record->type, "SRV") == 0) {
        return dns_sdlz_putrr(lookup, "SRV", ttl, record->value);
    }
    
    /* Handle other record types similarly */
    return dns_sdlz_putrr(lookup, record->type, ttl, record->value);
}

/*
 * Add JSON records to DNS lookup result
 */
query_result_t add_json_records_to_lookup(const json_recordset_t *recordset,
                                        dns_rdatatype_t qtype, uint32_t ttl,
                                        dns_sdlzlookup_t *lookup) {
    if (!recordset || !lookup) return QUERY_RESULT_ERROR;
    
    bool found_match = false;
    
    /* Add records matching the query type */
    for (size_t i = 0; i < recordset->count; i++) {
        const json_record_t *record = &recordset->records[i];
        dns_rdatatype_t record_type = string_to_rdatatype(record->type);
        
        if (qtype == dns_rdatatype_any || qtype == record_type) {
            isc_result_t result = create_dns_record_from_json(record, ttl, lookup);
            if (result == ISC_R_SUCCESS) {
                found_match = true;
                plugin_log(LOG_DEBUG, "Added JSON record: %s %s", record->type, record->value);
            } else {
                plugin_log(LOG_WARNING, "Failed to add JSON record: %s %s (%s)", 
                          record->type, record->value, isc_result_totext(result));
            }
        }
    }
    
    return found_match ? QUERY_RESULT_SUCCESS : QUERY_RESULT_NOT_FOUND;
}

/*
 * Debug print record set
 */
void debug_print_recordset(const json_recordset_t *recordset) {
    if (!recordset) {
        plugin_log(LOG_DEBUG, "JSON recordset: NULL");
        return;
    }
    
    plugin_log(LOG_DEBUG, "JSON recordset: %zu records", recordset->count);
    for (size_t i = 0; i < recordset->count; i++) {
        plugin_log(LOG_DEBUG, "  [%zu] %s: %s", i, 
                  recordset->records[i].type, recordset->records[i].value);
    }
}

/*
 * Validate complete JSON record set
 */
bool validate_json_recordset(const json_recordset_t *recordset) {
    if (!recordset || recordset->count == 0) return false;
    
    for (size_t i = 0; i < recordset->count; i++) {
        const json_record_t *record = &recordset->records[i];
        if (!record->type || !record->value ||
            !is_valid_record_type(record->type) ||
            !is_valid_record_value(record->type, record->value)) {
            return false;
        }
    }
    
    return true;
}