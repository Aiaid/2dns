# Test Suite Makefile for 2DNS BIND Plugin
# 
# Builds and runs comprehensive tests for all plugin modules

CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g -O0 -DDEBUG
INCLUDES = -I../src -I/usr/include/bind9 -I/usr/include/isc
LIBS = -ljson-c -lcrypto

# Source directories
SRC_DIR = ../src
TEST_DIR = .

# Plugin source files (without main plugin file)
PLUGIN_SRCS = $(SRC_DIR)/base32.c $(SRC_DIR)/ip-reflection.c $(SRC_DIR)/json-parser.c

# Test source files
TEST_SRCS = test_base32.c test_ip_reflection.c test_json_parser.c

# Test executables
TESTS = test_base32 test_ip_reflection test_json_parser

# Main targets
.PHONY: all clean test run-tests help

all: $(TESTS)

# Individual test builds
test_base32: test_base32.c $(SRC_DIR)/base32.c
	@echo "Building Base32 tests..."
	$(CC) $(CFLAGS) $(INCLUDES) -o $@ $^ $(LIBS)

test_ip_reflection: test_ip_reflection.c $(SRC_DIR)/ip-reflection.c $(SRC_DIR)/base32.c
	@echo "Building IP Reflection tests..."
	$(CC) $(CFLAGS) $(INCLUDES) -o $@ $^ $(LIBS)

test_json_parser: test_json_parser.c $(SRC_DIR)/json-parser.c $(SRC_DIR)/base32.c
	@echo "Building JSON Parser tests..."
	$(CC) $(CFLAGS) $(INCLUDES) -o $@ $^ $(LIBS)

# Run all tests
test: $(TESTS)
	@echo "Running all tests..."
	@echo "=================="
	@for test in $(TESTS); do \
		echo "\nRunning $$test:"; \
		echo "----------------------------------------"; \
		./$$test || exit 1; \
		echo "----------------------------------------"; \
	done
	@echo "\nAll tests completed successfully!"

# Run tests with verbose output
test-verbose: $(TESTS)
	@echo "Running all tests (verbose)..."
	@echo "=============================="
	@for test in $(TESTS); do \
		echo "\nRunning $$test:"; \
		echo "========================================"; \
		./$$test -v || exit 1; \
		echo "========================================"; \
	done
	@echo "\nAll tests completed successfully!"

# Run individual test suites
test-base32: test_base32
	@echo "Running Base32 tests..."
	./test_base32

test-ip: test_ip_reflection
	@echo "Running IP Reflection tests..."
	./test_ip_reflection

test-json: test_json_parser
	@echo "Running JSON Parser tests..."
	./test_json_parser

# Memory leak testing with valgrind
memcheck: $(TESTS)
	@echo "Running memory leak checks..."
	@for test in $(TESTS); do \
		echo "\nMemory checking $$test:"; \
		valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes ./$$test; \
	done

# Code coverage (if gcov is available)
coverage: CFLAGS += --coverage
coverage: clean $(TESTS)
	@echo "Running tests with coverage..."
	@for test in $(TESTS); do \
		./$$test; \
	done
	@echo "Generating coverage report..."
	@gcov $(PLUGIN_SRCS)
	@echo "Coverage files generated: *.gcov"

# Performance testing
perf: $(TESTS)
	@echo "Running performance tests..."
	@for test in $(TESTS); do \
		echo "Performance testing $$test:"; \
		time ./$$test; \
	done

# Static analysis with cppcheck (if available)
static-analysis:
	@echo "Running static analysis..."
	@if command -v cppcheck >/dev/null 2>&1; then \
		cppcheck --enable=all --std=c99 $(TEST_SRCS) $(PLUGIN_SRCS); \
	else \
		echo "cppcheck not found, skipping static analysis"; \
	fi

# Integration test with actual BIND (requires BIND installation)
integration-test: all
	@echo "Running integration tests..."
	@if [ -f ../examples/named.conf.test ]; then \
		echo "Starting test BIND instance..."; \
		sudo named -c ../examples/named.conf.test -f -g & \
		NAMED_PID=$$!; \
		sleep 2; \
		echo "Running DNS queries..."; \
		dig @127.0.0.1 1.2.3.4.2dns.dev A; \
		dig @127.0.0.1 jNBSWY3DPEB2CA4DVMQQGI3DNNSXS8.2dns.dev A; \
		echo "Stopping test BIND instance..."; \
		sudo kill $$NAMED_PID; \
	else \
		echo "Integration test config not found, skipping"; \
	fi

# Benchmark tests
benchmark: $(TESTS)
	@echo "Running benchmark tests..."
	@echo "Base32 encoding/decoding benchmark:"
	@./test_base32 --benchmark 2>/dev/null || echo "Benchmark mode not implemented"
	@echo "IP parsing benchmark:"
	@./test_ip_reflection --benchmark 2>/dev/null || echo "Benchmark mode not implemented"
	@echo "JSON parsing benchmark:"
	@./test_json_parser --benchmark 2>/dev/null || echo "Benchmark mode not implemented"

# Clean build artifacts
clean:
	@echo "Cleaning test artifacts..."
	rm -f $(TESTS)
	rm -f *.o
	rm -f *.gcov *.gcda *.gcno
	rm -f core core.*
	rm -f vgcore.*

# Help target
help:
	@echo "Available targets:"
	@echo "  all              - Build all tests"
	@echo "  test             - Run all tests"
	@echo "  test-verbose     - Run all tests with verbose output"
	@echo "  test-base32      - Run only Base32 tests"
	@echo "  test-ip          - Run only IP Reflection tests"
	@echo "  test-json        - Run only JSON Parser tests"
	@echo "  memcheck         - Run tests with Valgrind memory checking"
	@echo "  coverage         - Run tests with code coverage analysis"
	@echo "  perf             - Run performance tests"
	@echo "  static-analysis  - Run static code analysis"
	@echo "  integration-test - Run integration tests with BIND"
	@echo "  benchmark        - Run benchmark tests"
	@echo "  clean            - Clean build artifacts"
	@echo "  help             - Show this help message"

# Dependencies
test_base32.o: test_base32.c $(SRC_DIR)/base32.h $(SRC_DIR)/2dns-plugin.h
test_ip_reflection.o: test_ip_reflection.c $(SRC_DIR)/ip-reflection.h $(SRC_DIR)/base32.h $(SRC_DIR)/2dns-plugin.h
test_json_parser.o: test_json_parser.c $(SRC_DIR)/json-parser.h $(SRC_DIR)/base32.h $(SRC_DIR)/2dns-plugin.h