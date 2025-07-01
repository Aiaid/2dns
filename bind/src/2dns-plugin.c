/*
 * 2DNS BIND Plugin - Main implementation
 * 
 * This is the main plugin file that implements the BIND DLZ interface
 * for 2DNS IP reflection and JSON multi-record functionality.
 */

#include "2dns-plugin.h"
#include "ip-reflection.h"
#include "json-parser.h"
#include "base32.h"

#include <syslog.h>
#include <stdarg.h>

/* Global plugin instance */
static plugin_instance_t *g_instance = NULL;

/* DLZ method structure - required by BIND */
dns_dlzmethods_t dlzmethods = {
    dlz_create,
    dlz_destroy,
    dlz_findzonedb,
    dlz_lookup,
    NULL,  /* allowzonexfr */
    NULL,  /* allnodes */
    NULL,  /* authority */
    NULL,  /* newversion */
    NULL,  /* closeversion */
    NULL,  /* configure */
    NULL,  /* ssumatch */
    NULL,  /* addrdataset */
    NULL,  /* subrdataset */
    NULL,  /* delrdataset */
    NULL   /* createnode */
};

/*
 * Logging function
 */
void plugin_log(int level, const char *format, ...) {
    va_list args;
    int syslog_level;
    
    /* Map plugin log levels to syslog levels */
    switch (level) {
        case LOG_ERROR:   syslog_level = LOG_ERR; break;
        case LOG_WARNING: syslog_level = LOG_WARNING; break;
        case LOG_INFO:    syslog_level = LOG_INFO; break;
        case LOG_DEBUG:   syslog_level = LOG_DEBUG; break;
        default:          syslog_level = LOG_INFO; break;
    }
    
    /* Only log if level is enabled */
    if (g_instance && level <= g_instance->config.log_level) {
        va_start(args, format);
        vsyslog(syslog_level, format, args);
        va_end(args);
    }
}

/*
 * Initialize plugin configuration with defaults
 */
static void init_default_config(plugin_config_t *config) {
    config->enable_ip_reflection = true;
    config->enable_json_records = true;
    config->enable_dual_stack = true;
    config->default_ttl = 300;  /* 5 minutes */
    config->log_level = LOG_INFO;
}

/*
 * Check if domain belongs to 2DNS
 */
bool is_2dns_domain(const char *name) {
    if (!name) return false;
    
    /* Remove trailing dot and convert to lowercase for comparison */
    char *normalized = normalize_domain(name);
    if (!normalized) return false;
    
    bool result = (strstr(normalized, "2dns.dev") != NULL);
    free(normalized);
    return result;
}

/*
 * Normalize domain name (lowercase, remove trailing dot)
 */
char *normalize_domain(const char *name) {
    if (!name) return NULL;
    
    size_t len = strlen(name);
    if (len == 0) return NULL;
    
    char *normalized = malloc(len + 1);
    if (!normalized) return NULL;
    
    strcpy(normalized, name);
    
    /* Remove trailing dot */
    if (normalized[len - 1] == '.') {
        normalized[len - 1] = '\0';
    }
    
    /* Convert to lowercase */
    for (char *p = normalized; *p; p++) {
        *p = tolower((unsigned char)*p);
    }
    
    return normalized;
}

/*
 * Clean up string (remove extra spaces, etc.)
 */
void cleanup_string(char *str) {
    if (!str) return;
    
    /* Remove leading/trailing whitespace */
    char *start = str;
    while (isspace((unsigned char)*start)) start++;
    
    if (*start == 0) {
        *str = 0;
        return;
    }
    
    char *end = start + strlen(start) - 1;
    while (end > start && isspace((unsigned char)*end)) end--;
    
    size_t len = end - start + 1;
    memmove(str, start, len);
    str[len] = 0;
}

/*
 * Process a DNS query
 */
query_result_t process_query(const char *qname, dns_rdatatype_t qtype,
                           plugin_instance_t *instance, dns_sdlzlookup_t *lookup) {
    
    if (!qname || !instance || !lookup) {
        return QUERY_RESULT_ERROR;
    }
    
    plugin_log(LOG_DEBUG, "Processing query: %s (type %d)", qname, qtype);
    
    /* Normalize the query name */
    char *normalized = normalize_domain(qname);
    if (!normalized) {
        return QUERY_RESULT_ERROR;
    }
    
    query_result_t result = QUERY_RESULT_NOT_FOUND;
    
    /* Try JSON multi-record parsing first */
    if (instance->config.enable_json_records) {
        json_recordset_t *recordset = parse_json_domain(normalized);
        if (recordset) {
            result = add_json_records_to_lookup(recordset, qtype, 
                                              instance->config.default_ttl, lookup);
            free_json_recordset(recordset);
            if (result == QUERY_RESULT_SUCCESS) {
                goto cleanup;
            }
        }
    }
    
    /* Try IP reflection */
    if (instance->config.enable_ip_reflection) {
        ip_address_t ip_addr;
        if (parse_ip_from_domain(normalized, &ip_addr)) {
            result = add_ip_record_to_lookup(&ip_addr, qtype,
                                           instance->config.default_ttl, lookup);
            if (result == QUERY_RESULT_SUCCESS) {
                goto cleanup;
            }
        }
    }
    
    /* Try dual-stack parsing */
    if (instance->config.enable_dual_stack) {
        ip_address_t ipv4_addr, ipv6_addr;
        if (parse_dual_stack_domain(normalized, &ipv4_addr, &ipv6_addr)) {
            /* Add both IPv4 and IPv6 records */
            if (qtype == dns_rdatatype_a || qtype == dns_rdatatype_any) {
                add_ip_record_to_lookup(&ipv4_addr, dns_rdatatype_a,
                                      instance->config.default_ttl, lookup);
            }
            if (qtype == dns_rdatatype_aaaa || qtype == dns_rdatatype_any) {
                add_ip_record_to_lookup(&ipv6_addr, dns_rdatatype_aaaa,
                                      instance->config.default_ttl, lookup);
            }
            result = QUERY_RESULT_SUCCESS;
        }
    }
    
cleanup:
    free(normalized);
    return result;
}

/*
 * DLZ create function - called when plugin is loaded
 */
isc_result_t dlz_create(const char *dlzname, unsigned int argc, char *argv[],
                       void *driverarg, void **dbdata) {
    
    UNUSED(driverarg);
    
    plugin_log(LOG_INFO, "Creating 2DNS plugin instance: %s", dlzname);
    
    /* Allocate plugin instance */
    plugin_instance_t *instance = malloc(sizeof(plugin_instance_t));
    if (!instance) {
        plugin_log(LOG_ERROR, "Failed to allocate plugin instance");
        return ISC_R_NOMEMORY;
    }
    
    /* Initialize configuration */
    init_default_config(&instance->config);
    
    /* Process command line arguments */
    for (unsigned int i = 0; i < argc; i++) {
        if (strcmp(argv[i], "debug") == 0) {
            instance->config.log_level = LOG_DEBUG;
        } else if (strncmp(argv[i], "ttl=", 4) == 0) {
            instance->config.default_ttl = atoi(argv[i] + 4);
        } else if (strcmp(argv[i], "no-json") == 0) {
            instance->config.enable_json_records = false;
        } else if (strcmp(argv[i], "no-ip-reflection") == 0) {
            instance->config.enable_ip_reflection = false;
        }
    }
    
    /* Initialize syslog */
    openlog("bind-2dns-plugin", LOG_PID, LOG_DAEMON);
    
    /* Store instance */
    instance->dlz_data = NULL;
    g_instance = instance;
    *dbdata = instance;
    
    plugin_log(LOG_INFO, "2DNS plugin initialized successfully");
    plugin_log(LOG_DEBUG, "Config: IP reflection=%s, JSON records=%s, TTL=%d",
               instance->config.enable_ip_reflection ? "yes" : "no",
               instance->config.enable_json_records ? "yes" : "no",
               instance->config.default_ttl);
    
    return ISC_R_SUCCESS;
}

/*
 * DLZ destroy function - called when plugin is unloaded
 */
void dlz_destroy(void *dbdata) {
    plugin_instance_t *instance = (plugin_instance_t *)dbdata;
    
    if (instance) {
        plugin_log(LOG_INFO, "Destroying 2DNS plugin instance");
        free(instance);
        g_instance = NULL;
    }
    
    closelog();
}

/*
 * DLZ findzonedb function - determine if we handle this zone
 */
isc_result_t dlz_findzonedb(void *dbdata, const char *name) {
    UNUSED(dbdata);
    
    if (!name) {
        return ISC_R_NOTFOUND;
    }
    
    /* We handle 2dns.dev domains */
    if (is_2dns_domain(name)) {
        plugin_log(LOG_DEBUG, "Zone found: %s", name);
        return ISC_R_SUCCESS;
    }
    
    return ISC_R_NOTFOUND;
}

/*
 * DLZ lookup function - main query processing
 */
isc_result_t dlz_lookup(const char *zone, const char *name, void *dbdata,
                       dns_sdlzlookup_t *lookup) {
    
    plugin_instance_t *instance = (plugin_instance_t *)dbdata;
    
    if (!zone || !name || !instance || !lookup) {
        return ISC_R_FAILURE;
    }
    
    plugin_log(LOG_DEBUG, "Lookup: zone=%s, name=%s", zone, name);
    
    /* Check if this is a 2DNS domain */
    if (!is_2dns_domain(name)) {
        return ISC_R_NOTFOUND;
    }
    
    /* Process the query */
    query_result_t result = process_query(name, dns_rdatatype_any, instance, lookup);
    
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