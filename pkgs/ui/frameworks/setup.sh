#!/bin/bash

# Create framework adapter system structure
echo "📦 Setting up multi-framework UI library structure..."

# Create directory structure
mkdir -p frameworks/{react,svelte,vue,react-native,core,adapters}
mkdir -p frameworks/react/{components,hooks,utils}
mkdir -p frameworks/svelte/{components,stores,utils}
mkdir -p frameworks/vue/{components,composables,utils}
mkdir -p frameworks/react-native/{components,hooks,utils}
mkdir -p frameworks/core/{types,utils,styles}
mkdir -p frameworks/adapters/{react-to-svelte,react-to-vue,react-to-rn,shared}

# Copy existing React components
if [ -d "../primitives" ]; then
  echo "📋 Copying existing React components..."
  cp -r ../primitives/* frameworks/react/components/ 2>/dev/null || true
fi

# Create framework-specific package.json files
cat > frameworks/react/package.json <<'EOF'
{
  "name": "@hanzo/ui-react",
  "version": "1.0.0",
  "exports": {
    ".": "./index.ts",
    "./components": "./components/index.ts"
  }
}
EOF

cat > frameworks/svelte/package.json <<'EOF'
{
  "name": "@hanzo/ui-svelte",
  "version": "1.0.0",
  "exports": {
    ".": "./index.ts",
    "./components": "./components/index.ts"
  }
}
EOF

cat > frameworks/vue/package.json <<'EOF'
{
  "name": "@hanzo/ui-vue",
  "version": "1.0.0",
  "exports": {
    ".": "./index.ts",
    "./components": "./components/index.ts"
  }
}
EOF

cat > frameworks/react-native/package.json <<'EOF'
{
  "name": "@hanzo/ui-react-native",
  "version": "1.0.0",
  "exports": {
    ".": "./index.ts",
    "./components": "./components/index.ts"
  }
}
EOF

echo "✅ Framework structure created successfully!"
echo ""
echo "📁 Directory structure:"
tree -L 3 frameworks/ 2>/dev/null || find frameworks -type d -maxdepth 3 | sort