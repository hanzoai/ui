#!/bin/bash

STUB_TEMPLATE='export default function Component() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">Component coming soon</p>
    </div>
  )
}'

created=0
while IFS= read -r path; do
  file="registry/$path.tsx"
  if [ ! -f "$file" ]; then
    mkdir -p "$(dirname "$file")"
    echo "$STUB_TEMPLATE" > "$file"
    echo "Created: $file"
    created=$((created + 1))
  fi
done < /tmp/registry-imports.txt

echo "✅ Created $created stub components"
