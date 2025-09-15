#!/bin/bash
# CI Build script for Next.js app

# Skip registry build in CI
echo "Skipping registry build in CI..."

# Run Next.js build directly
if [ -f "node_modules/.bin/next" ]; then
    echo "Using local next"
    node_modules/.bin/next build
elif command -v next &> /dev/null; then
    echo "Using global next"
    next build
else
    echo "Installing and using next via npx"
    npx next@15.3.1 build
fi