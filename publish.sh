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

# Ask for version bump type
echo ""
echo "Select version bump type:"
echo "1) patch (x.x.X) - Bug fixes"
echo "2) minor (x.X.0) - New features"
echo "3) major (X.0.0) - Breaking changes"
echo "4) skip version bump"
read -p "Enter choice [1-4]: " choice

case $choice in
  1)
    npm version patch
    ;;
  2)
    npm version minor
    ;;
  3)
    npm version major
    ;;
  4)
    echo "Skipping version bump..."
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

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
