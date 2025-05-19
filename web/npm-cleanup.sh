#!/bin/bash

# This script cleans up npm/pnpm issues and fixes security vulnerabilities

# 2025年5月：已将Node.js版本升级为22.19.0，pnpm升级为10.2.0，并同步更新了相关workflow和配置文件。

echo "🧹 Starting npm cleanup process..."

# Step 1: Ensure correct Node.js version
echo "📊 Checking Node.js version..."
if command -v nvm &> /dev/null; then
  echo "Using nvm to switch to Node.js v23.11.0"
  nvm use 23.11.0 || nvm install 23.11.0
else
  echo "nvm not found. Please manually ensure Node.js v23.11.0 is being used."
  echo "Current version: $(node -v)"
fi

# Step 2: Clean up node_modules
echo "🗑️ Removing node_modules folder..."
rm -rf node_modules

# Step 3: Clean pnpm store cache
echo "🧼 Cleaning pnpm cache..."
pnpm store prune

# Step 4: Install dependencies with pnpm
echo "📦 Reinstalling dependencies with pnpm..."
pnpm install

# Step 5: Run audit fix
echo "🔒 Running security audit fix..."
pnpm audit fix

# Step 6: Remove extraneous packages
echo "🧹 Removing extraneous packages..."
pnpm prune

# Step 7: Update dependencies to latest compatible versions
echo "🔄 Updating dependencies to latest compatible versions..."
pnpm update

echo "✅ Cleanup complete!"
echo "Note: Some vulnerabilities may require manual intervention."
echo "Run 'pnpm audit' to check remaining issues."
