# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **Hanzo UI monorepo** - a comprehensive React component library based on shadcn/ui v4 with Hanzo branding. It provides 150+ accessible, customizable components with a sophisticated build system and multiple deployment targets.

The monorepo contains:
- **app/**: Main documentation site (Next.js 15.3.1, React 19, Fumadocs)
- **pkg/ui**: Core UI library (@hanzo/ui v5.0.0) - published to npm
- **pkg/auth**: Authentication components
- **pkg/commerce**: E-commerce components
- **pkg/brand**: Branding system

## Essential Commands

### Development
```bash
# Start main app dev server (port 3003)
pnpm dev
# or from app/
cd app && pnpm dev

# Start specific workspace
pnpm --filter=app dev    # App only
pnpm --filter=ui dev     # UI package watch mode

# Build everything
pnpm build

# Build registry (required before app build)
pnpm build:registry
# or
cd app && pnpm registry:build
```

### Code Quality
```bash
# Lint all workspaces
pnpm lint
pnpm lint:fix

# Type checking (excludes www)
pnpm typecheck

# Format code
pnpm format:write
pnpm format:check
```

### Testing
```bash
# Run tests (requires v4 dev server)
pnpm test

# Watch mode
pnpm test:dev

# E2E tests
pnpm test:e2e
pnpm test:e2e:ui    # With Playwright UI

# Visual tests
pnpm test:visual
```

### Package Publishing
```bash
# Create changeset
pnpm changeset

# Version packages
pnpm changeset version

# Publish to npm (from pkg/ui)
cd pkg/ui && npm publish --access public
```

## Architecture Overview

### Monorepo Structure
```
ui/
├── app/                    # Documentation site (Next.js 15, React 19)
│   ├── registry/          # Component registry (source of truth)
│   │   ├── default/       # Default theme variant
│   │   │   ├── ui/       # Component implementations
│   │   │   ├── example/  # Usage examples
│   │   │   └── blocks/   # Full-page sections
│   │   └── new-york/      # New York theme variant
│   ├── content/docs/      # MDX documentation
│   └── scripts/           # Build scripts (registry, capture)
├── pkg/
│   ├── ui/                # Core UI library (published to npm)
│   ├── auth/              # Auth components
│   ├── commerce/          # E-commerce components
│   └── brand/             # Branding system
├── brands/                # White-label configurations
└── templates/             # Project templates
```

### Three-Layer Component System

**1. Components** (`registry/{style}/ui/`)
- Single UI primitives (Button, Input, Card, Dialog)
- 150+ components total
- Composable building blocks
- Two theme variants: default and new-york

**2. Examples** (`registry/{style}/example/`)
- Usage demonstrations for each component
- Used in documentation via `<ComponentPreview />`
- Shows typical usage patterns

**3. Blocks** (`registry/{style}/blocks/`)
- Viewport-sized sections (Dashboard, Hero, Login, Pricing)
- Compose multiple components into full layouts
- 24+ production-ready templates
- Examples: dashboard-01, sidebar-07, login-03

### Registry Build System

**CRITICAL**: The registry is the core of the distribution system.

**Build Process:**
1. Source: Components in `app/registry/{style}/ui/`
2. Build script: `app/scripts/build-registry.mts`
3. Output: JSON files in `app/public/r/{style}/{name}.json`
4. Consumption: shadcn CLI reads JSON to install components

**Always run before app build:**
```bash
pnpm build:registry
# or from app/
pnpm registry:build
```

**Registry Entry Structure:**
```json
{
  "name": "button",
  "type": "components:ui",
  "files": ["registry/default/ui/button.tsx"],
  "dependencies": ["class-variance-authority"],
  "registryDependencies": ["utils"]
}
```

### Package Exports

The `@hanzo/ui` package provides multiple export paths:

```typescript
// Main exports
import { Button, Card } from '@hanzo/ui'

// Component-specific
import { Button } from '@hanzo/ui/components'

// Blocks
import { DashboardBlock } from '@hanzo/ui/blocks'

// Primitives (Radix UI re-exports)
import * as Dialog from '@hanzo/ui/primitives/dialog'

// Utilities
import { cn } from '@hanzo/ui/lib/utils'
```

## Development Workflows

### Adding a New Component

1. **Create component files** in both theme variants:
```bash
touch app/registry/default/ui/my-component.tsx
touch app/registry/new-york/ui/my-component.tsx
touch app/registry/default/example/my-component-demo.tsx
```

2. **Implement component** following the standard pattern:
```tsx
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-styles",
        outline: "outline-styles"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"

export { Component, componentVariants, type ComponentProps }
```

3. **Create documentation**:
```bash
touch app/content/docs/components/my-component.mdx
```

4. **Add to navigation** in `app/config/docs.ts`

5. **Build registry**:
```bash
pnpm build:registry
```

6. **Test locally**:
```bash
pnpm dev
# Visit http://localhost:3003/docs/components/my-component
```

### Running Single Tests

```bash
# Vitest (for component tests)
pnpm test path/to/test.spec.ts

# Playwright (for E2E)
pnpm test:e2e tests/specific-test.spec.ts
```

### Building for Production

```bash
# Full build (registry + all packages + app)
pnpm build

# Build specific package
pnpm --filter=ui build
pnpm --filter=app build

# Production server
cd app && pnpm start  # Port 3001
```

## Key Technologies

- **React**: 18.3.1 (app) / 19.1.0 (experimental in some areas)
- **Next.js**: 15.3.1 with Turbopack
- **Styling**: Tailwind CSS 3.4.6-4.1.11, OKLCH colors
- **Components**: Radix UI primitives
- **Build**: Turborepo + pnpm workspaces
- **Docs**: Fumadocs (MDX processing)
- **Package Manager**: pnpm 9.0.6+

## Component Patterns

### Standard Component Structure
```tsx
// 1. "use client" if interactive
"use client"

// 2. Imports
import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 3. Variants using cva
const variants = cva(/* ... */)

// 4. TypeScript interface extending HTML props
interface Props extends React.HTMLAttributes<HTMLElement> {
  // component-specific props
}

// 5. forwardRef component
const Component = React.forwardRef<HTMLElement, Props>(
  ({ className, ...props }, ref) => (
    <element
      ref={ref}
      className={cn(variants(), className)}
      {...props}
    />
  )
)

// 6. Display name
Component.displayName = "Component"

// 7. Export
export { Component }
```

### Registry Dependencies
Components can depend on other registry components:
```json
{
  "registryDependencies": ["button", "dialog", "utils"]
}
```

These auto-install when users add the component via CLI.

### Import Path Patterns

**In registry files:**
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
```

**After CLI installation** (paths are rewritten):
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

## White-Label System

The repository supports white-labeling for branded forks (Zoo, Lux).

**Configuration**: Create `brands/YOUR_BRAND.brand.ts`
```typescript
export const yourBrand: BrandConfig = {
  name: "YourBrand",
  npmOrg: "@yourorg",
  packageName: "@yourorg/ui",
  domain: "ui.yourdomain.com",
  colors: { /* custom colors */ }
}
```

**Sync Updates:**
```bash
git remote add hanzo https://github.com/hanzoai/ui.git
git fetch hanzo main
git merge hanzo/main
```

## MDX Documentation System

**Framework**: Fumadocs (replaces Contentlayer)

**Available Components in MDX:**
```tsx
<ComponentPreview name="button-demo" />      // Live demo
<ComponentSource name="button" />            // Source code
<CodeTabs>                                   // Install tabs
<Steps>                                      // Step instructions
<Callout>                                    // Info/warning boxes
```

**Navigation**: Configured in `app/config/docs.ts`

## External Registries

The CLI supports 35+ external component registries configured in `app/registries.json`:

- @aceternity, @magicui, @shadcn-editor
- @plate-ui, @kokonut, @nextui-org
- Validates via `pnpm validate:registries`

Users can install from external registries:
```bash
npx @hanzo/ui add @aceternity/spotlight
```

## Page Builder Feature

New drag-drop visual builder at `/builder` route:

- **Left Sidebar**: Filterable block library (24+ blocks)
- **Canvas**: Drag-drop page assembly with reordering
- **Export**: Generates React TSX code
- **Tech**: @dnd-kit for drag-drop, SortableContext for reordering

Access: http://localhost:3003/builder or https://ui.hanzo.ai/builder

## Deployment

### GitHub Pages (ui.hanzo.ai)
- **Workflow**: `.github/workflows/deploy-pages.yml`
- **Triggers**: Push to main branch
- **Process**:
  1. Build pkg/ui package
  2. Build registry
  3. Build Next.js app
  4. Deploy to GitHub Pages
- **Requirements**: npm-run-all, del-cli

### Forked Repositories
Zoo UI (`~/work/zoo/ui`) and Lux UI (`~/work/lux/ui`) are white-labeled forks that sync updates from this repo.

## Environment Variables

**For GitHub Pages deployment:**
```bash
NEXT_PUBLIC_APP_URL=https://ui.hanzo.ai
GITHUB_ACTIONS=true  # Enables static export
```

**For local development:**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

## Common Issues & Solutions

### Registry Not Found
**Problem**: App build fails with registry errors
**Solution**: `pnpm build:registry` before `pnpm build`

### Port Already In Use
**Problem**: 3003 already taken
**Solution**: Change port in app/package.json or kill existing process

### Type Errors After Component Changes
**Problem**: TypeScript errors in registry
**Solution**: Rebuild registry to regenerate types

### Package Not Publishing
**Problem**: npm publish fails
**Solution**: Ensure you're in pkg/ui and version is bumped

## Critical Patterns

1. **Always build registry before app**: Components → Registry JSON → App
2. **Two theme variants must sync**: default and new-york use same API
3. **Import paths transform**: `@/registry/` → `@/components/` on install
4. **Blocks vs Components**: Blocks are full sections, not CLI-installable
5. **Package exports**: Multiple entry points for different use cases

## Recent Changes (2025-10-05)

- Upgraded to Next.js 15.3.1 with Turbopack
- React 19 support (experimental features)
- Migrated from Contentlayer to Fumadocs
- Added @dnd-kit page builder
- Synced with shadcn/ui v3.4.0 (7 new components)
- Electric blue primary color (210 100% 50%)
- Added /primitives export for CTV pages

## Notes for AI Assistants

- Registry must rebuild after component changes
- Two theme variants (default, new-york) must stay in sync
- Import paths in registry use `@/registry/{style}/` which becomes `@/components/` after CLI install
- Blocks are full-page sections, NOT installable via CLI like components
- GitHub Pages deployment builds pkg/ui first, then app
- Use `pnpm` (9.0.6+), not npm/yarn for workspace commands
