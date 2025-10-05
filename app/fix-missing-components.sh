#!/bin/bash

# Keep trying to build and create missing components until it succeeds
while true; do
  ERROR=$(npx tsx scripts/build-registry.mts 2>&1)
  
  if echo "$ERROR" | grep -q "✓"; then
    echo "✅ Registry built successfully!"
    break
  fi
  
  MISSING=$(echo "$ERROR" | grep "ENOENT" | grep -o "registry/[^']*" | head -1)
  
  if [ -z "$MISSING" ]; then
    echo "❌ Build failed but no missing component found"
    echo "$ERROR" | tail -20
    exit 1
  fi
  
  echo "Creating stub for: $MISSING"
  
  mkdir -p "$(dirname "$MISSING")"
  cat > "$MISSING" << 'EOF'
export default function Component() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">Component coming soon</p>
    </div>
  )
}
EOF
  
  sleep 0.5
done
