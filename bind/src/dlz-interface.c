/*
 * DLZ Interface Module - Implementation
 * 
 * This module provides the interface between BIND's DLZ system and the 2DNS plugin.
 * It handles BIND-specific operations and data structures.
 */

#include "2dns-plugin.h"

/*
 * DLZ interface function implementations
 * These functions are called by BIND's DLZ system
 */

/* This file currently serves as a placeholder for any additional DLZ-specific
 * functionality that might be needed beyond what's already implemented in
 * 2dns-plugin.c. The main DLZ functions are implemented there:
 * 
 * - dlz_create()     - Plugin initialization
 * - dlz_destroy()    - Plugin cleanup  
 * - dlz_findzonedb() - Zone discovery
 * - dlz_lookup()     - DNS query processing
 *
 * Additional DLZ functions could be implemented here if needed:
 * - dlz_allowzonexfr() - Zone transfer authorization
 * - dlz_allnodes()     - Return all records in a zone
 * - dlz_authority()    - Return authority records
 * - dlz_newversion()   - Start a new database version
 * - dlz_closeversion() - Close a database version
 * - dlz_configure()    - Runtime configuration
 * - dlz_ssumatch()     - Secure update matching
 * - dlz_addrdataset()  - Add records
 * - dlz_subrdataset()  - Subtract records
 * - dlz_delrdataset()  - Delete records
 */

/*
 * Helper function to add SOA record for zone authority
 */
isc_result_t add_soa_record(dns_sdlzlookup_t *lookup, const char *zone, uint32_t ttl) {
    char soa_data[512];
    
    /* Create basic SOA record */
    snprintf(soa_data, sizeof(soa_data), 
             "ns1.%s admin.%s 2025010101 3600 1800 604800 86400",
             zone, zone);
    
    return dns_sdlz_putrr(lookup, "SOA", ttl, soa_data);
}

/*
 * Helper function to add NS records for zone authority
 */
isc_result_t add_ns_records(dns_sdlzlookup_t *lookup, const char *zone, uint32_t ttl) {
    char ns_data[256];
    
    snprintf(ns_data, sizeof(ns_data), "ns1.%s", zone);
    isc_result_t result = dns_sdlz_putrr(lookup, "NS", ttl, ns_data);
    
    if (result == ISC_R_SUCCESS) {
        snprintf(ns_data, sizeof(ns_data), "ns2.%s", zone);
        result = dns_sdlz_putrr(lookup, "NS", ttl, ns_data);
    }
    
    return result;
}

/*
 * Check if query is for zone apex (root of zone)
 */
bool is_zone_apex(const char *name, const char *zone) {
    if (!name || !zone) return false;
    
    char *normalized_name = normalize_domain(name);
    char *normalized_zone = normalize_domain(zone);
    
    if (!normalized_name || !normalized_zone) {
        SAFE_FREE(normalized_name);
        SAFE_FREE(normalized_zone);
        return false;
    }
    
    bool is_apex = (strcmp(normalized_name, normalized_zone) == 0);
    
    free(normalized_name);
    free(normalized_zone);
    
    return is_apex;
}

/*
 * Handle zone apex queries (SOA, NS records)
 */
isc_result_t handle_zone_apex(const char *zone, dns_rdatatype_t qtype,
                             uint32_t ttl, dns_sdlzlookup_t *lookup) {
    if (!zone || !lookup) return ISC_R_FAILURE;
    
    isc_result_t result = ISC_R_SUCCESS;
    
    /* Add SOA record for SOA queries or ANY queries */
    if (qtype == dns_rdatatype_soa || qtype == dns_rdatatype_any) {
        result = add_soa_record(lookup, zone, ttl);
        if (result != ISC_R_SUCCESS) {
            plugin_log(LOG_ERROR, "Failed to add SOA record for zone %s", zone);
            return result;
        }
    }
    
    /* Add NS records for NS queries or ANY queries */
    if (qtype == dns_rdatatype_ns || qtype == dns_rdatatype_any) {
        result = add_ns_records(lookup, zone, ttl);
        if (result != ISC_R_SUCCESS) {
            plugin_log(LOG_ERROR, "Failed to add NS records for zone %s", zone);
            return result;
        }
    }
    
    return result;
}

/*
 * Validate query parameters
 */
bool validate_query_params(const char *zone, const char *name, dns_sdlzlookup_t *lookup) {
    if (!zone || !name || !lookup) {
        plugin_log(LOG_ERROR, "Invalid query parameters: zone=%p, name=%p, lookup=%p",
                  zone, name, lookup);
        return false;
    }
    
    if (strlen(zone) > MAX_DOMAIN_LENGTH || strlen(name) > MAX_DOMAIN_LENGTH) {
        plugin_log(LOG_WARNING, "Domain name too long: zone=%zu, name=%zu",
                  strlen(zone), strlen(name));
        return false;
    }
    
    return true;
}

/*
 * Enhanced DNS lookup with better error handling and zone authority
 */
isc_result_t enhanced_dlz_lookup(const char *zone, const char *name, void *dbdata,
                               dns_sdlzlookup_t *lookup, dns_rdatatype_t qtype) {
    
    plugin_instance_t *instance = (plugin_instance_t *)dbdata;
    
    /* Validate parameters */
    if (!validate_query_params(zone, name, lookup) || !instance) {
        return ISC_R_FAILURE;
    }
    
    plugin_log(LOG_DEBUG, "Enhanced lookup: zone=%s, name=%s, type=%d", zone, name, qtype);
    
    /* Check if this is a 2DNS domain */
    if (!is_2dns_domain(name)) {
        plugin_log(LOG_DEBUG, "Not a 2DNS domain: %s", name);
        return ISC_R_NOTFOUND;
    }
    
    /* Handle zone apex queries */
    if (is_zone_apex(name, zone)) {
        plugin_log(LOG_DEBUG, "Handling zone apex query for %s", zone);
        isc_result_t result = handle_zone_apex(zone, qtype, instance->config.default_ttl, lookup);
        if (result == ISC_R_SUCCESS) {
            return result;
        }
        /* If SOA/NS handling failed, continue with normal processing */
    }
    
    /* Process the query using main plugin logic */
    query_result_t result = process_query(name, qtype, instance, lookup);
    
    switch (result) {
        case QUERY_RESULT_SUCCESS:
            plugin_log(LOG_DEBUG, "Query successful: %s", name);
            return ISC_R_SUCCESS;
            
        case QUERY_RESULT_NOT_FOUND:
            plugin_log(LOG_DEBUG, "Query not found: %s", name);
            return ISC_R_NOTFOUND;
            
        case QUERY_RESULT_INVALID_FORMAT:
            plugin_log(LOG_WARNING, "Invalid format in query: %s", name);
            return ISC_R_NOTFOUND;
            
        case QUERY_RESULT_ERROR:
        default:
            plugin_log(LOG_ERROR, "Error processing query: %s", name);
            return ISC_R_FAILURE;
    }
}

/*
 * Zone configuration validation
 */
bool validate_zone_config(const char *zone) {
    if (!zone) return false;
    
    /* Ensure zone is properly formatted */
    if (!is_2dns_domain(zone)) {
        plugin_log(LOG_WARNING, "Zone is not a 2DNS domain: %s", zone);
        return false;
    }
    
    return true;
}

/*
 * Initialize zone-specific data
 */
isc_result_t init_zone_data(plugin_instance_t *instance, const char *zone) {
    if (!instance || !zone) return ISC_R_FAILURE;
    
    if (!validate_zone_config(zone)) {
        return ISC_R_FAILURE;
    }
    
    plugin_log(LOG_INFO, "Initialized zone data for: %s", zone);
    return ISC_R_SUCCESS;
}

/*
 * Cleanup zone-specific data
 */
void cleanup_zone_data(plugin_instance_t *instance, const char *zone) {
    if (!instance || !zone) return;
    
    plugin_log(LOG_DEBUG, "Cleaned up zone data for: %s", zone);
}

/*
 * Get plugin statistics (for monitoring/debugging)
 */
void get_plugin_statistics(plugin_instance_t *instance, char *buffer, size_t buffer_size) {
    if (!instance || !buffer || buffer_size == 0) return;
    
    snprintf(buffer, buffer_size,
             "2DNS Plugin Statistics:\n"
             "  IP Reflection: %s\n"
             "  JSON Records: %s\n"
             "  Dual Stack: %s\n"
             "  Default TTL: %u\n"
             "  Log Level: %d\n",
             instance->config.enable_ip_reflection ? "enabled" : "disabled",
             instance->config.enable_json_records ? "enabled" : "disabled",
             instance->config.enable_dual_stack ? "enabled" : "disabled",
             instance->config.default_ttl,
             instance->config.log_level);
}

/*
 * Handle plugin configuration updates
 */
isc_result_t update_plugin_config(plugin_instance_t *instance, const char *param, const char *value) {
    if (!instance || !param || !value) return ISC_R_FAILURE;
    
    plugin_log(LOG_INFO, "Updating config: %s = %s", param, value);
    
    if (strcmp(param, "ttl") == 0) {
        uint32_t new_ttl = (uint32_t)atoi(value);
        if (new_ttl > 0 && new_ttl <= 86400) {  /* Max 1 day */
            instance->config.default_ttl = new_ttl;
            return ISC_R_SUCCESS;
        }
    } else if (strcmp(param, "log_level") == 0) {
        int new_level = atoi(value);
        if (new_level >= LOG_ERROR && new_level <= LOG_DEBUG) {
            instance->config.log_level = new_level;
            return ISC_R_SUCCESS;
        }
    } else if (strcmp(param, "enable_ip_reflection") == 0) {
        instance->config.enable_ip_reflection = (strcasecmp(value, "true") == 0 || 
                                                 strcmp(value, "1") == 0);
        return ISC_R_SUCCESS;
    } else if (strcmp(param, "enable_json_records") == 0) {
        instance->config.enable_json_records = (strcasecmp(value, "true") == 0 || 
                                               strcmp(value, "1") == 0);
        return ISC_R_SUCCESS;
    }
    
    plugin_log(LOG_WARNING, "Unknown configuration parameter: %s", param);
    return ISC_R_NOTFOUND;
}

/*
 * Health check function
 */
bool plugin_health_check(plugin_instance_t *instance) {
    if (!instance) return false;
    
    /* Basic health checks */
    if (instance->config.default_ttl == 0 || instance->config.default_ttl > 86400) {
        plugin_log(LOG_ERROR, "Invalid TTL configuration: %u", instance->config.default_ttl);
        return false;
    }
    
    if (instance->config.log_level < LOG_ERROR || instance->config.log_level > LOG_DEBUG) {
        plugin_log(LOG_ERROR, "Invalid log level: %d", instance->config.log_level);
        return false;
    }
    
    /* Test basic functionality */
    ip_address_t test_addr;
    if (!parse_direct_ipv4("1.2.3.4.2dns.dev", &test_addr)) {
        plugin_log(LOG_ERROR, "IP reflection functionality test failed");
        return false;
    }
    
    plugin_log(LOG_DEBUG, "Plugin health check passed");
    return true;
}