# NPM Cleanup Guide

This guide addresses the npm-related issues identified in the project and provides instructions for resolving them.

## Issues Identified

1. **Node.js Version Mismatch**
   - Current: Node.js v23.9.0
   - Recommended: Node.js v23.11.0

2. **Package Manager Inconsistency**
   - Project had both package-lock.json and pnpm-lock.yaml files
   - Standardized on pnpm for better performance and disk space efficiency

3. **Outdated Dependencies**
   - Several packages were outdated, including React, Next.js, and various UI components
   - Dependencies have been updated in package.json

4. **Security Vulnerabilities**
   - 180 vulnerabilities detected (129 moderate, 47 high, 4 critical)
   - Cleanup script provided to address these issues

5. **Extraneous Packages**
   - Several packages installed but not listed in package.json
   - Cleanup script will remove these packages

## Changes Made

1. **Standardized on pnpm**
   - Removed package-lock.json
   - Added .npmrc configuration to enforce pnpm usage

2. **Updated Node.js Version Requirements**
   - Added engines field to package.json
   - Created .nvmrc file for nvm users

3. **Updated Dependencies**
   - Updated package.json with newer versions of dependencies
   - Focused on security and compatibility

4. **Created Cleanup Script**
   - Added npm-cleanup.sh to automate the cleanup process

## How to Use the Cleanup Script

1. Make sure the script is executable:
   ```bash
   chmod +x npm-cleanup.sh
   ```

2. Run the script:
   ```bash
   ./npm-cleanup.sh
   ```

3. The script will:
   - Check and switch to the recommended Node.js version (if nvm is available)
   - Clean up node_modules
   - Clean pnpm cache
   - Reinstall dependencies with pnpm
   - Run security audit fixes
   - Remove extraneous packages
   - Update dependencies to latest compatible versions

## Manual Steps (if needed)

If you prefer to perform the cleanup manually or if the script encounters issues:

1. **Switch to the recommended Node.js version**:
   ```bash
   nvm use 23.11.0  # If using nvm
   # OR
   # Install Node.js v23.11.0 from https://nodejs.org/
   ```

2. **Clean up and reinstall**:
   ```bash
   rm -rf node_modules
   pnpm install
   pnpm audit fix
   pnpm prune
   pnpm update
   ```

3. **Check remaining vulnerabilities**:
   ```bash
   pnpm audit
   ```

## Handling Remaining Vulnerabilities

Some vulnerabilities may require manual intervention:

1. **For direct dependencies**:
   - Research if newer versions fix the vulnerability
   - Consider alternative packages with similar functionality

2. **For transitive dependencies**:
   - Check if updating the parent dependency resolves the issue
   - Consider using resolution overrides in package.json

3. **For development dependencies**:
   - Assess the risk based on how they're used in your workflow
   - Consider if they're only used in safe contexts

## Best Practices Going Forward

1. Use a single package manager consistently (pnpm)
2. Regularly update dependencies
3. Run security audits as part of CI/CD
4. Consider adding pre-commit hooks to check for vulnerabilities
5. Document any security exceptions and review them periodically
