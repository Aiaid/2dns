# 2DNS - DNS Reflection Server

2DNS is a versatile DNS reflection server that allows you to encode IP addresses in domain names and have them reflected back in DNS responses. This can be useful for various networking applications, diagnostics, and DNS-based service discovery.

**Live Service:** [2dns.dev](https://2dns.dev)

[中文](README.zh.md)

## Features

- Supports both IPv4 and IPv6 addresses
- Multiple encoding formats:
  - Direct IPv4 reflection
  - IPv6 with various notation formats
  - Base32 encoding for both IPv4 and IPv6 addresses
  - Dual-stack support (both IPv4 and IPv6 in a single domain)
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

#### 4. Base32 Encoded IPv6

Format: `<base32-encoded-ipv6>.<domain>`

Example:
```
dig @2dns.dev ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS.2dns.dev AAAA
```

This will return `2001:0db8:85a3:0000:0000:8a2e:0370:7334` as an AAAA record (with '8' replacing the padding character '=').

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

## Technical Details

The server attempts to start on multiple ports (8053-8058) and network types (udp, tcp, udp6, tcp6) for maximum compatibility. It will use the first available port for each network type.

When processing a DNS query, the server:

1. Attempts to parse the domain name as a direct IPv4 or IPv6 address
2. If that fails, attempts to parse it as a Base32 encoded IPv4 or IPv6 address
3. If that fails, attempts to parse it as a dual-stack address (containing both IPv4 and IPv6)
4. Returns the appropriate DNS record (A for IPv4, AAAA for IPv6) if successful

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

This project uses GitHub Actions for automated Docker image builds. For detailed setup instructions, see [GITHUB_SETUP.en.md](GITHUB_SETUP.en.md).
