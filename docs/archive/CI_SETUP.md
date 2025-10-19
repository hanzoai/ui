# CI/CD Setup Instructions

## NPM Publishing Setup

To enable automatic npm publishing through GitHub Actions, you need to set up an NPM automation token:

### 1. Create NPM Automation Token

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token"
3. Select "Automation" (this bypasses 2FA)
4. Copy the token (starts with `npm_`)

### 2. Add Token to GitHub Repository

```bash
# Using GitHub CLI
gh secret set NPM_AUTH_TOKEN --repo hanzoai/ui

# Or manually:
# 1. Go to https://github.com/hanzoai/ui/settings/secrets/actions
# 2. Click "New repository secret"
# 3. Name: NPM_AUTH_TOKEN
# 4. Value: [paste your npm token]
```

### 3. Usage

Once the token is set up, you can publish packages via CI:

```bash
# Trigger via GitHub CLI
gh workflow run npm-publish.yml --repo hanzoai/ui -f package=ui -f version_bump=patch

# Or via GitHub UI:
# Go to Actions → NPM Publish → Run workflow
```

## GitHub Pages Setup

To enable GitHub Pages deployment:

1. Go to https://github.com/hanzoai/ui/settings/pages
2. Source: GitHub Actions
3. Custom domain: ui.hanzo.ai
4. Enforce HTTPS: ✓

Once enabled, deployments will run automatically on push to main.

## Manual Commands

### Local Publishing (requires OTP)
```bash
cd pkg/ui
npm version patch
npm publish --access public --otp=YOUR_OTP
```

### Using Makefile
```bash
# Deploy to GitHub Pages
make deploy

# Publish packages (local, needs OTP)
make publish

# Trigger CI deployment
make deploy-pages
```

## Workflows

### CI Workflow
- **Trigger**: Push to main or PR
- **Actions**: Lint, typecheck, build, test
- **File**: `.github/workflows/ci.yml`

### Deploy to GitHub Pages
- **Trigger**: Push to main or manual
- **Actions**: Build and deploy to ui.hanzo.ai
- **File**: `.github/workflows/deploy-pages.yml`

### NPM Publish
- **Trigger**: Manual (workflow_dispatch)
- **Actions**: Version bump and publish to npm
- **File**: `.github/workflows/npm-publish.yml`
- **Requires**: NPM_AUTH_TOKEN secret

## Current Published Packages

- @hanzo/ui@4.5.4
- @hanzo/react-sdk@1.0.0

## Monitoring

```bash
# Check workflow runs
gh run list --repo hanzoai/ui

# Check deployment status
make deploy-status

# Check npm versions
npm view @hanzo/ui version
```