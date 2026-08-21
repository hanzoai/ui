#!/usr/bin/env bash
set -euo pipefail

# Guard: @hanzo/brand is owned by the standalone repo github.com/hanzoai/brand
# (the npm-published, canonical source). This monorepo must NOT define or publish
# its own @hanzo/brand — that caused a package-name collision. Fail if it reappears.

hits=$(grep -rlE '"name"[[:space:]]*:[[:space:]]*"@hanzo/brand"' \
  --include=package.json apps pkg pkgs 2>/dev/null \
  | grep -vE '/node_modules/|/dist/' || true)

if [ -n "$hits" ]; then
  echo "error: @hanzo/brand must live only in github.com/hanzoai/brand, not this monorepo:" >&2
  echo "$hits" >&2
  exit 1
fi

echo "✓ @hanzo/brand not redefined in monorepo"
