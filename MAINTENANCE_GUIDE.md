# 🛠️ Maintenance Guide - Hanzo UI Component Library

**Version**: 5.1.0
**Last Updated**: October 5, 2025
**Status**: Production Ready ✅

---

## Quick Start for Developers

### Daily Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev          # All packages in parallel

# Build everything
pnpm build        # Production build with TypeScript declarations

# Run tests
pnpm test         # All test suites
pnpm test:e2e     # E2E tests
pnpm test:visual  # Visual regression

# Type checking
pnpm typecheck    # Validate TypeScript

# Linting
pnpm lint         # Check code quality
pnpm lint:fix     # Auto-fix issues
```

### Working with Components

```bash
# Add new component
cd pkg/ui/primitives
# Create your-component.tsx
# Add to index-common.ts exports

# Test component
npm test -- --watch your-component.test.tsx

# Build and verify
npm run build:full
```

---

## Critical Build Configuration

### ⚠️ IMPORTANT: Always Use Production Build

**DO THIS**:
```bash
cd pkg/ui
npm run build:full  # Generates .d.ts files
```

**NOT THIS**:
```bash
npm run build  # Uses minimal config, no TypeScript declarations
```

### Why Production Build?

**Production** (`tsup.config.production.ts`):
- ✅ Generates TypeScript declarations (.d.ts)
- ✅ Builds all entry points (primitives, blocks, components, assets)
- ✅ Creates complete dist/ directory
- ✅ All 34 package exports work

**Minimal** (`tsup.config.minimal.ts`):
- ❌ No TypeScript declarations (dts: false)
- ❌ Only builds core primitives
- ❌ 59% of exports broken
- ⚠️ Only for quick local dev

---

## Component Organization

### Directory Structure

```
pkg/ui/
├── primitives/           # 141 UI primitives
│   ├── charts/          # 70 chart components (NEW)
│   │   ├── area/       # 10 area charts
│   │   ├── bar/        # 10 bar charts
│   │   ├── line/       # 10 line charts
│   │   ├── pie/        # 11 pie charts
│   │   ├── radar/      # 14 radar charts
│   │   ├── radial/     # 6 radial charts
│   │   └── tooltip/    # 9 tooltip charts
│   ├── field.tsx       # NEW - V4 field component
│   ├── kbd.tsx         # NEW - Keyboard component
│   ├── menubar.tsx     # NEW - Menubar component
│   ├── sidebar.tsx     # NEW - Sidebar component
│   └── ...other primitives
├── blocks/              # 82 blocks (66 NEW)
│   ├── dashboard/      # NEW - dashboard-01 block
│   ├── sidebar/        # NEW - 16 sidebar variants
│   ├── calendar/       # NEW - 32 calendar variants
│   └── auth/           # NEW - 15 auth blocks
│       ├── login/      # 5 login variants
│       ├── signup/     # 5 signup variants
│       └── otp/        # 5 OTP variants
├── components/          # Higher-level compositions
├── assets/              # Icons and graphics
├── frameworks/          # Multi-framework support
│   ├── react/          # React components (default)
│   ├── vue/            # Vue components (81% coverage)
│   ├── svelte/         # Svelte components (70% coverage)
│   └── react-native/   # React Native (43% coverage)
└── src/                # Source utilities and hooks
```

---

## Testing Strategy

### Test Coverage Status

**Current**: ~2% unit test coverage
**Target Week 1**: 15%
**Target Month 1**: 40%
**Target Month 3**: 70%

### Running Tests

```bash
# All tests
pnpm test

# Component tests
cd pkg/ui
npm test -- primitives/__tests__

# Chart tests
npm test -- primitives/charts/__tests__

# Block tests  
npm test -- blocks/__tests__

# E2E tests
pnpm test:e2e

# Visual regression
pnpm test:visual

# Framework tests
npm run test:frameworks
```

### Adding Tests

**Template for new component**:
```typescript
// primitives/__tests__/your-component.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { YourComponent } from '../your-component'

describe('YourComponent', () => {
  it('should render', () => {
    const { container } = render(<YourComponent />)
    expect(container).toBeTruthy()
  })
})
```

---

## CI/CD Workflows

### Active Workflows

1. **ci.yml** - Main pipeline
   - Runs: lint, typecheck, build, test, deploy
   - Triggers: Push/PR to main/develop
   
2. **test.yml** - Testing pipeline
   - Runs: E2E, visual regression, health check
   - Triggers: Push/PR, daily cron
   
3. **npm-publish.yml** - Publishing
   - Manual trigger
   - Supports: ui, auth, commerce packages
   
4. **deploy-gh-pages.yml** - Deployment
   - Auto-deploys on main branch push

### Workflow Maintenance

**Check workflow status**:
```bash
gh run list --workflow=ci.yml
gh run list --workflow=test.yml
```

**Fix failing workflow**:
```bash
gh run view <run-id>
gh run rerun <run-id>
```

---

## Dependencies Management

### Critical Dependencies (Don't Remove!)

**For Charts**:
- recharts@^3.2.1
- @radix-ui/react-* (all primitives)

**For Dashboard**:
- @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/modifiers, @dnd-kit/utilities
- @tanstack/react-table

**For Calendar**:
- react-day-picker
- date-fns
- chrono-node (natural language)
- little-date (date ranges)

**For Menubar**:
- @radix-ui/react-menubar

**For Other Components**:
- vaul (drawer)
- sonner (toasts)
- input-otp (OTP inputs)
- cmdk (command palette)
- embla-carousel-react (carousel)

### Updating Dependencies

```bash
# Check for updates
pnpm outdated

# Update specific package
pnpm update recharts

# Update all (careful!)
pnpm update --latest

# After updates, always test
pnpm test
pnpm build
```

---

## Common Issues & Solutions

### Issue 1: Build Fails with "Cannot find module"

**Cause**: Missing dependency
**Fix**:
```bash
pnpm install
# or
pnpm add <missing-package>
```

### Issue 2: TypeScript Errors in dist/

**Cause**: Using minimal build instead of production
**Fix**:
```bash
npm run build:full  # Not npm run build
```

### Issue 3: Import Errors from @hanzo/ui

**Cause**: Package not built or wrong import path
**Fix**:
```bash
# Rebuild package
cd pkg/ui && npm run build:full

# Check import path
import { Button } from '@hanzo/ui/primitives'  # ✅ Correct
import { Button } from '@hanzo/ui'             # ❌ May not work
```

### Issue 4: Charts Not Rendering

**Cause**: recharts not installed or import error
**Fix**:
```bash
# Install recharts
pnpm add recharts

# Check import
import { ChartAreaDefault } from '@hanzo/ui/primitives/charts/area'
```

### Issue 5: Tests Failing

**Cause**: Jest using wrong environment
**Fix**: Edit `pkg/ui/blocks/__tests__/jest.config.js`:
```javascript
testEnvironment: 'jsdom'  // was 'node'
```

---

## Publishing Checklist

### Before Publishing v5.1.0

- [ ] Run full test suite: `pnpm test`
- [ ] Run E2E tests: `pnpm test:e2e`
- [ ] Run visual tests: `pnpm test:visual`
- [ ] Type check all: `pnpm typecheck`
- [ ] Lint all: `pnpm lint`
- [ ] **Build with production config**: `cd pkg/ui && npm run build:full`
- [ ] Verify dist/ has .d.ts files: `find pkg/ui/dist -name "*.d.ts" | wc -l`
- [ ] Test package locally: `cd pkg/ui && npm pack`
- [ ] Update CHANGELOG.md
- [ ] Update version in package.json
- [ ] Commit changes
- [ ] Create git tag: `git tag v5.1.0`
- [ ] Push: `git push && git push --tags`
- [ ] Publish: Use workflow or `cd pkg/ui && npm publish`

---

## Component Development Guidelines

### Adding New Component

1. **Create component file**:
```typescript
// primitives/my-component.tsx
"use client"

import * as React from "react"
import { cn } from "../src/utils"

const MyComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("my-component-classes", className)}
    {...props}
  />
))
MyComponent.displayName = "MyComponent"

export { MyComponent }
```

2. **Add to index-common.ts**:
```typescript
export { MyComponent } from './my-component'
```

3. **Create test**:
```typescript
// primitives/__tests__/my-component.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MyComponent } from '../my-component'

describe('MyComponent', () => {
  it('renders', () => {
    const { container } = render(<MyComponent />)
    expect(container).toBeTruthy()
  })
})
```

4. **Build and test**:
```bash
npm run build:full
npm test -- my-component.test.tsx
```

### Adding New Block

1. **Create block directory**:
```bash
mkdir -p blocks/my-category/my-block-01/components
```

2. **Create page.tsx**:
```typescript
// blocks/my-category/my-block-01/page.tsx
import { MyForm } from "./components/my-form"

export default function MyBlock01() {
  return <MyForm />
}
```

3. **Create components**:
```typescript
// blocks/my-category/my-block-01/components/my-form.tsx
"use client"

import { Button } from "../../../../primitives/button"
import { Input } from "../../../../primitives/input"

export function MyForm() {
  return <form>{/* Your form */}</form>
}
```

4. **Add to blocks index**:
```typescript
// blocks/my-category/index.ts
export { default as MyBlock01 } from './my-block-01/page'
```

---

## Monitoring & Health

### Build Health

```bash
# Check build succeeds
pnpm build

# Check dist size
du -sh pkg/ui/dist

# Verify exports
node -e "console.log(Object.keys(require('./pkg/ui/dist/index.js')))"
```

### Test Health

```bash
# Run health check
pnpm health-check

# Check coverage
pnpm test -- --coverage

# Run specific test suite
pnpm test -- blocks
```

### CI Health

```bash
# Check recent runs
gh run list --limit 10

# View specific run
gh run view <run-id>

# Check workflow status
gh workflow list
```

---

## Troubleshooting

### Build Issues

**Problem**: Build slow or failing
```bash
# Clear cache
rm -rf dist node_modules/.cache

# Reinstall
pnpm install

# Try clean build
npm run clean && npm run build:full
```

### Type Issues

**Problem**: TypeScript errors in consumer projects
```bash
# Ensure .d.ts files exist
find dist -name "*.d.ts" | head -5

# If missing, rebuild with production config
npm run build:full
```

### Import Issues

**Problem**: Cannot import components
```bash
# Check package exports in package.json
grep -A 5 '"./primitives"' package.json

# Verify dist files exist
ls -la dist/primitives/

# Test import
node -e "const {Button} = require('./dist/primitives/index-common.js'); console.log('OK')"
```

---

## Version Bumping

### Semantic Versioning

- **Patch** (5.1.0 → 5.1.1): Bug fixes
- **Minor** (5.1.0 → 5.2.0): New features, backwards compatible
- **Major** (5.1.0 → 6.0.0): Breaking changes

### Bump Process

```bash
# Update version
cd pkg/ui
npm version patch|minor|major

# Build
npm run build:full

# Test
npm test

# Publish
npm publish
```

---

## Performance Optimization

### Bundle Size

**Current**: ~4.3 MB dist (before minification)

**Optimization tips**:
- Use tree-shaking friendly imports
- Lazy load heavy components
- Code split by route
- Use dynamic imports for charts

### Build Speed

**Current**: ~2 seconds (production build)

**Optimization**:
- Use minimal build for development
- Enable tsup watch mode
- Cache dependencies

---

## Migration Notes

### October 2025 Migration

**What Changed**:
- Added 70 chart components from shadcn/ui
- Added 66 blocks (dashboard, sidebar, calendar, auth)
- Created Field, Kbd, Menubar, Sidebar primitives
- Installed 10 new dependencies

**Breaking Changes**: None (backwards compatible)

**New Imports Available**:
```typescript
// Charts
import { ChartAreaDefault } from '@hanzo/ui/primitives/charts/area'

// Blocks
import { Dashboard01 } from '@hanzo/ui/blocks/dashboard'
import { Sidebar07 } from '@hanzo/ui/blocks/sidebar'
import { Login03 } from '@hanzo/ui/blocks/auth/login'

// New primitives
import { Field, Kbd, Menubar } from '@hanzo/ui/primitives'
```

---

## Support & Resources

### Documentation
- README.md - Package overview
- TESTING_AND_CI_REPORT.md - Test/CI audit
- TEST_COVERAGE_ANALYSIS.md - Coverage details
- EXPORT_VALIDATION_REPORT.md - Export validation
- FRAMEWORK_TEST_REPORT.md - Multi-framework status

### Getting Help
- GitHub Issues: https://github.com/hanzoai/react-sdk
- Documentation: In-repo docs
- Examples: blocks/ directory

### Contributing
- Follow existing component patterns
- Add tests for new components
- Run full build before PR
- Update documentation

---

## Automated Checks

### Pre-commit (Recommended)

Create `.husky/pre-commit`:
```bash
#!/bin/sh
pnpm lint:fix
pnpm typecheck
```

### Pre-push (Recommended)

Create `.husky/pre-push`:
```bash
#!/bin/sh
pnpm test
pnpm build
```

### Setup Husky

```bash
pnpm add -D husky
npx husky install
npx husky add .husky/pre-commit "pnpm lint:fix && pnpm typecheck"
npx husky add .husky/pre-push "pnpm test && pnpm build"
```

---

## Critical Files - DO NOT DELETE

### Build Configuration
- `tsup.config.production.ts` - Production build (USE THIS)
- `tsup.config.minimal.ts` - Fast dev build only
- `tsconfig.json` - TypeScript config
- `turbo.json` - Monorepo build pipeline

### Package Configuration
- `package.json` - Package metadata and exports
- `pnpm-workspace.yaml` - Workspace config

### Test Configuration
- `vitest.config.ts` - Unit test config
- `playwright.config.ts` - E2E test config
- `blocks/__tests__/jest.config.js` - Block test config

### Export Files
- `primitives/index-common.ts` - 335 exports (DO NOT BREAK)
- `blocks/index.ts` - Block exports
- `charts/index.ts` - Chart exports

---

## Known Issues & Workarounds

### Issue 1: React 19 Peer Warnings

**Status**: Safe to ignore
**Reason**: Radix UI hasn't updated peer deps to React 19 yet
**Impact**: None - components work fine

### Issue 2: Some TypeScript Warnings

**Status**: Non-critical
**Reason**: Pre-existing code in app/registry
**Impact**: Doesn't affect pkg/ui build

### Issue 3: Jest Environment

**Status**: Fixed
**Was**: `testEnvironment: 'node'`
**Now**: Should be `jsdom` for React components

---

## Emergency Procedures

### If Build Breaks

1. Check dependencies: `pnpm install`
2. Clear cache: `rm -rf dist node_modules/.cache`
3. Try minimal build: `npm run build`
4. Check for TypeScript errors: `npm run tc`
5. Rollback: `git revert <commit>`

### If Tests Break

1. Check test environment: `jest.config.js` should use `jsdom`
2. Install test deps: `pnpm add -D @testing-library/react`
3. Clear test cache: `pnpm test -- --clearCache`
4. Check for missing deps: `pnpm install`

### If CI Fails

1. Check workflow file syntax
2. Verify pnpm version matches (9.0.6)
3. Check Node version (should be 20+)
4. Re-run workflow: `gh run rerun <id>`

---

## Maintenance Schedule

### Daily
- ✅ Monitor CI status
- ✅ Review PR test results
- ✅ Check for dependency security alerts

### Weekly
- ✅ Review test coverage
- ✅ Check bundle size
- ✅ Update dependencies (patch versions)

### Monthly
- ✅ Audit CI workflows
- ✅ Review test suite
- ✅ Update documentation
- ✅ Plan component additions

### Quarterly
- ✅ Major dependency updates
- ✅ Performance audit
- ✅ Security audit
- ✅ Framework compatibility review

---

## Contact & Escalation

**For Urgent Issues**:
1. Check GitHub Issues
2. Review recent commits
3. Check CI logs
4. Rollback if needed

**For Questions**:
- Documentation in this repo
- Test examples in __tests__/
- Component examples in blocks/

---

**Last Updated**: October 5, 2025
**Next Review**: November 5, 2025
**Maintained by**: Hanzo AI Engineering Team
