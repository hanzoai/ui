#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/publish.sh              # bump patch (default), then publish
#   ./scripts/publish.sh patch|minor|major
#   ./scripts/publish.sh 5.9.1        # exact version
#
# Bumps package.json (commit + v<x.y.z> tag), publishes @hanzo/ui from the
# package root (prepublishOnly runs the build), then pushes the commit + tag.

BUMP="${1:-patch}"

# Clean tree so the version commit is clean.
if [ -n "$(git status --porcelain)" ]; then
  echo "error: working tree is dirty — commit or stash first" >&2
  exit 1
fi

# Bump package.json + create the commit and tag.
npm version "$BUMP"

NAME=$(node -p "require('./package.json').name")
NEW_VERSION=$(node -p "require('./package.json').version")

# Refuse if this version is already on the registry.
if npm view "$NAME@$NEW_VERSION" version >/dev/null 2>&1; then
  echo "error: $NAME@$NEW_VERSION is already published" >&2
  exit 1
fi

echo "Publishing $NAME@$NEW_VERSION"

# Publish from the package root (files/exports use the ./dist prefix).
npm publish

# Push the version commit + tag.
git push --follow-tags

echo "Published $NAME@$NEW_VERSION"
