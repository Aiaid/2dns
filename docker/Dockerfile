# Build stage
FROM golang:1.24-alpine AS builder

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

WORKDIR /root/

# Copy the binary from the build stage
COPY --from=builder /app/2dns .

# Expose DNS ports
EXPOSE 53/udp 53/tcp

# Run in production mode
ENTRYPOINT ["./2dns", "-mode", "production"]
