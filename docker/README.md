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

# Run the container
docker run -d -p 53:53/udp -p 53:53/tcp --name 2dns 2dns
```

### Using Docker Compose

For easier management, you can use Docker Compose:

```bash
# Navigate to the docker directory
cd docker

# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

## Configuration

The container runs 2DNS in production mode by default, which uses:

- Port 53 for both UDP and TCP
- Standard TTL of 60 seconds
- Concise logging

## Testing

After starting the container, you can test it with:

```bash
# Test IPv4 reflection
dig @localhost 1.2.3.4.2dns.dev A

# Test IPv6 reflection
dig @localhost 2001-0db8-85a3-0000-0000-8a2e-0370-7334.2dns.dev AAAA
```

## Notes

- The container needs to be run with appropriate permissions to bind to port 53
- On some systems, you may need to stop any local DNS services that are using port 53
