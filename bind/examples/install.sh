#!/bin/bash
# 2DNS BIND Plugin Installation Script
# 
# This script builds and installs the 2DNS BIND plugin and sets up
# the necessary configuration for BIND to use it.

set -e  # Exit on any error

# Configuration
PLUGIN_NAME="2dns-plugin"
PLUGIN_SO="${PLUGIN_NAME}.so"
BIND_LIB_DIR="/usr/lib/bind"
BIND_CONFIG_DIR="/etc/bind"
BUILD_DIR="/tmp/2dns-build"
SOURCE_DIR="$(dirname "$(dirname "$(realpath "$0")")")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    print_header "Checking System Requirements"
    
    # Check for required packages
    local missing_packages=()
    
    if ! command -v gcc &> /dev/null; then
        missing_packages+=("gcc")
    fi
    
    if ! command -v make &> /dev/null; then
        missing_packages+=("make")
    fi
    
    if ! command -v pkg-config &> /dev/null; then
        missing_packages+=("pkg-config")
    fi
    
    # Check for BIND development headers
    if ! [ -d "/usr/include/bind9" ] && ! [ -d "/usr/include/isc" ]; then
        missing_packages+=("bind9-dev" "or" "bind-devel")
    fi
    
    # Check for json-c development headers
    if ! pkg-config --exists json-c; then
        missing_packages+=("libjson-c-dev" "or" "json-c-devel")
    fi
    
    if [ ${#missing_packages[@]} -gt 0 ]; then
        print_error "Missing required packages: ${missing_packages[*]}"
        print_info "Please install them using your package manager:"
        print_info "  Ubuntu/Debian: apt-get install gcc make pkg-config bind9-dev libjson-c-dev"
        print_info "  RHEL/CentOS: yum install gcc make pkgconfig bind-devel json-c-devel"
        print_info "  Alpine: apk add gcc make pkgconf bind-dev json-c-dev"
        exit 1
    fi
    
    print_success "All required packages are installed"
}

# Check BIND installation
check_bind() {
    print_header "Checking BIND Installation"
    
    if ! command -v named &> /dev/null; then
        print_error "BIND (named) is not installed"
        exit 1
    fi
    
    # Get BIND version
    local bind_version=$(named -V 2>&1 | head -1 | awk '{print $2}')
    print_success "BIND version: $bind_version"
    
    # Check if BIND supports DLZ
    if ! named -V 2>&1 | grep -q "DLZ"; then
        print_warning "BIND may not have DLZ support compiled in"
        print_info "DLZ support is required for this plugin to work"
    else
        print_success "BIND has DLZ support"
    fi
    
    # Check BIND directories
    if [ ! -d "$BIND_LIB_DIR" ]; then
        print_warning "BIND library directory $BIND_LIB_DIR does not exist"
        print_info "Creating directory..."
        mkdir -p "$BIND_LIB_DIR"
    fi
    
    if [ ! -d "$BIND_CONFIG_DIR" ]; then
        print_warning "BIND configuration directory $BIND_CONFIG_DIR does not exist"
        print_info "Creating directory..."
        mkdir -p "$BIND_CONFIG_DIR"
    fi
}

# Build the plugin
build_plugin() {
    print_header "Building 2DNS Plugin"
    
    # Create build directory
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    
    # Copy source files
    print_info "Copying source files..."
    cp -r "$SOURCE_DIR"/* "$BUILD_DIR/"
    cd "$BUILD_DIR"
    
    # Build the plugin
    print_info "Compiling plugin..."
    if make -C "$BUILD_DIR" all; then
        print_success "Plugin compiled successfully"
    else
        print_error "Plugin compilation failed"
        exit 1
    fi
    
    # Check if plugin library was created
    if [ ! -f "$BUILD_DIR/$PLUGIN_SO" ]; then
        print_error "Plugin library $PLUGIN_SO not found after build"
        exit 1
    fi
    
    print_success "Plugin build completed"
}

# Install the plugin
install_plugin() {
    print_header "Installing 2DNS Plugin"
    
    # Copy plugin to BIND library directory
    print_info "Installing plugin library to $BIND_LIB_DIR..."
    cp "$BUILD_DIR/$PLUGIN_SO" "$BIND_LIB_DIR/"
    chown root:root "$BIND_LIB_DIR/$PLUGIN_SO"
    chmod 755 "$BIND_LIB_DIR/$PLUGIN_SO"
    
    print_success "Plugin installed to $BIND_LIB_DIR/$PLUGIN_SO"
    
    # Install example configurations
    if [ -d "$BUILD_DIR/examples" ]; then
        print_info "Installing example configurations..."
        cp "$BUILD_DIR/examples/named.conf.example" "$BIND_CONFIG_DIR/named.conf.2dns-example"
        cp "$BUILD_DIR/examples/named.conf.test" "$BIND_CONFIG_DIR/named.conf.2dns-test"
        print_success "Example configurations installed"
    fi
}

# Test the installation
test_installation() {
    print_header "Testing Installation"
    
    # Check if plugin library loads
    print_info "Testing plugin library loading..."
    
    # Create a minimal test configuration
    local test_config="/tmp/named.conf.test"
    cat > "$test_config" << EOF
options {
    directory "/tmp";
    pid-file "/tmp/named.pid";
    listen-on port 5354 { 127.0.0.1; };
    recursion no;
};

dlz "2dns_test" {
    database "dlopen $BIND_LIB_DIR/$PLUGIN_SO ttl=60 zone=test.example";
};
EOF
    
    # Test configuration syntax
    if named-checkconf "$test_config"; then
        print_success "Configuration syntax is valid"
    else
        print_error "Configuration syntax test failed"
        print_warning "The plugin may still work, but check your configuration"
    fi
    
    # Cleanup test file
    rm -f "$test_config"
    
    print_success "Installation test completed"
}

# Set up systemd service (if applicable)
setup_service() {
    print_header "Setting up Service"
    
    if command -v systemctl &> /dev/null; then
        print_info "Reloading systemd daemon..."
        systemctl daemon-reload
        
        if systemctl is-enabled bind9 &> /dev/null; then
            print_info "BIND service is enabled (bind9)"
        elif systemctl is-enabled named &> /dev/null; then
            print_info "BIND service is enabled (named)"
        else
            print_warning "BIND service does not appear to be enabled"
            print_info "You may need to enable it manually:"
            print_info "  systemctl enable bind9  # or 'named' on some systems"
        fi
        
        print_success "Service setup completed"
    else
        print_info "systemd not detected, skipping service setup"
    fi
}

# Create log directories
setup_logging() {
    print_header "Setting up Logging"
    
    local log_dir="/var/log/bind"
    
    if [ ! -d "$log_dir" ]; then
        print_info "Creating log directory $log_dir..."
        mkdir -p "$log_dir"
    fi
    
    # Set appropriate permissions
    if id "bind" &> /dev/null; then
        chown bind:bind "$log_dir"
        print_success "Log directory permissions set for user 'bind'"
    elif id "named" &> /dev/null; then
        chown named:named "$log_dir"
        print_success "Log directory permissions set for user 'named'"
    else
        print_warning "Could not find bind/named user for log directory permissions"
    fi
    
    chmod 755 "$log_dir"
    print_success "Log directory setup completed"
}

# Display post-installation instructions
show_instructions() {
    print_header "Installation Complete!"
    
    echo -e "${GREEN}"
    echo "The 2DNS BIND plugin has been successfully installed."
    echo -e "${NC}"
    
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Edit your BIND configuration to include the 2DNS DLZ plugin"
    echo "   Example configurations are available at:"
    echo "   - $BIND_CONFIG_DIR/named.conf.2dns-example (full configuration)"
    echo "   - $BIND_CONFIG_DIR/named.conf.2dns-test (minimal test configuration)"
    echo ""
    echo "2. Add the DLZ configuration to your named.conf:"
    echo '   dlz "2dns_plugin" {'
    echo '       database "dlopen /usr/lib/bind/2dns-plugin.so'
    echo '           ttl=300'
    echo '           enable_ip_reflection=true'
    echo '           enable_json_records=true'
    echo '           zone=2dns.dev";'
    echo '   };'
    echo ""
    echo "3. Test your configuration:"
    echo "   named-checkconf /etc/bind/named.conf"
    echo ""
    echo "4. Restart BIND:"
    echo "   systemctl restart bind9   # or 'named' on some systems"
    echo ""
    echo "5. Test the plugin:"
    echo "   dig @127.0.0.1 192.168.1.1.2dns.dev A"
    echo ""
    echo -e "${BLUE}For more information, see the README.md file.${NC}"
}

# Main installation process
main() {
    print_header "2DNS BIND Plugin Installation"
    
    check_root
    check_requirements
    check_bind
    build_plugin
    install_plugin
    test_installation
    setup_service
    setup_logging
    
    # Cleanup build directory
    rm -rf "$BUILD_DIR"
    
    show_instructions
}

# Handle script arguments
case "${1:-}" in
    "--help" | "-h")
        echo "2DNS BIND Plugin Installation Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --uninstall    Uninstall the plugin"
        echo "  --test-only    Only run tests without installing"
        echo ""
        echo "This script must be run as root."
        exit 0
        ;;
    "--uninstall")
        print_header "Uninstalling 2DNS Plugin"
        rm -f "$BIND_LIB_DIR/$PLUGIN_SO"
        rm -f "$BIND_CONFIG_DIR/named.conf.2dns-example"
        rm -f "$BIND_CONFIG_DIR/named.conf.2dns-test"
        print_success "Plugin uninstalled"
        exit 0
        ;;
    "--test-only")
        check_root
        check_requirements
        check_bind
        test_installation
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac