# Dockerfile for 2DNS BIND Plugin
# 
# This creates a container with BIND and the 2DNS plugin pre-installed

FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install required packages
RUN apt-get update && apt-get install -y \
    bind9 \
    bind9-dev \
    bind9-dnsutils \
    libjson-c-dev \
    gcc \
    make \
    pkg-config \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /usr/lib/bind /var/log/bind /var/cache/bind /app/src

# Set working directory
WORKDIR /app

# Copy plugin source code
COPY src/ /app/src/
COPY Makefile /app/
COPY README.md /app/

# Build and install the plugin
RUN make -C /app && \
    cp /app/2dns-plugin.so /usr/lib/bind/ && \
    chmod 755 /usr/lib/bind/2dns-plugin.so

# Copy configuration files
COPY examples/named.conf.example /etc/bind/named.conf.2dns
COPY examples/named.conf.test /etc/bind/named.conf.test

# Set proper permissions
RUN chown -R bind:bind /var/log/bind /var/cache/bind && \
    chmod 755 /var/log/bind /var/cache/bind

# Create a default configuration that uses the plugin
RUN cat > /etc/bind/named.conf << 'EOF'
options {
    directory "/var/cache/bind";
    listen-on { any; };
    listen-on-v6 { any; };
    allow-query { any; };
    recursion no;
    querylog yes;
};

logging {
    channel default_file {
        file "/var/log/bind/default.log";
        severity info;
        print-time yes;
    };
    category default { default_file; };
    category queries { default_file; };
    category dlz { default_file; };
};

dlz "2dns_plugin" {
    database "dlopen /usr/lib/bind/2dns-plugin.so
        ttl=300
        log_level=2
        enable_ip_reflection=true
        enable_json_records=true
        enable_dual_stack=true
        zone=2dns.dev";
};
EOF

# Health check script
RUN cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
dig @127.0.0.1 +short +time=5 +tries=1 192.168.1.1.2dns.dev A > /dev/null 2>&1
exit $?
EOF

RUN chmod +x /usr/local/bin/health-check.sh

# Expose DNS ports
EXPOSE 53/udp 53/tcp 8053/tcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Switch to bind user for security
USER bind

# Start BIND
CMD ["named", "-c", "/etc/bind/named.conf", "-f", "-g"]