# Build stage
FROM golang:1.24.2-alpine AS builder

# Set working directory
WORKDIR /app

# Copy Go module files
COPY src/go.mod src/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY src/*.go ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o 2dns .

# Runtime stage
FROM alpine:latest

# Install CA certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Create directory for user-provided CSV files
RUN mkdir -p /data

WORKDIR /root/

# Copy the binary from the build stage
COPY --from=builder /app/2dns .

# Set environment variables with defaults
ENV PORT=53 \
    MODE=production \
    CSV_PATH=/data/records.csv \
    TTL=60 \
    VERBOSE=false

# Expose DNS ports (default, can be overridden)
EXPOSE ${PORT}/udp ${PORT}/tcp

# Run with environment variables
ENTRYPOINT ./2dns -mode ${MODE} -port ${PORT} ${CSV_PATH:+-csv ${CSV_PATH}} ${TTL:+-ttl ${TTL}} ${VERBOSE:+-verbose=${VERBOSE}}
