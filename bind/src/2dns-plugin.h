/*
 * 2DNS BIND Plugin - Main header file
 * 
 * This file defines the main structures and interfaces for the 2DNS BIND plugin.
 * The plugin provides IP reflection and JSON multi-record functionality.
 */

#ifndef _2DNS_PLUGIN_H
#define _2DNS_PLUGIN_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>

/* BIND includes */
#include <dns/dlz.h>
#include <dns/result.h>
#include <dns/types.h>
#include <isc/mem.h>
#include <isc/result.h>
#include <isc/util.h>

/* Plugin version */
#define PLUGIN_VERSION "1.0.0"
#define PLUGIN_NAME "2dns-reflection"

/* DNS record limits */
#define MAX_DOMAIN_LENGTH 253
#define MAX_LABEL_LENGTH 63
#define MAX_JSON_SIZE 8192
#define MAX_RR_DATA_LENGTH 512

/* Base32 constants */
#define BASE32_ALPHABET "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
#define BASE32_PADDING_CHAR '8'  /* DNS-safe replacement for '=' */

/* Plugin configuration structure */
typedef struct {
    bool enable_ip_reflection;
    bool enable_json_records;
    bool enable_dual_stack;
    uint32_t default_ttl;
    int log_level;
} plugin_config_t;

/* Query processing result */
typedef enum {
    QUERY_RESULT_SUCCESS = 0,
    QUERY_RESULT_NOT_FOUND,
    QUERY_RESULT_ERROR,
    QUERY_RESULT_INVALID_FORMAT
} query_result_t;

/* IP address structure */
typedef struct {
    union {
        uint8_t ipv4[4];
        uint8_t ipv6[16];
    } addr;
    int family;  /* AF_INET or AF_INET6 */
} ip_address_t;

/* JSON record structure */
typedef struct {
    char *type;
    char *value;
} json_record_t;

/* JSON record set */
typedef struct {
    json_record_t *records;
    size_t count;
    size_t capacity;
} json_recordset_t;

/* Plugin instance data */
typedef struct {
    plugin_config_t config;
    isc_mem_t *mctx;
    void *dlz_data;
} plugin_instance_t;

/* Function prototypes */

/* Main plugin interface */
isc_result_t dlz_create(const char *dlzname, unsigned int argc, char *argv[],
                       void *driverarg, void **dbdata);
void dlz_destroy(void *dbdata);
isc_result_t dlz_findzonedb(void *dbdata, const char *name);
isc_result_t dlz_lookup(const char *zone, const char *name, void *dbdata,
                       dns_sdlzlookup_t *lookup);

/* Query processing */
query_result_t process_query(const char *qname, dns_rdatatype_t qtype,
                           plugin_instance_t *instance, dns_sdlzlookup_t *lookup);

/* Utility functions */
bool is_2dns_domain(const char *name);
char *normalize_domain(const char *name);
void cleanup_string(char *str);

/* Logging */
void plugin_log(int level, const char *format, ...);
#define LOG_ERROR   1
#define LOG_WARNING 2
#define LOG_INFO    3
#define LOG_DEBUG   4

/* Memory management helpers */
#define SAFE_FREE(ptr) do { if (ptr) { free(ptr); ptr = NULL; } } while(0)
#define SAFE_STRDUP(dst, src) do { \
    if (src) { \
        dst = strdup(src); \
        if (!dst) return ISC_R_NOMEMORY; \
    } else { \
        dst = NULL; \
    } \
} while(0)

/* Error handling macros */
#define CHECK_RESULT(result, msg) do { \
    if (result != ISC_R_SUCCESS) { \
        plugin_log(LOG_ERROR, "%s: %s", msg, isc_result_totext(result)); \
        return result; \
    } \
} while(0)

#define RETURN_IF_NULL(ptr, msg) do { \
    if (!ptr) { \
        plugin_log(LOG_ERROR, "%s: NULL pointer", msg); \
        return ISC_R_NOMEMORY; \
    } \
} while(0)

/* String validation */
#define IS_VALID_LABEL_CHAR(c) (((c) >= 'a' && (c) <= 'z') || \
                               ((c) >= 'A' && (c) <= 'Z') || \
                               ((c) >= '0' && (c) <= '9') || \
                               (c) == '-')

/* Plugin registration */
extern dns_dlzmethods_t dlzmethods;

#endif /* _2DNS_PLUGIN_H */