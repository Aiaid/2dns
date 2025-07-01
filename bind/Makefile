# 2DNS BIND Plugin Makefile

# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -O2 -fPIC -std=c99
LDFLAGS = -shared -ljson-c

# BIND include directory (adjust based on system)
BIND_INCLUDES = -I/usr/include/bind9 -I/usr/include/bind9/dns -I/usr/include/bind9/isc

# Installation paths
PLUGIN_DIR = /usr/lib/bind
CONFIG_DIR = /etc/bind

# Source files
SOURCES = src/2dns-plugin.c src/ip-reflection.c src/json-parser.c src/base32.c src/dlz-interface.c
HEADERS = src/2dns-plugin.h src/ip-reflection.h src/json-parser.h src/base32.h
OBJECTS = $(SOURCES:.c=.o)

# Test files
TEST_SOURCES = tests/test-runner.c tests/test-ip-reflection.c tests/test-json-parser.c tests/test-base32.c
TEST_OBJECTS = $(TEST_SOURCES:.c=.o)

# Output
PLUGIN = 2dns-plugin.so
TEST_RUNNER = test-runner

.PHONY: all clean install uninstall test check-deps

all: check-deps $(PLUGIN)

# Build plugin
$(PLUGIN): $(OBJECTS)
	$(CC) $(LDFLAGS) -o $@ $^

# Compile source files
%.o: %.c $(HEADERS)
	$(CC) $(CFLAGS) $(BIND_INCLUDES) -c $< -o $@

# Build test suite
test: $(TEST_RUNNER)

$(TEST_RUNNER): $(TEST_OBJECTS) $(filter-out src/2dns-plugin.o, $(OBJECTS))
	$(CC) -o $@ $^ -ljson-c

# Check dependencies
check-deps:
	@echo "Checking dependencies..."
	@pkg-config --exists json-c || (echo "Error: json-c not found. Install with: apt-get install libjson-c-dev" && exit 1)
	@test -f /usr/include/bind9/dns/dlz.h || (echo "Error: BIND development headers not found. Install with: apt-get install bind9-dev" && exit 1)
	@echo "Dependencies OK"

# Install plugin
install: $(PLUGIN)
	@echo "Installing 2DNS BIND plugin..."
	sudo mkdir -p $(PLUGIN_DIR)
	sudo cp $(PLUGIN) $(PLUGIN_DIR)/
	sudo chmod 755 $(PLUGIN_DIR)/$(PLUGIN)
	@echo "Plugin installed to $(PLUGIN_DIR)/$(PLUGIN)"
	@echo ""
	@echo "Add this to your named.conf:"
	@echo "dlz \"2dns-reflection\" {"
	@echo "    database \"filesystem $(PLUGIN_DIR)/$(PLUGIN) dlz_create\";"
	@echo "};"

# Uninstall plugin
uninstall:
	sudo rm -f $(PLUGIN_DIR)/$(PLUGIN)
	@echo "Plugin uninstalled"

# Clean build files
clean:
	rm -f $(OBJECTS) $(TEST_OBJECTS) $(PLUGIN) $(TEST_RUNNER)
	rm -f src/*.o tests/*.o

# Run tests
check: test
	./$(TEST_RUNNER)

# Development targets
debug: CFLAGS += -g -DDEBUG
debug: $(PLUGIN)

# Create directories
src tests:
	mkdir -p $@

# Help
help:
	@echo "2DNS BIND Plugin Build System"
	@echo ""
	@echo "Targets:"
	@echo "  all        - Build the plugin (default)"
	@echo "  test       - Build test suite"
	@echo "  check      - Run tests"
	@echo "  install    - Install plugin to system"
	@echo "  uninstall  - Remove plugin from system"
	@echo "  clean      - Remove build files"
	@echo "  debug      - Build with debug symbols"
	@echo "  help       - Show this help"
	@echo ""
	@echo "Dependencies:"
	@echo "  - BIND 9.11+ development headers"
	@echo "  - json-c library"
	@echo "  - GCC compiler"