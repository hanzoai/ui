# Structural Migration Report: shadcn/ui vs hanzo/ui

## Executive Summary

The shadcn/ui project has undergone a major structural reorganization, moving from `apps/www` to `apps/v4` with significant changes to the registry system. Hanzo/ui is based on an older structure that needs selective updates to maintain compatibility while preserving its unique features.

## Key Structural Differences

### 1. Application Directory Migration

#### shadcn/ui Current Structure (v4)
```
shadcn/ui/
├── apps/
│   ├── v4/             # NEW: Main application (current)
│   │   ├── app/        # Next.js app router
│   │   ├── registry/   # Component registry
│   │   ├── components/ # UI components
│   │   └── scripts/    # Build scripts
│   └── www/            # DEPRECATED: Only contains .contentlayer
├── deprecated/
│   └── www/            # OLD: Complete old structure preserved
```

#### hanzo/ui Current Structure
```
hanzo/ui/
├── app/                # Single app directory (no apps/ wrapper)
│   ├── app/           # Next.js app router
│   ├── registry/      # Component registry
│   ├── __registry__/  # Generated registry index
│   ├── components/    # UI components  
│   └── scripts/       # Build scripts
```

**Key Difference**: Hanzo uses a flattened structure (`/app`) while shadcn uses nested (`/apps/v4`).

### 2. Registry System Changes

#### shadcn/ui Registry Structure
```
apps/v4/registry/
├── __blocks__.json      # Block metadata
├── __index__.tsx        # Main registry index (auto-generated)
├── base-colors.ts       # Base color definitions
├── colors.ts            # Color system
├── directory.json       # Component directory
├── icons.ts            # Icon definitions
├── new-york-v4/        # Style variant
├── default-v4/         # Default style variant
└── themes/             # Theme configurations
```

#### hanzo/ui Registry Structure
```
app/registry/
├── default/            # Default style components
├── new-york/          # New York style components
├── ai.ts              # AI components registry
├── blocks.ts          # Block definitions
├── colors.ts          # Color system
├── examples.ts        # Example registry
├── extended.ts        # Extended components
├── registry-colors.ts # Color registry
├── registry.ts        # Main registry
├── schema.ts          # TypeScript schemas
└── styles.ts          # Style definitions

app/__registry__/
├── index.tsx          # Generated index (296KB)
├── default/           # Generated default components
└── new-york/         # Generated NY components
```

**Key Differences**:
- shadcn uses `__index__.tsx` in registry folder
- hanzo uses `__registry__/index.tsx` (separate folder)
- shadcn added `-v4` suffix to style folders
- shadcn has centralized `__blocks__.json`

### 3. Public Assets Structure

#### shadcn/ui Public Structure
```
apps/v4/public/
├── r/                  # Registry API endpoint (planned)
│   └── registries.json # External registries
└── registry/          # Static registry files
```

#### hanzo/ui Public Structure  
```
app/public/
├── registry/          # Static registry files
│   ├── colors/       # Color definitions
│   ├── styles/       # Style files
│   ├── themes/       # Theme files
│   └── index.json    # Registry index
```

**Key Difference**: shadcn plans to use `/r/` for registry API, hanzo uses `/registry/`.

### 4. Build Process Changes

#### shadcn/ui Build Commands
```json
{
  "build": "pnpm --filter=shadcn build && next build",
  "registry:build": "tsx ./scripts/build-registry.mts && prettier --write"
}
```

#### hanzo/ui Build Commands
```json
{
  "build": "pnpm registry:build && next build",
  "registry:build": "tsx ./scripts/build-registry.mts"
}
```

**Key Difference**: shadcn builds the CLI package first, hanzo builds registry first.

## Deprecated Paths to Update

### In hanzo/ui, these paths need updating:

1. **Registry References**
   - `apps/www/registry` → `app/registry` ✓ (already correct)
   - `apps/www/__registry__` → `app/__registry__` ✓ (already correct)

2. **Script References**
   - Any references to `apps/www/scripts` → `app/scripts`
   - Any references to `apps/v4/scripts` → `app/scripts`

3. **Component Imports**
   - `@/registry/default-v4/` → `@/registry/default/`
   - `@/registry/new-york-v4/` → `@/registry/new-york/`

4. **Build Script Updates**
   - Remove references to `www` workspace
   - Remove references to `v4` workspace

## New Directory Requirements

### Essential New Directories/Files

1. **Registry Metadata Files** (from shadcn/v4)
   - `app/registry/__blocks__.json` - Block metadata
   - `app/registry/directory.json` - Component directory
   - `app/registry/icons.ts` - Icon registry

2. **Theme System** (partially exists)
   - `app/registry/base-colors.ts` - Base color definitions
   - `app/registry/themes/` - Theme configurations

3. **Public Registry API** (future compatibility)
   - `app/public/r/` - Registry API endpoint
   - `app/public/r/registries.json` - External registries

## Migration Steps Needed

### Phase 1: Immediate Compatibility (Required)

1. **Update build-registry.mts script**
   ```typescript
   // Remove workspace references
   - const WORKSPACE_PATHS = ["apps/www", "apps/v4"]
   + const WORKSPACE_PATH = "."
   ```

2. **Create missing metadata files**
   ```bash
   # Generate __blocks__.json from existing blocks.ts
   pnpm registry:build
   ```

3. **Fix registry index structure**
   ```typescript
   // Ensure __registry__/index.tsx matches new structure
   export const Index = {
     "default": { /* components */ },
     "new-york": { /* components */ }
   }
   ```

### Phase 2: Structural Alignment (Recommended)

1. **Align registry organization**
   - Keep current structure but ensure compatibility
   - Add missing metadata files
   - Maintain backward compatibility

2. **Update import paths**
   - Ensure all imports use correct paths
   - Remove any `-v4` suffixes
   - Update workspace references

3. **Sync build process**
   - Update scripts to match new patterns
   - Ensure registry builds before app
   - Add validation steps

### Phase 3: Future Enhancements (Optional)

1. **Implement /r/ registry API**
   - Add dynamic registry endpoint
   - Support external registry loading
   - Enable component discovery

2. **Migrate to apps/ structure**
   - Consider moving to `apps/ui/` structure
   - Maintain multiple app versions
   - Support gradual migration

## Compatibility Matrix

| Feature | shadcn/ui v4 | hanzo/ui | Compatible | Action Required |
|---------|--------------|----------|------------|-----------------|
| App Structure | `apps/v4/` | `app/` | ✓ | None (keep flat) |
| Registry Location | `apps/v4/registry/` | `app/registry/` | ✓ | Update scripts |
| Generated Index | `registry/__index__.tsx` | `__registry__/index.tsx` | ⚠️ | Align structure |
| Style Variants | `default-v4`, `new-york-v4` | `default`, `new-york` | ✓ | Keep without -v4 |
| Block Metadata | `__blocks__.json` | `blocks.ts` | ⚠️ | Generate JSON |
| Public Registry | `/r/` endpoint | `/registry/` | ⚠️ | Add /r/ support |
| Build Process | CLI first, then app | Registry first, then app | ✓ | Keep current |

## Recommendations

### Keep (Don't Change)
1. Flat `app/` structure (simpler than nested)
2. Current registry organization
3. Build process (registry-first)
4. Style variant names (without -v4)

### Update (Required)
1. Build scripts to remove workspace references
2. Registry index structure for compatibility
3. Add missing metadata files
4. Fix any hardcoded paths

### Consider (Future)
1. Adding /r/ API endpoint for dynamic loading
2. Implementing registry versioning
3. Supporting multiple app versions
4. Adding migration tooling

## Impact Assessment

### Low Risk Changes
- Updating build scripts
- Adding metadata files
- Fixing import paths

### Medium Risk Changes  
- Aligning registry structure
- Updating generated index format
- Adding new directories

### High Risk Changes
- Moving to apps/ structure (not recommended)
- Changing public asset paths
- Breaking backward compatibility

## Conclusion

The hanzo/ui structure is actually **more streamlined** than the current shadcn/ui v4 structure. The main compatibility issues are:

1. **Build script references** to deprecated workspaces
2. **Registry index structure** differences
3. **Missing metadata files** for full compatibility

The migration should focus on maintaining hanzo's cleaner structure while ensuring compatibility with shadcn's tooling and registry system.

## Next Steps

1. ✅ Fix build script workspace references
2. ⬜ Generate __blocks__.json from blocks.ts
3. ⬜ Align __registry__/index.tsx structure
4. ⬜ Add missing metadata files
5. ⬜ Test registry generation
6. ⬜ Validate component installation