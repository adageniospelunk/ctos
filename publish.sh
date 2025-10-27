#!/bin/bash

# publish.sh - Easy publish script for ctosooa package

set -e

echo "Starting publish process..."

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo "Error: You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Automatically bump patch version
echo "Bumping patch version..."
npm version patch

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: $NEW_VERSION"

# Push to git
echo "Pushing to git..."
git push
git push --tags

# Publish to npm
echo "Publishing to npm..."
npm publish

echo ""
echo "✅ Successfully published ctosooa@$NEW_VERSION"
echo ""
echo "Install with: npm install -g ctosooa"
