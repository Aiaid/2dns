# 2DNS API Reference

This document describes the 2DNS API and supported query formats.

## Overview

2DNS provides DNS resolution services with IP address reflection capabilities. It supports both standard DNS records from CSV files and dynamic IP address encoding/decoding.

## DNS Query Formats

### 1. Standard DNS Records

When CSV records are loaded, 2DNS acts as an authoritative DNS server for configured domains.

**Query Format:**
```
dig @<server> <domain> <type>
```

**Example:**
```bash
dig @2dns.dev example.com A
dig @2dns.dev www.example.com CNAME
```

### 2. IPv4 Address Reflection

**Format:** `<ipv4>.<domain>`

**Examples:**
```bash
# Direct IPv4 encoding
dig @2dns.dev 192.168.1.1.2dns.dev A
# Returns: 192.168.1.1

# Base32 encoded IPv4
dig @2dns.dev AEBAGBA8.2dns.dev A  
# Returns: 1.2.3.4 (AEBAGBA8 = Base32 of 1.2.3.4)
```

### 3. IPv6 Address Reflection

**Complete Format:** `xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx.<domain>`

**Examples:**
```bash
# Full IPv6 notation
dig @2dns.dev 2001-0db8-85a3-0000-0000-8a2e-0370-7334.2dns.dev AAAA
# Returns: 2001:0db8:85a3:0000:0000:8a2e:0370:7334

# Compressed notation (leading zeros omitted)
dig @2dns.dev 2001-db8-85a3-0-0-8a2e-370-7334.2dns.dev AAAA
# Returns: 2001:0db8:85a3:0000:0000:8a2e:0370:7334

# Zero group compression with 'z'
dig @2dns.dev 2001-db8-85a3-z-8a2e-370-7334.2dns.dev AAAA
# Returns: 2001:0db8:85a3:0000:0000:8a2e:0370:7334

# Base32 encoded IPv6
dig @2dns.dev EAAQ3OEFUMAAAAAARIXAG4DTGQ888888.2dns.dev AAAA
# Returns: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
```

### 4. Dual-Stack Format

**Format:** `<base32-ipv4><base32-ipv6>.<domain>`

The first 8 characters represent Base32-encoded IPv4, followed by 32 characters for Base32-encoded IPv6.

**Examples:**
```bash
# Query for IPv4 part
dig @2dns.dev AEBAGBA8EAAQ3OEFUMAAAAAARIXAG4DTGQ888888.2dns.dev A
# Returns: 1.2.3.4

# Query for IPv6 part  
dig @2dns.dev AEBAGBA8EAAQ3OEFUMAAAAAARIXAG4DTGQ888888.2dns.dev AAAA
# Returns: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
```

## Supported Record Types

### Standard DNS Records

- **A**: IPv4 address records
- **AAAA**: IPv6 address records  
- **CNAME**: Canonical name records
- **MX**: Mail exchange records
- **NS**: Name server records
- **PTR**: Pointer records
- **SOA**: Start of authority records
- **SRV**: Service records
- **TXT**: Text records
- **CAA**: Certification Authority Authorization

### Extended Record Types

- **ALIAS**: Zone apex CNAME alternative (resolves at server level)
- **ANAME**: Automatic A/AAAA resolution for target domains

## Response Codes

| Code | Description |
|------|-------------|
| NOERROR | Successful response with records |
| NXDOMAIN | Domain not found |
| SERVFAIL | Server failure (internal error) |
| REFUSED | Query refused |

## Base32 Encoding Details

### IPv4 Base32 Encoding

- IPv4 addresses (4 bytes) are encoded to 8 Base32 characters
- Padding character '=' is replaced with '8'
- Case-insensitive (both upper and lower case accepted)

**Example:**
```
IP: 1.2.3.4
Hex: 0x01020304
Base32: AEBAGBA=
Domain: AEBAGBA8
```

### IPv6 Base32 Encoding

- IPv6 addresses (16 bytes) are encoded to 32 Base32 characters  
- Padding characters '=' are replaced with '8'
- Case-insensitive

**Example:**
```
IP: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
Hex: 20010db885a3000000008a2e03707334
Base32: EAAQ3OEFUMAAAAAARIXAG4DTGQ======
Domain: EAAQ3OEFUMAAAAAARIXAG4DTGQ888888
```

## Error Handling

### Invalid Formats

If a domain doesn't match any supported format:
- Returns NXDOMAIN for unknown domains
- Includes SOA record in authority section when available

### Malformed Addresses

- Invalid IPv4/IPv6 addresses return NXDOMAIN
- Invalid Base32 encoding returns NXDOMAIN
- Incomplete dual-stack formats return NXDOMAIN

## Rate Limiting

The public 2dns.dev service may implement rate limiting:
- Per-IP query limits
- Burst protection
- Fair usage policies

## Security Considerations

- DNS queries are logged for operational purposes
- No sensitive data should be encoded in domain names
- Public service terms of use apply

## Client Libraries

### Command Line Tools

```bash
# Using dig
dig @2dns.dev 192.168.1.1.2dns.dev A

# Using nslookup  
nslookup 192.168.1.1.2dns.dev 2dns.dev

# Using host
host 192.168.1.1.2dns.dev 2dns.dev
```

### Programming Examples

**Python:**
```python
import dns.resolver

resolver = dns.resolver.Resolver()
resolver.nameservers = ['2dns.dev']
result = resolver.resolve('192.168.1.1.2dns.dev', 'A')
print(result[0])  # 192.168.1.1
```

**Go:**
```go
package main

import (
    "fmt"
    "net"
)

func main() {
    ips, err := net.LookupIP("192.168.1.1.2dns.dev")
    if err != nil {
        panic(err)
    }
    fmt.Println(ips[0])  // 192.168.1.1
}
```

**Node.js:**
```javascript
const dns = require('dns');

dns.resolve4('192.168.1.1.2dns.dev', (err, addresses) => {
    if (err) throw err;
    console.log(addresses[0]); // 192.168.1.1
});
```