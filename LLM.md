# Hanzo UI - AI Assistant Knowledge Base

**Last Updated**: 2025-10-05
**Project**: Hanzo UI Component Library (shadcn/ui v4 fork)
**Version**: @hanzo/ui v5.0.0

## Project Overview

Hanzo UI is a comprehensive React component library built on shadcn/ui v4 with Hanzo branding. It provides 150+ accessible, customizable components distributed via npm and CLI.

### Repository Structure

```
ui/
├── app/                    # Documentation site (Next.js 15.3.1, React 19)
│   ├── registry/          # Component registry (source of truth)
│   │   ├── default/       # Default theme
│   │   │   ├── ui/       # 150+ component implementations
│   │   │   ├── example/  # Usage demos
│   │   │   └── blocks/   # 24+ full-page sections
│   │   └── new-york/      # Alternative theme
│   ├── content/docs/      # MDX documentation
│   └── scripts/           # Build scripts (registry, capture)
├── pkg/
│   ├── ui/                # Core library (published to npm)
│   ├── auth/              # Auth components
│   ├── commerce/          # E-commerce components
│   └── brand/             # Branding system
├── brands/                # White-label configs (Zoo, Lux)
└── templates/             # Project templates
```

## Essential Commands

### Development (Always Required)
```bash
# Start main dev server (port 3003)
pnpm dev

# Build registry FIRST, then app
pnpm build:registry
pnpm build

# Run from root or app/
cd app && pnpm dev
cd app && pnpm registry:build
```

### Code Quality
```bash
pnpm lint              # Lint all workspaces
pnpm lint:fix          # Auto-fix issues
pnpm typecheck         # Type checking
pnpm format:write      # Format code
```

### Testing
```bash
pnpm test              # Unit tests
pnpm test:e2e          # E2E with Playwright
pnpm test:visual       # Visual regression
```

### Package Publishing
```bash
pnpm changeset         # Create changeset
pnpm changeset version # Bump versions
cd pkg/ui && npm publish --access public
```

## Critical Build Process

**REGISTRY IS CORE** - Always build registry before app:

1. **Source**: Components in `app/registry/{style}/ui/`
2. **Build**: `pnpm build:registry` generates JSON
3. **Output**: `app/public/r/{style}/{name}.json`
4. **Usage**: CLI reads JSON to install components

**Build Order:**
```bash
pnpm build:registry  # MUST run first
pnpm build           # Then build app
```

## Component Architecture

### Three-Layer System

**1. Components** (`registry/{style}/ui/`)
- Single UI primitives (Button, Input, Card, Dialog)
- 150+ total components
- Two themes: default, new-york

**2. Examples** (`registry/{style}/example/`)
- Usage demonstrations
- Used in docs via `<ComponentPreview />`
- Pattern examples

**3. Blocks** (`registry/{style}/blocks/`)
- Viewport-sized sections (Hero, Dashboard, Login)
- 24+ production templates
- Compose multiple components
- NOT CLI-installable (documentation only)

### Standard Component Pattern

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
    defaultVariants: { variant: "default" }
  }
)

interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(componentVariants({ variant }), className)}
      {...props}
    />
  )
)
Component.displayName = "Component"

export { Component, componentVariants, type ComponentProps }
```

### Import Path Transformation

**In registry files:**
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
```

**After CLI installation** (paths rewritten):
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

## Package Exports (@hanzo/ui)

```typescript
// Main exports
import { Button, Card } from '@hanzo/ui'

// Component-specific
import { Button } from '@hanzo/ui/components'

// Blocks (documentation reference)
import { DashboardBlock } from '@hanzo/ui/blocks'

// Primitives (Radix UI re-exports)
import * as Dialog from '@hanzo/ui/primitives/dialog'

// Utilities
import { cn } from '@hanzo/ui/lib/utils'
```

## Adding a New Component

1. **Create files in BOTH themes:**
```bash
touch app/registry/default/ui/my-component.tsx
touch app/registry/new-york/ui/my-component.tsx
touch app/registry/default/example/my-component-demo.tsx
```

2. **Implement using standard pattern** (see above)

3. **Add documentation:**
```bash
touch app/content/docs/components/my-component.mdx
```

4. **Update navigation** in `app/config/docs.ts`

5. **Build registry:**
```bash
pnpm build:registry
```

6. **Test locally:**
```bash
pnpm dev
# Visit http://localhost:3003/docs/components/my-component
```

## Technology Stack

- **React**: 18.3.1 (19.1.0 experimental)
- **Next.js**: 15.3.1 with Turbopack
- **Styling**: Tailwind CSS 3.4.6-4.1.11, OKLCH colors
- **Components**: Radix UI primitives
- **Build**: Turborepo + pnpm workspaces
- **Docs**: Fumadocs (MDX)
- **Package Manager**: pnpm 9.0.6+

## Key Features

### Page Builder (`/builder`)
- Visual drag-drop block assembly
- 24+ viewport-sized blocks
- Export to React TSX
- Built with @dnd-kit

### White-Label System
- Zoo UI fork: `~/work/zoo/ui`
- Lux UI fork: `~/work/lux/ui`
- Config: `brands/{BRAND}.brand.ts`

### External Registries
- 35+ external component sources
- Config: `app/registries.json`
- Install: `npx @hanzo/ui add @aceternity/spotlight`

## Deployment

### GitHub Pages (ui.hanzo.ai)
```
Workflow: .github/workflows/deploy-pages.yml
Triggers: Push to main
Process:
  1. Build pkg/ui
  2. Build registry
  3. Build Next.js app (static export)
  4. Deploy to GitHub Pages
```

### Environment Variables
```bash
# Production
NEXT_PUBLIC_APP_URL=https://ui.hanzo.ai
GITHUB_ACTIONS=true

# Development
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

## Common Issues & Solutions

### Registry Not Found
❌ App build fails with registry errors
✅ Run `pnpm build:registry` before `pnpm build`

### Port Already In Use
❌ Port 3003 already taken
✅ Change port or `lsof -i :3003 && kill -9 PID`

### Type Errors After Changes
❌ TypeScript errors in registry
✅ Rebuild registry to regenerate types

### Package Not Publishing
❌ npm publish fails
✅ Must be in `pkg/ui`, version bumped

## Critical Patterns (AI Must Follow)

1. **Registry First**: Always build registry before app
2. **Two Themes**: default and new-york must stay in sync
3. **Import Paths**: Transform from `@/registry/` → `@/components/`
4. **Blocks vs Components**: Blocks are docs only, not CLI-installable
5. **Package Exports**: Multiple entry points for different needs

## Recent Updates (2025-10-05)

- ✅ Next.js 15.3.1 with Turbopack
- ✅ React 19 support (experimental)
- ✅ Fumadocs (replaced Contentlayer)
- ✅ @dnd-kit page builder
- ✅ Electric blue primary (210 100% 50%)
- ✅ Synced with shadcn/ui v3.4.0

## Component Status Tracking

### Current State
- **Implemented**: 150+ components (button, card, dialog, calendar, etc.)
- **Stub Components**: 63 need implementation (navigation bars, utilities)
- **Blocks**: 24+ viewport-sized templates

### High-Priority Missing Components
1. **combobox** - Search, filter, keyboard nav
2. **color-picker** - RGB, HSL, HEX, alpha
3. **dropzone** - File upload with drag-drop
4. **minimal-tiptap** - Rich text editor
5. **image-crop** - Cropping tool
6. **image-zoom** - Zoom/pan functionality

### Navigation Components (15 stubs)
All need extraction from blocks:
- advanced-navigation-bar
- ai-model-selector-navigation-bar
- breadcrumb-navigation-bar
- dashboard-navigation-bar
- e-commerce-navigation-bar
- (10 more variants...)

## Dependencies

### Installed
```json
{
  "@radix-ui/react-*": "latest",
  "class-variance-authority": "^0.7.1",
  "tailwind-merge": "^2.5.5",
  "react-day-picker": "^8.10.1",
  "lucide-react": "latest"
}
```

### Missing (Need to Add)
```json
{
  "@tanstack/react-table": "^8.20.5",
  "cmdk": "^0.2.1",
  "sonner": "^1.7.2",
  "react-dropzone": "^14.3.8",
  "react-colorful": "^5.6.1",
  "@tiptap/react": "^2.10.5",
  "framer-motion": "^11.15.0"
}
```

## Working with Forks

### Zoo UI (`~/work/zoo/ui`)
```bash
cd ~/work/zoo/ui
git remote add hanzo https://github.com/hanzoai/ui.git
git fetch hanzo main
git merge hanzo/main
```

### Lux UI (`~/work/lux/ui`)
Same sync pattern as Zoo UI.

## Context for All AI Assistants

This file (`LLM.md`) is symlinked as:
- `.AGENTS.md`
- `CLAUDE.md`
- `QWEN.md`
- `GEMINI.md`

All files reference the same knowledge base. Updates here propagate to all AI systems.

## Rules for AI Assistants

1. **ALWAYS** build registry before app build
2. **NEVER** commit symlinked files (.AGENTS.md, CLAUDE.md, etc.) - they're in .gitignore
3. **ALWAYS** update LLM.md with significant discoveries
4. **NEVER** create random summary files - update THIS file
5. **ALWAYS** use pnpm, not npm/yarn
6. **ALWAYS** check both theme variants (default, new-york)
7. **NEVER** confuse blocks with components (blocks are docs only)

## Testing Patterns

```bash
# Unit test single file
pnpm test path/to/test.spec.ts

# E2E single test
pnpm test:e2e tests/specific.spec.ts

# Watch mode
pnpm test:dev
```

## MDX Documentation

Available components in MDX:
```tsx
<ComponentPreview name="button-demo" />
<ComponentSource name="button" />
<CodeTabs>
<Steps>
<Callout>
```

## Git Status Context (2025-10-05)

Modified files from git status:
- `.github/workflows/ci.yml` - CI config
- `.gitignore` - Ignore patterns
- `LLM.md` - This file
- Multiple component files (3d-*, avatar-group, banner, etc.)
- Registry examples updated

Deleted:
- `CLAUDE.md` - Now symlinked to LLM.md

Untracked:
- `.github/workflows/coverage.yml` - New coverage workflow

Recent commits:
1. feat: Add floating paintbrush to theme generator
2. feat: Show block previews in page builder
3. fix: Add missing source.config.mjs
4. fix: Correct sidebar layout in compose editor

---

**Note**: This file serves as the single source of truth for all AI assistants working on this project. Keep it updated with architectural changes, new patterns, and critical insights.
