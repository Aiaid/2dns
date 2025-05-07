# Docker Setup for 2DNS

This directory contains Docker configuration files for running 2DNS in a container.

## Files

- `Dockerfile`: Multi-stage build file for creating a minimal 2DNS container
- `docker-compose.yml`: Docker Compose configuration for easy deployment

## Building and Running with Docker

### Using Docker Directly

To build and run the 2DNS container directly with Docker:

```bash
# Build the image
docker build -t 2dns -f docker/Dockerfile .

# Run the container with default settings
docker run -d -p 53:53/udp -p 53:53/tcp --name 2dns 2dns

# Run with custom settings
docker run -d \
  -p 8053:8053/udp -p 8053:8053/tcp \
  -e PORT=8053 \
  -e MODE=dev \
  -e TTL=120 \
  -e VERBOSE=true \
  -v $(pwd)/src/records.csv:/data/records.csv \
  --name 2dns 2dns
```

### Using Docker Compose

For easier management, you can use Docker Compose:

```bash
# Navigate to the docker directory
cd docker

# Create a records directory and copy your CSV file
mkdir -p records
cp ../src/records.csv records/

# Build and start the container with default settings
docker-compose up -d

# Or with custom settings
PORT=8053 MODE=dev TTL=120 VERBOSE=true docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

## Configuration

The container supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | DNS server port | 53 |
| MODE | Running mode (dev/production) | production |
| CSV_PATH | Path to CSV file inside container (optional) | Empty (no CSV file) |
| TTL | Time to live for DNS records in seconds | 60 |
| VERBOSE | Enable verbose logging (true/false) | false |

### Running Modes

- **production**: Uses standard TTL of 60 seconds and concise logging
- **dev**: Uses shorter TTL of 30 seconds and verbose logging

### Custom CSV Files

The CSV file is optional. If you don't provide one, the server will run in IP reflection mode only.

To use your own DNS records:

1. Create a CSV file with your records (see example in `src/records.csv`)
2. Mount this file into the container at `/data/records.csv`

Example CSV format:
```
name,type,value,ttl,priority,weight,port
example.com,A,192.168.1.1,3600,,,
www.example.com,CNAME,example.com,3600,,,
```

## Testing

After starting the container, you can test it with:

```bash
# Test IPv4 reflection (using default port 53)
dig @localhost 1.2.3.4.2dns.dev A

# Test with custom port
dig @localhost -p 8053 1.2.3.4.2dns.dev A

# Test IPv6 reflection
dig @localhost 2001-0db8-85a3-0000-0000-8a2e-0370-7334.2dns.dev AAAA

# Test with custom records (if you've mounted a CSV file)
dig @localhost example.com A
```

## Notes

- The container needs to be run with appropriate permissions to bind to port 53
- On some systems, you may need to stop any local DNS services that are using port 53
- When using a custom port, make sure to update both the container port mapping and the PORT environment variable
