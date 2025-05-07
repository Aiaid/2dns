# GitHub and DockerHub Automated Build Setup Guide

This document provides detailed steps on how to set up GitHub Actions with DockerHub integration for automated builds.

## Completed Setup

The following files have been created or modified to support automated builds:

1. `.github/workflows/docker-build.yml` - GitHub Actions workflow configuration
2. `README.md` and `README.zh.md` - Updated installation instructions including Docker options

## Setting Up GitHub Repository Secrets

For the automated build workflow to push images to DockerHub, you need to add your DockerHub credentials as secrets in your GitHub repository:

1. Go to your GitHub repository: https://github.com/Aiaid/2dns
2. Click on the "Settings" tab
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click on "New repository secret"
5. Add the following secrets:

   - Name: `DOCKERHUB_USERNAME`
   - Value: Your DockerHub username

   Click "Add secret"

6. Click on "New repository secret" again
   - Name: `DOCKERHUB_TOKEN`
   - Value: Your DockerHub access token (do not save the actual token value in documentation)

   Click "Add secret"

## Workflow Explanation

The GitHub Actions workflow (`.github/workflows/docker-build.yml`) is configured to:

- Trigger on:
  - Pushes to the `main` branch
  - Creation of tags starting with `v` (e.g., `v1.0.0`)
  - Pull requests targeting the `main` branch

- Build process:
  - Check out the code
  - Set up Docker Buildx
  - Log in to DockerHub using your credentials
  - Extract Docker metadata (for tags and labels)
  - Build and push the Docker image

## Automatic Tagging Strategy

When you push code or create tags, the workflow will automatically apply the following tags to the Docker image:

- Push to `main` branch: `username/2dns:latest`
- Create a tag (e.g., `v1.0.0`):
  - `username/2dns:1.0.0`
  - `username/2dns:1.0`
  - `username/2dns:1`
- All builds: Also tagged with the Git commit SHA

## Testing the Automated Build

After setup is complete, you can test the automated build by:

1. Pushing changes to the `main` branch:
   ```bash
   git add .
   git commit -m "Set up GitHub Actions automated build"
   git push origin main
   ```

2. Creating and pushing a new tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. Monitor the workflow run in the "Actions" tab of your GitHub repository
4. Verify that the new images have been successfully pushed to your DockerHub repository: https://hub.docker.com/repository/docker/username/2dns

## Troubleshooting

If the automated build fails, check:

1. That GitHub repository secrets are correctly set up
2. That the DockerHub access token is valid
3. Error messages in the GitHub Actions logs

If you need to update the DockerHub access token:
1. Generate a new access token in DockerHub
2. Update the `DOCKERHUB_TOKEN` secret in your GitHub repository
