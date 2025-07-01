# 2DNS - DNS Reflection Server

2DNS is a versatile DNS reflection server that allows you to encode IP addresses in domain names and have them reflected back in DNS responses. This can be useful for various networking applications, diagnostics, and DNS-based service discovery.

**Live Service:** 2dns.dev | [GitHub Pages (English)](https://aiaid.github.io/2dns/en/) | [GitHub Pages (Chinese)](https://aiaid.github.io/2dns/zh/)

[中文](README.zh.md) | [Documentation](docs/README.md)

## Features

- Supports both IPv4 and IPv6 addresses
- Multiple encoding formats:
  - Direct IPv4 reflection
  - IPv6 with various notation formats
  - Base32 encoding for both IPv4 and IPv6 addresses (case-insensitive)
  - Dual-stack support (both IPv4 and IPv6 in a single domain)
  - **NEW**: Multi-record JSON format (encode multiple DNS record types in one domain)
- Comprehensive DNS record type support (A, AAAA, TXT, MX, SRV, CNAME, and many more)
- CSV file support for traditional DNS records
- Wildcard record support
- Runs on multiple ports and network types for maximum compatibility
- Lightweight and efficient Go implementation

## Installation

### Using the Public Service

You can use the public 2DNS service at [2dns.dev](https://2dns.dev) without any installation.

### Self-Hosting

#### Option 1: Build from Source

```bash
# Clone the repository
git clone https://github.com/Aiaid/2dns.git
cd 2dns/src

# Build the binary
go build -o 2dns 2dns.go

# Run the server
./2dns
```

#### Option 2: Using Docker

You can use the pre-built Docker image from DockerHub:

```bash
# Pull the image
docker pull aiaid/2dns

# Run the container
docker run -p 53:53/udp -p 53:53/tcp aiaid/2dns
```

Or use docker-compose:

```bash
# Clone the repository
git clone https://github.com/Aiaid/2dns.git
cd 2dns/docker

# Run with docker-compose
docker-compose up -d
```

## Usage

The public service at [2dns.dev](https://2dns.dev) listens on standard DNS ports (53/UDP and 53/TCP).

If you're self-hosting, the server listens on ports 8053-8058 for DNS queries and responds with the IP address encoded in the domain name.

### Command Line Options

```bash
./2dns [options]
```

Available options:
- `-mode`: Run mode: `dev` or `production` (default: `dev`)
- `-port`: Specify port number (overrides mode default port)
- `-csv`: Path to CSV file containing DNS records
- `-ttl`: Specify TTL in seconds (0 means use mode default)
- `-verbose`: Enable verbose logging (overrides mode default)

### CSV File Support

In addition to the IP reflection functionality, 2DNS can also serve traditional DNS records from a CSV file. This allows you to use 2DNS as a simple authoritative DNS server for your domains.

#### CSV File Format

The CSV file should have the following columns:
- `name`: The domain name (e.g., `example.com` or `*.example.com` for wildcard records)
- `type`: The DNS record type (A, AAAA, CNAME, MX, TXT, etc.)
- `value`: The record value
- `ttl`: (Optional) Time to live in seconds (defaults to the server's TTL if not specified)
- `priority`: (Optional) Priority for MX and SRV records
- `weight`: (Optional) Weight for SRV records
- `port`: (Optional) Port for SRV records

Example CSV file:
```csv
name,type,value,ttl,priority,weight,port
example.com,A,192.168.1.1,3600,,,
example.com,AAAA,2001:db8::1,3600,,,
example.com,TXT,"This is a test record",3600,,,
www.example.com,CNAME,example.com,3600,,,
example.com,MX,mail.example.com,3600,10,,
_sip._tcp.example.com,SRV,sip.example.com,3600,10,20,5060
*.example.com,A,192.168.1.2,3600,,,
```

#### Supported Record Types

- **A**: IPv4 address records
- **AAAA**: IPv6 address records
- **CNAME**: Canonical name records
- **MX**: Mail exchange records
- **NS**: Name server records
- **PTR**: Pointer records
- **SOA**: Start of authority records
- **SRV**: Service records
- **TXT**: Text records
- **CAA**: Certification Authority Authorization records
- **ALIAS**: Similar to CNAME but can be used at the zone apex (root domain). Resolves at the DNS server level.
- **ANAME**: Similar to ALIAS but specifically for A/AAAA resolution. Automatically resolves to the target domain's A or AAAA records.
- **DNAME**: Delegation name records
- **TLSA**: Transport Layer Security Authentication records
- **SSHFP**: SSH Key Fingerprint records
- **NAPTR**: Naming Authority Pointer records
- **HINFO**: Host information records
- **LOC**: Location records

#### Wildcard Records

Wildcard records are supported using the `*` character. For example, `*.example.com` will match any subdomain of `example.com` that doesn't have an explicit record.

#### Usage Example

```bash
./2dns -csv records.csv
```

When a DNS query is received, 2DNS will:
1. First check if there's a matching record in the CSV file
2. If no match is found, fall back to the IP reflection functionality

### Supported Formats

#### 1. Direct IPv4 Reflection

Format: `<ipv4>.<domain>`

Example:
```
dig @2dns.dev 1.2.3.4.2dns.dev A
```

This will return `1.2.3.4` as an A record.

#### 2. IPv6 Reflection

2DNS supports multiple IPv6 notation formats:

##### Complete Format

Format: `xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx.<domain>`

Example:
```
dig @2dns.dev 2001-0db8-85a3-0000-0000-8a2e-0370-7334.2dns.dev AAAA
```

This will return `2001:0db8:85a3:0000:0000:8a2e:0370:7334` as an AAAA record.

##### Format with Leading Zeros Omitted

Format: `<ipv6-with-omitted-zeros>.<domain>`

Example:
```
dig @2dns.dev 2001-db8-85a3-0-0-8a2e-370-7334.2dns.dev AAAA
```

This will return `2001:0db8:85a3:0000:0000:8a2e:0370:7334` as an AAAA record.

##### Format with 'z' Representing Zero Groups

Format: `<prefix>z<suffix>.<domain>` (where 'z' represents one or more consecutive zero groups)

Example:
```
dig @2dns.dev 2001-db8-85a3-z-8a2e-370-7334.2dns.dev AAAA
```

This will return `2001:0db8:85a3:0000:0000:8a2e:0370:7334` as an AAAA record.

#### 3. Base32 Encoded IPv4

Format: `<base32-encoded-ipv4>.<domain>`

Example:
```
dig @2dns.dev AEBAGBA8.2dns.dev A
```

This will return `1.2.3.4` as an A record (AEBAGBA8 is the Base32 encoding of 1.2.3.4, with '8' replacing the padding character '=').

Note: Base32 encoding is case-insensitive. Both uppercase and lowercase letters are supported, as lowercase letters are automatically converted to uppercase before decoding.

#### 4. Base32 Encoded IPv6

Format: `<base32-encoded-ipv6>.<domain>`

Example:
```
dig @2dns.dev ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS.2dns.dev AAAA
```

This will return `2001:0db8:85a3:0000:0000:8a2e:0370:7334` as an AAAA record (with '8' replacing the padding character '=').

Note: Just like with IPv4, Base32 encoding for IPv6 is also case-insensitive.

#### 5. Dual-Stack (IPv4 + IPv6)

Format: `<base32-encoded-ipv4><base32-encoded-ipv6>.<domain>`

Example for IPv4:
```
dig @2dns.dev AEBAGBA8ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS.2dns.dev A
```

This will return `1.2.3.4` as an A record.

Example for IPv6:
```
dig @2dns.dev AEBAGBA8ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS.2dns.dev AAAA
```

This will return `2001:0db8:85a3:0000:0000:8a2e:0370:7334` as an AAAA record.

Note: Dual-stack encoding is also case-insensitive, allowing for both uppercase and lowercase letters in the Base32 encoded parts.

#### 6. Multi-Record JSON Format

2DNS now supports encoding multiple DNS records in a single domain name using JSON format. This allows you to specify multiple record types (A, AAAA, TXT, MX, etc.) for the same domain.

##### Single-Layer Format

Format: `j<base32-encoded-json>.<domain>`

Example JSON: `{"A":"192.168.1.1","TXT":"verification=abc123","MX":"10 mail.example.com"}`

Usage:
```bash
# Create JSON with multiple records
echo '{"A":"192.168.1.1","TXT":"test","AAAA":"2001:db8::1"}' | base32 | tr -d '=' | tr '=' '8'

# Use the encoded result in a DNS query
dig @2dns.dev j<BASE32_RESULT>.2dns.dev A    # Returns 192.168.1.1
dig @2dns.dev j<BASE32_RESULT>.2dns.dev TXT  # Returns "test"
dig @2dns.dev j<BASE32_RESULT>.2dns.dev AAAA # Returns 2001:db8::1
```

##### Multi-Layer Format (for longer JSON)

For longer JSON that exceeds DNS label limits, use multiple layers:

Format: `j1<part1>.j2<part2>.j3<part3>.<domain>`

Example:
```bash
# For longer JSON data that gets split into multiple parts
dig @2dns.dev j1PART1.j2PART2.j3PART3.2dns.dev A
```

##### Supported Record Types in JSON

The JSON format supports all the same record types as CSV records:

```json
{
  "A": "192.168.1.1",
  "AAAA": "2001:db8::1",
  "TXT": "verification token or any text",
  "MX": "10 mail.example.com",
  "CNAME": "target.example.com",
  "SRV": "10 20 443 target.example.com",
  "NS": "ns1.example.com",
  "CAA": "0 issue letsencrypt.org",
  "TLSA": "3 1 1 abcdef1234567890...",
  "SSHFP": "1 1 abcdef1234567890..."
}
```

##### Format Guidelines

- Use standard JSON syntax with double quotes
- For MX records: "priority target" format
- For SRV records: "priority weight port target" format  
- For CAA records: "flags tag value" format
- For TLSA records: "usage selector matchingtype certificate" format
- For SSHFP records: "algorithm fptype fingerprint" format
- Base32 encoding uses '8' instead of '=' for padding (DNS-safe)
- Both single-layer and multi-layer formats are case-insensitive

##### Benefits

- **Flexibility**: Define multiple record types for one domain
- **Efficiency**: Reduce the number of domain names needed
- **Compatibility**: Works with existing DNS infrastructure
- **Scalability**: Multi-layer support for complex record sets

## Technical Details

The server attempts to start on multiple ports (8053-8058) and network types (udp, tcp, udp6, tcp6) for maximum compatibility. It will use the first available port for each network type.

When processing a DNS query, the server:

1. First checks if there's a matching record in the CSV file (if provided)
2. If no CSV match, checks for multi-record JSON format (j<base32> or j1<part1>.j2<part2>...)
3. If not JSON format, attempts to parse the domain name as a direct IPv4 or IPv6 address
4. If that fails, attempts to parse it as a Base32 encoded IPv4 or IPv6 address
5. If that fails, attempts to parse it as a dual-stack address (containing both IPv4 and IPv6)
6. Returns the appropriate DNS record based on the query type and parsed data

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## GitHub Actions and DockerHub Integration

This project uses GitHub Actions for automated Docker image builds. For detailed setup instructions, see [GITHUB_SETUP.md](GITHUB_SETUP.md).
