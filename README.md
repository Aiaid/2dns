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

```bash
# Clone the repository
git clone https://github.com/yourusername/2dns.git
cd 2dns/src

# Build the binary
go build -o 2dns 2dns.go

# Run the server
./2dns
```

## Usage

The public service at [2dns.dev](https://2dns.dev) listens on standard DNS ports (53/UDP and 53/TCP).

If you're self-hosting, the server listens on ports 8053-8058 for DNS queries and responds with the IP address encoded in the domain name.

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
