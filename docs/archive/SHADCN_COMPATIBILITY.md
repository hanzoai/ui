# @hanzo/ui - hanzo/ui Compatibility Strategy

## Overview
@hanzo/ui maintains full compatibility with hanzo/ui while providing additional Hanzo-specific enhancements. This document outlines our approach to ensuring seamless interoperability.

## Component Architecture

### 1. Core Components (`/packages/ui/src/components/`)
These are 1:1 compatible with hanzo/ui components:
- Same variant names and styles
- Same props interface
- Same underlying Radix UI primitives
- Fully compatible with hanzo/ui documentation

### 2. Legacy Primitives (`/pkg/ui/primitives/`)
For backward compatibility, primitives now act as aliases that re-export the hanzo-compatible components from the core location.

## Import Strategies

### Recommended (New Projects)
```typescript
// Import directly from @hanzo/ui
import { Button, Card, Badge } from '@hanzo/ui'
// Or from components subpath
import { Button } from '@hanzo/ui/components'
```

### Legacy Support
```typescript
// Still works for existing projects
import { Button } from '@hanzo/ui/primitives'
```

## Button Component Compatibility

The Button component maintains full hanzo/ui compatibility:

### Variants (hanzo/ui standard)
- `default` - Primary action button
- `destructive` - Destructive actions
- `outline` - Bordered button
- `secondary` - Secondary actions
- `ghost` - Minimal style
- `link` - Link style

### Additional Hanzo Variants
- `primary` - Alias for default (backward compat)
- `linkFG` - Foreground colored link
- `linkMuted` - Muted link style

### Sizes
- `default` - h-9 px-4 py-2
- `sm` - h-8 px-3 text-xs
- `lg` - h-10 px-8
- `icon` - h-9 w-9

## Color System

Uses CSS variables matching hanzo/ui:
```css
--background: Background color
--foreground: Text color
--primary: Primary brand color
--secondary: Secondary color
--muted: Muted backgrounds
--accent: Accent color
--destructive: Error/destructive color
--border: Border color
--input: Input border color
--ring: Focus ring color
```

## Monochromatic Theme

Default theme is monochromatic (black/white/gray) matching hanzo.com:
- Pure black background (#000000)
- White text (#FAFAFA)
- Gray scale for all UI elements
- No colored gradients or accents

## Migration Guide

### From Old @hanzo/ui
1. Update imports from specific paths to main export
2. Replace custom variant names with hanzo equivalents
3. Remove any rounded prop usage

### From hanzo/ui
1. Replace `@/components/ui` imports with `@hanzo/ui`
2. No other changes needed - full API compatibility

## Testing Compatibility

Run compatibility tests:
```bash
npm test -- --grep "hanzo"
```

## Publishing Updates

When updating components:
1. Maintain hanzo/ui API compatibility
2. Test against hanzo/ui documentation examples
3. Update this document if adding new variants
4. Version bump following semver

## Resources
- [hanzo/ui Documentation](https://ui.hanzo.com)
- [@hanzo/ui Repository](https://github.com/hanzoai/ui)
- [Component Examples](https://hanzo.ai/components)