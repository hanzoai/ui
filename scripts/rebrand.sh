#!/bin/bash

# Rebrand Script for White-Labeling the UI Library
# Usage: ./scripts/rebrand.sh <brand-name>
# Example: ./scripts/rebrand.sh luxfi

set -e

BRAND=$1

if [ -z "$BRAND" ]; then
  echo "Usage: $0 <brand-name>"
  echo "Available brands: luxfi, zoo"
  exit 1
fi

echo "🎨 Rebranding for $BRAND..."

# Load brand configuration
case $BRAND in
  "luxfi")
    ORG_NAME="Lux Finance"
    NPM_ORG="@luxfi"
    GITHUB_ORG="luxfi"
    DOMAIN="ui.lux.finance"
    OLD_IMPORTS="@hanzo"
    NEW_IMPORTS="@luxfi"
    ;;
  "zoo")
    ORG_NAME="Zoo NGO"
    NPM_ORG="@zooai"
    GITHUB_ORG="zooai"
    DOMAIN="ui.zoo.ngo"
    OLD_IMPORTS="@hanzo"
    NEW_IMPORTS="@zooai"
    ;;
  *)
    echo "Unknown brand: $BRAND"
    exit 1
    ;;
esac

echo "📦 Updating package.json files..."

# Update root package.json
if [ -f "package.json" ]; then
  sed -i.bak "s/@hanzo/$NEW_IMPORTS/g" package.json
  rm package.json.bak
fi

# Update app package.json
if [ -f "app/package.json" ]; then
  sed -i.bak "s/@hanzo/$NEW_IMPORTS/g" app/package.json
  sed -i.bak "s/\"name\": \"@hanzo\/ui-web\"/\"name\": \"$NPM_ORG\/ui-web\"/g" app/package.json
  rm app/package.json.bak
fi

# Update pkg/ui package.json
if [ -f "pkg/ui/package.json" ]; then
  sed -i.bak "s/@hanzo/$NEW_IMPORTS/g" pkg/ui/package.json
  sed -i.bak "s/\"name\": \"@hanzo\/ui\"/\"name\": \"$NPM_ORG\/ui\"/g" pkg/ui/package.json
  rm pkg/ui/package.json.bak
fi

echo "🔄 Updating imports in source files..."

# Update all TypeScript/JavaScript imports
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./out/*" \
  -not -path "./.git/*" \
  -exec sed -i.bak "s/$OLD_IMPORTS/$NEW_IMPORTS/g" {} \; \
  -exec rm {}.bak \;

echo "🌐 Updating domain references..."

# Update next.config.mjs
if [ -f "app/next.config.mjs" ]; then
  sed -i.bak "s/ui.hanzo.ai/$DOMAIN/g" app/next.config.mjs
  rm app/next.config.mjs.bak
fi

# Update GitHub workflows
if [ -f ".github/workflows/deploy-pages.yml" ]; then
  sed -i.bak "s/ui.hanzo.ai/$DOMAIN/g" .github/workflows/deploy-pages.yml
  rm .github/workflows/deploy-pages.yml.bak
fi

echo "📝 Updating brand configuration..."

# Copy brand config
cp "brands/${BRAND}.brand.ts" "app/lib/brand.ts"

# Update site config
if [ -f "app/config/site.ts" ]; then
  sed -i.bak "s/hanzoai/$GITHUB_ORG/g" app/config/site.ts
  sed -i.bak "s/Hanzo/$ORG_NAME/g" app/config/site.ts
  rm app/config/site.ts.bak
fi

echo "🎯 Updating GitHub repository settings..."

# Update repository description
gh repo edit --description "😎 $ORG_NAME UI Library for AI+Blockchain powered apps."

echo "✅ Rebranding complete for $BRAND!"
echo ""
echo "Next steps:"
echo "1. Commit the changes: git add -A && git commit -m 'rebrand: Update to $BRAND branding'"
echo "2. Push to repository: git push origin main"
echo "3. Set up GitHub Pages for $DOMAIN"
echo "4. Update NPM_AUTH_TOKEN secret in GitHub"
echo "5. Run deployment: make deploy"