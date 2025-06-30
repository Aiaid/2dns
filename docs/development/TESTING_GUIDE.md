# 2DNS Testing Guide

This document covers the testing strategy and test suite for the 2DNS project.

## Overview

The 2DNS project includes comprehensive test coverage for both the Go backend and TypeScript frontend components.

## Go Backend Testing

### Test Structure

The Go tests are organized into the following categories:

#### Core Functionality Tests
- **TestCreateRR**: DNS resource record creation and validation
- **TestRecordStoreLookup**: Record store lookup functionality with wildcards
- **TestIPAddressParsing**: IPv4/IPv6 address parsing and reflection
- **TestDNSRequestHandling**: Complete DNS request processing pipeline

#### Integration Tests
- **TestLoadRecordsFromCSV**: CSV file loading and parsing
- **TestConcurrency**: Concurrent request handling safety
- **TestEdgeCases**: Error conditions and edge cases

#### Performance Tests
- **BenchmarkDNSHandling**: Performance benchmarks for different query types

#### Helper Function Tests
- **TestHelperFunctions**: Utility function validation
- **TestContextHandling**: Context-aware operation testing

### Test Fixtures

The test suite uses a `TestSuite` struct to manage test fixtures:

```go
type TestSuite struct {
    originalRecordStore *RecordStore
    testRecordStore     *RecordStore
}
```

This provides:
- Isolated test environment
- Consistent test data
- Proper setup and teardown

### Mock Components

#### mockResponseWriter
A complete implementation of `dns.ResponseWriter` for testing:
- Captures DNS responses for validation
- Provides configurable network addresses
- Implements all required interface methods

### Running Tests

```bash
# Run all tests
go test -v

# Run specific test
go test -v -run TestCreateRR

# Run with timeout
go test -v -timeout 30s

# Run benchmarks
go test -bench=. -benchmem

# Run with coverage
go test -cover -coverprofile=coverage.out
```

### Test Coverage

The test suite covers:
- ✅ DNS record creation for all supported types
- ✅ Record store operations (exact, wildcard, case-insensitive)
- ✅ IP address parsing (IPv4, IPv6, Base32 encoding)
- ✅ Complete DNS request handling pipeline
- ✅ CSV file loading and validation
- ✅ Error handling and edge cases
- ✅ Concurrent access safety
- ✅ Performance characteristics

### Performance Benchmarks

Typical performance metrics:
```
BenchmarkDNSHandling/CSV_lookup-10         1872747    635.6 ns/op    744 B/op    24 allocs/op
BenchmarkDNSHandling/IPv4_reflection-10    1908925    626.6 ns/op    648 B/op    17 allocs/op
BenchmarkDNSHandling/Wildcard_match-10     2868474    414.2 ns/op    544 B/op    14 allocs/op
```

### Test Data

#### Sample DNS Records
The test suite uses realistic DNS records:
```go
"example.com": {
    {Name: "example.com", Type: "A", Value: "192.168.1.1", TTL: 3600},
    {Name: "example.com", Type: "AAAA", Value: "2001:db8::1", TTL: 3600},
    {Name: "example.com", Type: "TXT", Value: "test record", TTL: 3600},
    // ... more records
}
```

#### Wildcard Records
```go
WildRecords: map[string][]DNSRecord{
    "example.com": {
        {Name: "*.example.com", Type: "A", Value: "192.168.1.2", TTL: 3600},
    },
}
```

## TypeScript Frontend Testing

### Test Framework

The frontend uses Jest with React Testing Library:
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Extended matchers

### Test Categories

#### Component Tests
- Hero section rendering and interactions
- Features showcase functionality
- Form validation and submission
- Theme switching behavior

#### Integration Tests
- Landing page component integration
- Interactive demo functionality
- Encoding/decoding examples

### Running Frontend Tests

```bash
cd web

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test -- hero.test.tsx
```

### Test Configuration

#### Jest Configuration (`jest.config.js`)
```javascript
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // ... more configuration
}
```

#### Setup File (`jest.setup.js`)
```javascript
import '@testing-library/jest-dom'
// Global test setup
```

## Continuous Integration

### GitHub Actions
The project includes automated testing in CI:
```yaml
- name: Run Go tests
  run: go test -v ./...
  
- name: Run frontend tests  
  run: |
    cd web
    pnpm test
```

### Pre-commit Hooks
Recommended pre-commit hooks:
- Run Go tests
- Run frontend tests
- Check code formatting
- Validate documentation

## Testing Best Practices

### Go Testing Guidelines

1. **Use Table-Driven Tests**: For testing multiple scenarios
```go
tests := []struct {
    name     string
    input    string
    expected string
}{
    {"valid input", "test", "expected"},
    // ... more test cases
}
```

2. **Test Setup and Teardown**: Use proper fixture management
```go
suite := setupTestSuite()
defer suite.teardown()
```

3. **Validate All Outputs**: Check return values, error conditions, and side effects

4. **Use Descriptive Test Names**: Clear indication of what is being tested

### Frontend Testing Guidelines

1. **Test User Interactions**: Focus on behavior, not implementation
2. **Use Semantic Queries**: Query by role, label, or text content
3. **Test Accessibility**: Ensure components work with screen readers
4. **Mock External Dependencies**: Isolate component logic

## Test Maintenance

### Adding New Tests

When adding new functionality:
1. Write tests first (TDD approach)
2. Ensure good test coverage
3. Include both positive and negative test cases
4. Add performance tests for critical paths

### Updating Existing Tests

When modifying code:
1. Update tests to match new behavior
2. Ensure backward compatibility where possible
3. Update documentation if test patterns change

### Test Data Management

- Use realistic but anonymized test data
- Keep test data small and focused
- Document any external dependencies
- Use factories or builders for complex test objects

## Debugging Tests

### Go Test Debugging

```bash
# Verbose output with logs
go test -v -args -logtostderr

# Run single test with debugging
go test -v -run TestSpecificFunction

# Race condition detection
go test -race
```

### Frontend Test Debugging

```bash
# Debug mode with browser
pnpm test -- --watchAll=false --detectOpenHandles

# Verbose output
pnpm test -- --verbose

# Update snapshots
pnpm test -- --updateSnapshot
```

## Performance Testing

### Load Testing
For production readiness, consider:
- DNS query load testing with tools like `dig` and `nslookup`
- Concurrent user simulation
- Memory usage profiling
- Response time measurements

### Stress Testing
- High-frequency query patterns
- Large CSV file loading
- Memory leak detection
- Error rate under load

## Security Testing

### Input Validation
- Malformed DNS queries
- Oversized requests
- Invalid CSV data
- Injection attempts

### Access Control
- Rate limiting functionality
- Resource exhaustion protection
- Error information disclosure