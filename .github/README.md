# GitHub Actions for DockerHub Automated Builds

This directory contains GitHub Actions workflow configurations that automate the building and pushing of Docker images to DockerHub.

## Setup Instructions

To enable automated builds, you need to add your DockerHub credentials as secrets in your GitHub repository:

1. Go to your GitHub repository: https://github.com/Aiaid/2dns
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click on "New repository secret"
5. Add the following secrets:

   - Name: `DOCKERHUB_USERNAME`
   - Value: Your DockerHub username

   - Name: `DOCKERHUB_TOKEN`
   - Value: Your DockerHub access token (do not include the actual token in documentation)

## Workflow Details

The workflow in `docker-build.yml` will:

- Trigger on pushes to the `main` branch and any tags starting with `v` (e.g., `v1.0.0`)
- Build a Docker image using the Dockerfile in the `docker` directory
- Push the image to DockerHub with appropriate tags:
  - For pushes to `main`: Tagged as `latest`
  - For tags (e.g., `v1.0.0`): Tagged as `1.0.0`, `1.0`, and `1`
  - For all builds: Also tagged with the commit SHA

## Testing

After setting up the secrets, you can test the workflow by:

1. Making a commit and pushing to the `main` branch
2. Creating and pushing a new tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

You should see the workflow run in the "Actions" tab of your GitHub repository, and the resulting images should appear in your DockerHub repository.
