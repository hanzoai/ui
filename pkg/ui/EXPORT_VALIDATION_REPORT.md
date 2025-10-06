# @hanzo/ui Package Export Validation Report

**Date:** October 5, 2025
**Package:** @hanzo/ui v5.0.0
**Location:** /Users/z/work/hanzo/ui/pkg/ui

## Executive Summary

❌ **CRITICAL ISSUES FOUND**

- **TypeScript Declarations Missing:** NO .d.ts files generated (dts: false in build config)
- **Export Coverage:** Only 14/34 exports (41%) are functional
- **Missing Directories:** 7 critical export directories not built
- **Build Configuration:** Using minimal config instead of production config

## Detailed Findings

### 1. TypeScript Declaration Files (.d.ts)

**Status:** ❌ MISSING (0 files found)

**Root Cause:** 
```typescript
// tsup.config.minimal.ts line 60
dts: false, // Skip for now to speed up builds
```

**Impact:**
- TypeScript users cannot use this package
- No autocomplete or type checking
- All exports marked with `types: "./dist/xxx.d.ts"` are broken
- NPM package will fail in TypeScript projects

**Fix Required:**
- Use production build config: `npm run build:full`
- Or enable dts in minimal config: `dts: true`

### 2. Export Path Analysis

#### ✅ Working Exports (14/34)

| Export Path | Status | Files Present |
|------------|--------|---------------|
| `.` | ✅ | index.{js,mjs} |
| `./calendar` | ✅ | calendar.{js,mjs} |
| `./command` | ✅ | command.{js,mjs} |
| `./carousel` | ✅ | carousel.{js,mjs} |
| `./form` | ✅ | form.{js,mjs} |
| `./drawer` | ✅ | drawer.{js,mjs} |
| `./billing` | ✅ | src/billing/index.ts (source) |
| `./sonner` | ✅ | sonner.{js,mjs} |
| `./input-otp` | ✅ | input-otp.{js,mjs} |
| `./resizable` | ✅ | resizable.{js,mjs} |
| `./tailwind` | ✅ | tailwind/index.{js,mjs} |
| `./types` | ✅ | types/index.{js,mjs} |
| `./utils` | ✅ | src/utils.{js,mjs} |
| `./lib/utils` | ✅ | src/utils.{js,mjs} |

#### ❌ Broken Exports (20/34)

**Missing Directories:**
1. `dist/assets/` - No assets built
2. `dist/blocks/` - No blocks built  
3. `dist/components/` - No components built
4. `dist/primitives/` - No primitives built (critical!)
5. `dist/util/` - No utils built
6. `dist/frameworks/` - No framework support built
7. `dist/src/registry/` - No registry built
8. `dist/src/mcp/` - No MCP server built

**Affected Exports:**

| Export | Missing Files | Impact |
|--------|--------------|--------|
| `./primitives` | primitives-export.{js,mjs,d.ts} | Core primitives unavailable |
| `./primitives/*` | primitives/*.{js,mjs,d.ts} | Individual primitives unavailable |
| `./primitives-common` | primitives/index-common.{js,mjs,d.ts} | Common primitives unavailable |
| `./blocks` | blocks/index.{js,mjs,d.ts} | Block components unavailable |
| `./blocks/*` | blocks/*.{js,mjs,d.ts} | Individual blocks unavailable |
| `./components` | components/index.{js,mjs,d.ts} | Components unavailable |
| `./components/*` | components/*.{js,mjs,d.ts} | Individual components unavailable |
| `./assets` | assets/index.{js,mjs,d.ts} | Asset utilities unavailable |
| `./assets/*` | assets/*.{js,mjs,d.ts} | Individual assets unavailable |
| `./util` | util/index.{js,mjs,d.ts} | Utilities unavailable |
| `./util/*` | util/*.{js,mjs,d.ts} | Individual utils unavailable |
| `./util-client` | util/index-client.{js,mjs,d.ts} | Client utils unavailable |
| `./tailwind/*` | tailwind/*.{js,mjs,d.ts} | Tailwind wildcards unavailable |
| `./types/*` | types/*.{js,mjs,d.ts} | Type wildcards unavailable |
| `./registry` | src/registry/index.{js,mjs,d.ts} | Registry unavailable |
| `./mcp` | src/mcp/index.{js,mjs,d.ts} | MCP server unavailable |
| `./react` | frameworks/react/index.{js,mjs,d.ts} | React framework unavailable |
| `./vue` | frameworks/vue/index.{js,mjs,d.ts} | Vue framework unavailable |
| `./svelte` | frameworks/svelte/index.{js,mjs,d.ts} | Svelte framework unavailable |
| `./react-native` | frameworks/react-native/index.{js,mjs,d.ts} | React Native unavailable |

### 3. Build Configuration Issues

**Current Build:**
```json
"build": "npm run clean && npm run build:tsup",
"build:tsup": "tsup --config tsup.config.minimal.ts"
```

**Problems:**
1. Using minimal config (tsup.config.minimal.ts)
2. Only builds core primitives from primitives/index-core.ts
3. Skips TypeScript declarations (dts: false)
4. Missing entry points for: blocks, components, assets, frameworks, registry, mcp

**Available Configs:**
- ✅ `tsup.config.production.ts` - Full build with types (recommended)
- ⚠️ `tsup.config.minimal.ts` - Current (incomplete)
- 📦 `tsup.config.frameworks.ts` - Multi-framework build
- 🔧 `tsup.config.simple.ts` - Alternative simple build

### 4. Source vs Dist Mapping

**Source directories exist:**
- ✅ `/primitives` (87 items)
- ✅ `/blocks` (9 items)
- ✅ `/components` (4 items)
- ✅ `/assets` (12 items)
- ✅ `/util` (21 items)
- ✅ `/frameworks` (10 items)
- ✅ `/src` (9 items)
- ✅ `/tailwind` (15 items)
- ✅ `/types` (15 items)

**Dist directories built:**
- ✅ `/dist/lib` (2 files)
- ✅ `/dist/src` (2 files)
- ✅ `/dist/tailwind` (2 files)
- ✅ `/dist/types` (2 files)
- ❌ `/dist/primitives` - NOT BUILT
- ❌ `/dist/blocks` - NOT BUILT
- ❌ `/dist/components` - NOT BUILT
- ❌ `/dist/assets` - NOT BUILT
- ❌ `/dist/util` - NOT BUILT
- ❌ `/dist/frameworks` - NOT BUILT

### 5. Tree Shaking & Optimization

**Current Status:**
- ✅ ESM format supported (dist/*.mjs)
- ✅ CJS format supported (dist/*.js)
- ❌ No TypeScript types for tree shaking hints
- ✅ sideEffects: false in package.json (good!)
- ⚠️ Minification enabled in minimal build (may hide issues)

### 6. Multi-Framework Support

**Advertised Frameworks:**
- React ❌ (dist/frameworks/react not built)
- Vue ❌ (dist/frameworks/vue not built)
- Svelte ❌ (dist/frameworks/svelte not built)
- React Native ❌ (dist/frameworks/react-native not built)

**Package Description Claims:**
> "Multi-framework UI library with React, Vue, Svelte, and React Native support"

**Reality:** None of the framework-specific exports work!

## Recommendations

### Immediate Actions (CRITICAL)

1. **Switch to Production Build**
   ```bash
   npm run build:full  # Uses tsup.config.production.ts
   ```

2. **Update Default Build Script**
   ```json
   {
     "scripts": {
       "build": "npm run clean && tsup --config tsup.config.production.ts",
       "build:dev": "tsup --config tsup.config.minimal.ts"
     }
   }
   ```

3. **Enable TypeScript Declarations**
   - Production config already has `dts: true`
   - Minimal config needs: `dts: true` (line 60)

### Medium Priority

4. **Add Entry Points to Minimal Config**
   If keeping minimal build, add:
   ```typescript
   entry: {
     // ... existing entries ...
     'primitives-export': 'primitives/index-next.ts',
     'blocks/index': 'blocks/index.ts',
     'components/index': 'components/index.ts',
     'assets/index': 'assets/index.ts',
     'util/index': 'util/index.ts',
     'frameworks/react/index': 'frameworks/react/index.ts',
     // ... etc
   }
   ```

5. **Add Export Validation Test**
   ```bash
   npm run test:exports  # Add this script
   ```

6. **CI/CD Integration**
   - Run export validation before publish
   - Test TypeScript compilation
   - Verify tree shaking works

### Long Term

7. **Documentation Updates**
   - Update README with actual working exports
   - Document which build config to use for what
   - Add migration guide for users

8. **Package.json Cleanup**
   - Remove broken exports or fix them
   - Add export conditions for better resolution
   - Consider export maps for better tree shaking

## Testing Commands

```bash
# Test current exports
node -e "const pkg = require('./package.json'); Object.keys(pkg.exports).forEach(k => console.log(k))"

# Build with production config
npm run build:full

# Verify TypeScript compilation
npm run build:check

# Test import resolution (after full build)
node -e "const x = require('@hanzo/ui/primitives')"
```

## Risk Assessment

**Severity:** 🔴 CRITICAL

**User Impact:**
- TypeScript projects: Completely broken
- Tree shaking: Not working optimally
- Multi-framework: False advertising
- Charts/Blocks: Unavailable
- Primitives: Only via root export

**Business Impact:**
- Package cannot be published in current state
- Users will encounter immediate import errors
- May damage package reputation
- Requires emergency patch release

## Conclusion

The current build configuration produces a **partially functional package** that will fail for most users. The minimal build config is missing critical entry points and has TypeScript declarations disabled. 

**Required before publication:**
1. Build with production config
2. Verify all exports resolve
3. Test TypeScript compilation
4. Validate tree shaking
5. Update documentation

**Estimated Fix Time:** 1-2 hours
**Recommended Action:** DO NOT PUBLISH - Fix exports first

---

**Report Generated:** 2025-10-05
**Validator:** Package Export Analysis Tool
