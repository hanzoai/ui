#!/usr/bin/env bash
set -euo pipefail

# Guardrail: @hanzo/ui must NEVER depend on hanzogui (the Tamagui-based system).
# This package is only shadcn-derived primitives + the commerce framework. Fail
# the build if any source file imports `hanzogui` or `@hanzogui/*` so the
# coupling can't creep back in. (dist/ is excluded — it's wiped by `clean`.)

hits=$(grep -rEl "from ['\"]@hanzogui|from ['\"]hanzogui" \
  --include='*.ts' --include='*.tsx' . 2>/dev/null \
  | grep -vE '/node_modules/|/dist/' || true)

if [ -n "$hits" ]; then
  echo "error: hanzogui import found — @hanzo/ui must not depend on hanzogui:" >&2
  echo "$hits" >&2
  exit 1
fi

echo "✓ no hanzogui imports in source"
