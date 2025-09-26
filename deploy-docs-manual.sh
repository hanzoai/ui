#!/bin/bash

# Manual deployment script for GitHub Pages when Actions billing is limited
# This script builds and deploys documentation directly to the gh-pages branch

set -e

echo "🚀 Manual GitHub Pages Deployment for Hanzo UI Documentation"
echo "============================================================"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📌 Current branch: $CURRENT_BRANCH"

# Build documentation
echo "🔨 Building documentation..."
./build-docs.sh

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "✅ gh-pages branch exists"
else
    echo "📝 Creating gh-pages branch..."
    git checkout --orphan gh-pages
    git rm -rf .
    git commit --allow-empty -m "Initial gh-pages commit"
    git checkout "$CURRENT_BRANCH"
fi

# Create temporary directory for deployment
TEMP_DIR=$(mktemp -d)
echo "📁 Using temp directory: $TEMP_DIR"

# Copy built files to temp directory
cp -r docs-output/* "$TEMP_DIR/"

# Switch to gh-pages branch
echo "🔄 Switching to gh-pages branch..."
git checkout gh-pages

# Clear existing files (except .git)
find . -maxdepth 1 ! -name '.git' ! -name '.' ! -name '..' -exec rm -rf {} +

# Copy new files
cp -r "$TEMP_DIR"/* .

# Add and commit
git add -A
git commit -m "Deploy documentation - $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"

echo ""
echo "✅ Documentation built and committed to gh-pages branch!"
echo ""
echo "To deploy to GitHub Pages:"
echo "1. Push the gh-pages branch:"
echo "   git push origin gh-pages"
echo ""
echo "2. Enable GitHub Pages in your repository settings:"
echo "   - Go to Settings > Pages"
echo "   - Source: Deploy from a branch"
echo "   - Branch: gh-pages"
echo "   - Folder: / (root)"
echo ""
echo "3. Your docs will be available at:"
echo "   https://hanzoai.github.io/ui/"
echo ""
echo "To return to your working branch:"
echo "   git checkout $CURRENT_BRANCH"

# Clean up temp directory
rm -rf "$TEMP_DIR"