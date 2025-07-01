# 2DNS BIND Plugin

This directory contains the BIND DLZ (Dynamic Database) plugin implementation for 2DNS functionality.

## Overview

The 2DNS BIND plugin provides IP reflection and JSON multi-record functionality as a BIND DLZ plugin, eliminating the need for a separate DNS server while providing better performance and integration.

## Features

- **IP Reflection**: Direct IPv4/IPv6 address reflection from domain names
- **Base32 Encoding**: Support for Base32-encoded IP addresses
- **JSON Multi-Record**: Parse JSON-encoded DNS records from domain names
- **Dual-Stack**: Combined IPv4+IPv6 address handling
- **Multi-Layer Domains**: Support for long JSON data split across multiple domain labels

## Architecture

```
DNS Query → BIND → 2DNS Plugin → JSON Parser / IP Reflection → DNS Response
```

The plugin integrates with BIND's DLZ interface to provide dynamic DNS record generation without requiring static zone files.

## Building

### Prerequisites

- BIND 9.11+ with DLZ support
- GCC/Clang compiler
- JSON-C library
- Make

### Build Commands

```bash
# Install dependencies (Ubuntu/Debian)
sudo apt-get install bind9-dev libjson-c-dev

# Build plugin
make

# Install plugin
sudo make install
```

## Configuration

### BIND Configuration (`named.conf`)

```bind
dlz "2dns-reflection" {
    database "filesystem /usr/lib/bind/2dns-plugin.so dlz_create";
};

zone "2dns.dev" {
    type dlz;
    database "2dns-reflection";
};
```

### Plugin Configuration

The plugin configuration is embedded in the BIND configuration for simplicity.

## Supported Formats

### 1. Direct IPv4 Reflection
- Format: `<ipv4>.2dns.dev`
- Example: `1.2.3.4.2dns.dev` → Returns A record: 1.2.3.4

### 2. Direct IPv6 Reflection
- Format: `<ipv6-with-hyphens>.2dns.dev`
- Example: `2001-db8-85a3-0-0-8a2e-370-7334.2dns.dev` → Returns AAAA record

### 3. Base32 Encoded IPv4
- Format: `<base32-ipv4>.2dns.dev`
- Example: `AEBAGBA8.2dns.dev` → Returns A record: 1.2.3.4

### 4. Base32 Encoded IPv6
- Format: `<base32-ipv6>.2dns.dev`
- Example: Long Base32 string → Returns AAAA record

### 5. JSON Multi-Record (Single Layer)
- Format: `j<base32-json>.2dns.dev`
- Example: `jNB2HI4DTHIXS653XO4XAZLSMU6Q8888.2dns.dev`
- Supports: A, AAAA, TXT, MX, CNAME, SRV, and more

### 6. JSON Multi-Record (Multi Layer)
- Format: `j1<part1>.j2<part2>.j3<part3>.2dns.dev`
- For JSON data exceeding DNS label limits

## Development

### Source Files

- `2dns-plugin.c` - Main plugin implementation
- `ip-reflection.c` - IP address parsing and reflection
- `json-parser.c` - JSON multi-record parsing
- `base32.c` - Base32 encoding/decoding utilities
- `dlz-interface.c` - BIND DLZ interface implementation

### Testing

```bash
# Build test suite
make test

# Run unit tests
./test-runner

# Test with dig
dig @localhost -p 53 1.2.3.4.2dns.dev A
```

## Performance

The BIND plugin implementation provides significant performance improvements over the standalone Go server:

- **Reduced Latency**: No network overhead between BIND and plugin
- **Memory Efficiency**: Shared memory space with BIND
- **Query Caching**: Leverages BIND's built-in caching mechanisms
- **Scalability**: Handles concurrent queries within BIND's proven architecture

## Troubleshooting

### Common Issues

1. **Plugin not loading**
   - Check BIND configuration syntax
   - Verify plugin file permissions
   - Check BIND error logs

2. **DNS queries not working**
   - Verify zone configuration
   - Check plugin initialization logs
   - Test with verbose dig output

### Logging

The plugin uses BIND's logging system. Enable debug logging in `named.conf`:

```bind
logging {
    channel debug_log {
        file "/var/log/named/debug.log";
        severity debug;
        print-category yes;
        print-severity yes;
        print-time yes;
    };
    category dlz { debug_log; };
};
```

## License

MIT License - Same as the main 2DNS project.