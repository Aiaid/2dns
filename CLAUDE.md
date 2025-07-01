# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

2DNS is a DNS reflection server with two main components:

### Go Backend (`src/`)
- **Core DNS Server** (`2dns.go`): Handles DNS queries using the `github.com/miekg/dns` library
- **Multi-format Support**: Processes IPv4/IPv6 addresses in multiple encoding formats (direct, Base32, dual-stack)
- **JSON Multi-Record Support**: Parses Base32-encoded JSON for multiple DNS record types in single domains
- **CSV Record Store**: Loads and serves traditional DNS records from CSV files with wildcard support
- **Concurrent Processing**: Thread-safe record storage and DNS request handling

### Next.js Frontend (`web/`)
- **Interactive Demo**: Real-time DNS query generation and DOH (DNS over HTTPS) testing
- **Multi-language Support**: English/Chinese with dictionary-based i18n
- **Component Architecture**: Modular React components with shadcn/ui design system
- **Static Export**: Builds to static files for GitHub Pages deployment

## Development Commands

### Go Backend
```bash
cd src

# Build and run
go build -o 2dns 2dns.go
./2dns

# Run with CSV records
./2dns -csv records.csv

# Development mode (ports 8053-8058)
./2dns -mode dev

# Production mode (port 53)
./2dns -mode production

# Run tests
go test -v
go test -cover -coverprofile=coverage.out

# Run specific test
go test -v -run TestMultiRecord

# Benchmarks
go test -bench=. -benchmem
```

### Web Frontend
```bash
cd web

# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
pnpm test:watch

# Lint
pnpm lint
```

### Docker
```bash
cd docker
docker-compose up -d

# Or use pre-built image
docker run -p 53:53/udp -p 53:53/tcp aiaid/2dns
```

## Key Technical Concepts

### DNS Processing Pipeline
1. **CSV Lookup**: Checks loaded records first (exact match, then wildcard)
2. **JSON Multi-Record**: Parses `j<base32>` or `j1<part1>.j2<part2>...` formats
3. **IP Reflection**: Direct IPv4/IPv6 or Base32-encoded addresses
4. **Dual-Stack**: Combined IPv4+IPv6 Base32 encoding

### Multi-Record JSON Format
- **Encoding**: JSON → Base32 → DNS labels with 'j' prefix
- **Single Layer**: `j<base32>.2dns.dev` (max 63 chars per label)
- **Multi Layer**: `j1<part1>.j2<part2>.j3<part3>.2dns.dev` (for longer JSON)
- **Record Types**: Supports A, AAAA, TXT, MX, SRV, CNAME, DNAME, TLSA, SSHFP, NAPTR, HINFO, LOC

### Base32 Encoding Rules
- Standard Base32 alphabet (RFC 4648)
- Replaces '=' padding with '8' for DNS compatibility
- Case-insensitive input processing
- Automatic uppercase conversion before decoding

## Testing Strategy

### Go Tests (`2dns_test.go`)
- **TestMultiRecord**: JSON parsing and domain generation
- **TestCreateRR**: DNS record creation for all types
- **TestDNSRequestHandling**: Complete request pipeline
- **TestRecordStoreLookup**: CSV and wildcard record matching
- **TestIPAddressParsing**: All encoding format validation

### Frontend Tests (`web/components/__tests__/`)
- Component rendering and interaction testing
- Form validation and state management
- Accessibility and responsive design
- DOH query functionality

## Common Development Patterns

### Adding New DNS Record Types
1. Add type to `isValidRecordType()` function
2. Implement parsing logic in `createRR()` function
3. Add test cases in `TestCreateRR`
4. Update documentation in README.md

### Adding New Encoding Formats
1. Implement parsing logic in `handleDNSRequest()`
2. Add format to processing pipeline order
3. Create comprehensive test cases
4. Update web interface examples if needed

### Modifying Web Interface
- Use existing component patterns from `components/ui/`
- Follow dictionary structure for i18n in `app/[lang]/dictionaries/`
- Test components with React Testing Library
- Ensure responsive design with Tailwind CSS classes

## File Organization

### Go Source Structure
- `2dns.go`: Main server implementation with all core logic
- `2dns_test.go`: Comprehensive test suite with benchmarks
- `*.csv`: DNS record data files for testing and production

### Web Structure
- `app/[lang]/`: Language-specific routes and dictionaries
- `components/`: Reusable React components with tests
- `components/ui/`: shadcn/ui component library
- `public/`: Static assets including SVG logos

## Performance Considerations

### Go Backend
- Concurrent DNS request handling with goroutines
- Read-write mutex for thread-safe record store access
- Efficient string parsing with minimal allocations
- Benchmark targets: ~600ns/op for typical queries

### Web Frontend
- Static site generation for fast loading
- Component lazy loading where appropriate
- Optimized images and CSS with Next.js built-ins
- Progressive enhancement for accessibility

## Deployment Architecture

### Development
- Go server on ports 8053-8058
- Next.js dev server on port 3000
- Local CSV file loading

### Production
- Go server on port 53 (DNS standard)
- Static web files served from GitHub Pages
- Public service at 2dns.dev

## Required Environment
- **Go**: 1.24.2+ with github.com/miekg/dns dependency
- **Node.js**: 22+ with pnpm 10.2.0+ package manager
- **Testing**: Jest for frontend, Go testing package for backend