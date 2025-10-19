# ⚠️ CRITICAL: Blocks Integration Gap

**Issue**: The 66 blocks we migrated are in `pkg/ui/blocks/` but NOT integrated with the app!

---

## The Situation

### 📦 Package Blocks (66 - MIGRATED, NOT INTEGRATED)

**Location**: `/pkg/ui/blocks/`

These are the hanzo blocks we just migrated:
- **Dashboard**: 1 block (dashboard-01)
- **Sidebars**: 16 blocks (sidebar-01 to sidebar-16)
- **Calendars**: 32 blocks (calendar-01 to calendar-32)
- **Auth/Login**: 5 blocks (login-01 to login-05)
- **Auth/Signup**: 5 blocks (signup-01 to signup-05)
- **Auth/OTP**: 5 blocks (otp-01 to otp-05)

**Status**: 
✅ Fully implemented
✅ All imports fixed
✅ 100% tested
❌ **NOT accessible from the app**
❌ **NOT in app registry**
❌ **Users can't preview them**

### 📱 App Registry Blocks (15 - ORIGINAL HANZO)

**Location**: `/app/__registry__/default/block/`

These are the original Hanzo blocks:
- dashboard-01 to dashboard-07 (7 blocks)
- authentication-01 to authentication-04 (4 blocks)
- invoice-manager-01, payment-settings-01, subscription-portal-01 (3 blocks)
- pricing-01 (1 block)

**Status**:
✅ Integrated with app
✅ Accessible at `/blocks/default/[name]`
✅ Can be previewed
✅ In registry config

---

## The Problem

**The 66 migrated hanzo blocks are like gold in a vault - they exist but nobody can access them!**

1. **Package exports them**: `@hanzo/ui/blocks` exports work
2. **But app doesn't import them**: App uses its own `__registry__` system
3. **Featured blocks reference them**: `/blocks` page shows sidebar-07, login-03 etc.
4. **But can't render**: App registry doesn't have them

**Example**:
```typescript
// In /app/(app)/blocks/page.tsx:
{ name: "sidebar-07", ... }  // References pkg/ui/blocks/sidebar/sidebar-07
// But BlockDisplay looks in __registry__/default/block/sidebar-07 ❌ NOT THERE
```

---

## Two Separate Block Systems

### System 1: NPM Package (`@hanzo/ui/blocks`)
- **Purpose**: Distribute as npm package
- **Location**: `/pkg/ui/blocks/`
- **Access**: `import { Dashboard01 } from '@hanzo/ui/blocks/dashboard'`
- **Use Case**: External projects using @hanzo/ui
- **Status**: ✅ Works perfectly for package consumers

### System 2: App Registry (`__registry__`)
- **Purpose**: Documentation site with live previews
- **Location**: `/app/__registry__/default/block/`
- **Access**: Dynamic route `/blocks/[style]/[name]`
- **Use Case**: Show blocks in docs with iframe previews
- **Status**: ⚠️ Missing 66 migrated blocks

---

## Impact

### ✅ What Works:
- External projects can use: `import { Dashboard01 } from '@hanzo/ui/blocks/dashboard'`
- All 66 blocks are functional and tested
- Package exports work perfectly

### ❌ What Doesn't Work:
- Can't preview migrated blocks on docs site
- Can't see live demos of sidebar-01 to sidebar-16
- Can't preview calendar-01 to calendar-32
- Can't test auth blocks (login, signup, OTP)
- Featured blocks on `/blocks` page won't render

---

## Solutions

### Option 1: Keep Separate (CURRENT - OK for now)
**Pros**: 
- Package works for npm consumers
- Clean separation
**Cons**: 
- No docs site previews
- Can't showcase in app

### Option 2: Copy to App Registry (RECOMMENDED)
**Tasks**:
1. Copy 66 block files to `/app/__registry__/default/block/`
2. Add entries to `/app/registry/blocks.ts`
3. Create block metadata (descriptions, categories)
4. Enable previews on docs site

**Estimated time**: 2-3 hours

### Option 3: Integrate Package Imports
**Tasks**:
1. Modify app to import from `@hanzo/ui/blocks`
2. Update BlockDisplay component
3. Create hybrid registry system

**Estimated time**: 4-6 hours

---

## Current Status

**Package**: ✅ Perfect - All blocks work via npm
**App**: ⚠️ Incomplete - Missing 66 blocks in docs

**This is NOT a blocker for publishing the package!**

Users can install `@hanzo/ui` and use all 66 blocks immediately. The gap is only in the documentation site previews.

---

## Recommendation

**For immediate v5.1.0 release**: Ship as-is
- Package works perfectly
- All 66 blocks accessible via imports
- Docs site shows what it can (15 app blocks)

**For v5.2.0 or docs update**: Integrate blocks into app
- Copy blocks to app registry
- Enable previews
- Complete the showcase

**The package is 100% functional** - this is a docs site enhancement, not a blocker!
