# White-Label Guide for UI Library

This guide explains how to fork and rebrand the Hanzo UI library for your organization.

## Quick Start

### 1. Fork the Repository

Fork `hanzoai/ui` to your organization on GitHub.

### 2. Clone and Setup

```bash
git clone https://github.com/YOUR_ORG/ui.git
cd ui
pnpm install
```

### 3. Create Your Brand Configuration

Create a brand configuration file in `brands/YOUR_BRAND.brand.ts`:

```typescript
import { BrandConfig } from '../brand.config'

export const yourBrand: BrandConfig = {
  name: "YourBrand",
  orgName: "Your Organization",
  orgHandle: "yourorg",
  tagline: "Your tagline here",
  description: "Your description",
  
  npmOrg: "@yourorg",
  packageName: "@yourorg/ui",
  
  domain: "ui.yourdomain.com",
  githubOrg: "yourorg",
  githubRepo: "ui",
  docsUrl: "https://ui.yourdomain.com",
  
  logo: {
    svg: "/your-logo.svg",
    width: 24,
    height: 24
  },
  
  colors: {
    primary: "222.2 47.4% 11.2%",
    primaryForeground: "210 40% 98%",
    secondary: "210 40% 96.1%",
    secondaryForeground: "222.2 47.4% 11.2%",
    accent: "210 40% 96.1%",
    accentForeground: "222.2 47.4% 11.2%"
  },
  
  social: {
    twitter: "@yourorg",
    github: "https://github.com/yourorg/ui"
  },
  
  seo: {
    title: "Your UI Library",
    description: "Your description",
    keywords: ["your", "keywords"]
  }
}
```

### 4. Run the Rebrand Script

Update the `scripts/rebrand.sh` to include your brand, then run:

```bash
./scripts/rebrand.sh YOUR_BRAND
```

This will:
- Update all package.json files with your organization name
- Replace all @hanzo imports with your org
- Update domain references
- Update GitHub organization references

### 5. Add Your Logo

Add your logo files to:
- `app/public/your-logo.svg`
- `app/public/your-logo-light.png` (optional)
- `app/public/your-logo-dark.png` (optional)

### 6. Configure GitHub Pages

1. Go to Settings → Pages in your GitHub repository
2. Set Source to "GitHub Actions"
3. Add custom domain if you have one
4. Update the CNAME record to point to `YOUR_ORG.github.io`

### 7. Set Up NPM Publishing

1. Create an NPM automation token at npmjs.com
2. Add it as a GitHub secret: `NPM_AUTH_TOKEN`
3. Update package names in npm-publish workflow if needed

### 8. Deploy

```bash
# Commit your changes
git add -A
git commit -m "rebrand: Customize for YOUR_ORG"
git push origin main

# Deploy to GitHub Pages
make deploy

# Publish to NPM
make publish
```

## Automated Syncing with Upstream

To keep your fork updated with the latest changes from hanzoai/ui:

### Option 1: Manual Sync

```bash
# Add upstream remote
git remote add upstream https://github.com/hanzoai/ui.git

# Fetch and merge updates
git fetch upstream
git checkout main
git merge upstream/main

# Re-run rebrand script
./scripts/rebrand.sh YOUR_BRAND

# Push updates
git push origin main
```

### Option 2: Automated Sync

1. Add a `FORK_SYNC_TOKEN` secret with a GitHub PAT
2. Create `.github/workflows/sync-upstream.yml`:

```yaml
name: Sync with Upstream

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Sync and Rebrand
        run: |
          git remote add upstream https://github.com/hanzoai/ui.git
          git fetch upstream
          git merge upstream/main --no-edit
          ./scripts/rebrand.sh YOUR_BRAND
          git push origin main
```

## Brand Package Structure

Create a separate NPM package for brand assets:

```
@yourorg/brand/
├── package.json
├── index.ts
├── colors.css
├── logos/
│   ├── logo.svg
│   ├── logo-dark.svg
│   └── logo-light.svg
├── fonts/
│   └── custom-font.woff2
└── config/
    └── brand.json
```

### Example @yourorg/brand/index.ts:

```typescript
export * from './config/brand'
export { default as Logo } from './logos/logo.svg'
export { default as LogoDark } from './logos/logo-dark.svg'
export { default as LogoLight } from './logos/logo-light.svg'

// Brand utilities
export const getBrandColor = (color: string) => {
  return `var(--${color})`
}

export const applyBrandTheme = () => {
  import('./colors.css')
}
```

## Using the Brand Package

In your UI library:

```typescript
import { Logo, applyBrandTheme, brandConfig } from '@yourorg/brand'

// Apply brand theme
applyBrandTheme()

// Use brand config
const siteName = brandConfig.name
```

## Color Customization

Edit the CSS variables in `app/styles/globals.css`:

```css
:root {
  --primary: YOUR_PRIMARY_COLOR;
  --primary-foreground: YOUR_PRIMARY_FG_COLOR;
  /* ... other colors */
}
```

Use the Tailwind CSS color format (HSL values without commas).

## Examples

### Luxfi Configuration
- Brand: Purple/Violet theme for DeFi
- Domain: ui.lux.finance
- NPM: @luxfi/ui

### Zoo Configuration  
- Brand: Green/Nature theme for NFT/Gaming
- Domain: ui.zoo.ngo
- NPM: @zooai/ui

## Troubleshooting

### Import Errors After Rebranding
Run the rebrand script again or manually update imports:
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s/@hanzo/@yourorg/g" {} \;
```

### GitHub Pages Not Deploying
1. Check GitHub Actions permissions
2. Ensure Pages is enabled in repository settings
3. Verify custom domain DNS settings

### NPM Publishing Fails
1. Ensure NPM_AUTH_TOKEN is set correctly
2. Check package name availability on NPM
3. Verify you have publish permissions for the scope

## Support

For help with white-labeling, please:
1. Check the example brands (luxfi, zoo) for reference
2. Open an issue on GitHub
3. Contact the Hanzo team

## License

This UI library is open source and available under the MIT License. You're free to fork, modify, and use it for your own projects.