# NPM Publishing Guide - React 19 Packages

## Current Package Versions

All packages updated to support **React 19.2.0**:

- `@hanzo/ui` - v5.1.1
- `@hanzo/auth` - Latest
- `@hanzo/commerce` - Latest
- `@hanzo/brand` - Latest
- `@hanzo/react` - v1.0.0

## Publishing Methods

### 1. Automatic Publishing (Tag-based)

When you push a git tag starting with `v` (typically matching @hanzo/ui version), the workflow automatically checks all packages and publishes any with new versions:

```bash
# Tag with @hanzo/ui version (workflow checks all packages)
git tag v5.1.1
git push origin v5.1.1
```

**What happens:**
1. Tests run (pkg/ui and pkg/react)
2. All 5 packages build
3. **Automatic version detection:**
   - Checks each package's current version in package.json
   - Queries npm to see if that version already exists
   - Only publishes packages with new versions not on npm
4. GitHub release created (only if packages were published)

**Example workflow output:**
```
📦 Checking @hanzo/ui@5.1.1
⏭️  Already published - skipping

📦 Checking @hanzo/auth@2.5.5
🚀 Publishing to npm...
✅ Successfully published @hanzo/auth@2.5.5

📊 Publishing Summary
✅ Published: 1 package(s)
⏭️  Skipped: 4 package(s)
```

This approach means you:
- Only need to tag once (with @hanzo/ui version)
- Don't need to track which packages need publishing
- Can bump any package version and it auto-publishes on next tag
- Similar to python-sdk monorepo publishing

**Workflow:** `.github/workflows/publish-on-tag.yml`

### 2. Manual Publishing (Workflow Dispatch)

Use GitHub Actions UI to manually publish specific packages:

1. Go to **Actions** → **NPM Publish**
2. Click **Run workflow**
3. Select package: `ui`, `auth`, `commerce`, `brand`, `react`, or `all`
4. Select version bump: `patch`, `minor`, or `major`
5. Click **Run workflow**

**What happens:**
- Selected package(s) build
- Version bumped automatically
- Package(s) published to npm
- PR created with version bump

**Workflow:** `.github/workflows/npm-publish.yml`

### 3. Local Publishing (Manual)

For quick patches or testing:

```bash
# Build and test
cd pkg/ui
pnpm build
pnpm test

# Bump version
npm version patch  # or minor/major

# Publish
npm publish --access public
```

## Prerequisites

### NPM Authentication Token

The GitHub secret `NPM_AUTH_TOKEN` must be set:

1. Generate token at https://www.npmjs.com/settings/tokens
2. Add to GitHub: Settings → Secrets → Actions → `NPM_AUTH_TOKEN`

### Package Publish Configuration

All packages already configured with:
```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

## React 19 Compatibility

### Key Updates Made

1. **Type Declarations**: Added `hanzo-ui.d.ts` files for React 19 compatibility
2. **Peer Dependencies**: Force React 19.2.0 via pnpm overrides
3. **Test Environment**: Switched to happy-dom for better React 19 support
4. **Build Configuration**: All packages build successfully with React 19

### Test Status

- **pkg/ui**: 206/207 tests passing (99.5%)
- **pkg/react**: 10/10 tests passing (100%)

## Publishing Checklist

Before publishing:

- [ ] All packages build successfully: `pnpm build`
- [ ] Tests pass: `pnpm test`
- [ ] Types check: `cd app && pnpm typecheck`
- [ ] Lint passes: `cd app && pnpm lint`
- [ ] Update CHANGELOG.md
- [ ] Update version in package.json (if manual)
- [ ] Commit changes

## Troubleshooting

### Build Failures

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

### Test Failures

```bash
# Run specific package tests
cd pkg/ui && pnpm test
cd pkg/react && pnpm test
```

### Publish Failures

- Check NPM_AUTH_TOKEN is valid
- Ensure version is unique (not already published)
- Verify package builds: `cd pkg/<name> && pnpm build`

## Package URLs

- npm: https://www.npmjs.com/org/hanzo
- GitHub: https://github.com/hanzoai/ui
- Docs: https://ui.hanzo.ai

---

**Last Updated:** 2025-10-05
**React Version:** 19.2.0
