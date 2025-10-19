# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **Hanzo UI App** - the documentation and showcase site for the @hanzo/ui component library. It's built with Next.js 15.3.1, React 19, and Fumadocs for documentation. The site serves as both documentation and a living demo of 149+ components.

**Key URLs:**
- Production: https://ui.hanzo.ai
- Local Dev: http://localhost:3003
- Repo: github.com/hanzoai/ui (monorepo root is parent directory)

## Essential Commands

### Development
```bash
# Start dev server (port 3003)
pnpm dev

# Build site (includes registry build + Next.js build)
pnpm build

# Build registry only (generates JSON files for CLI)
pnpm registry:build

# Start production server (port 3001)
pnpm start
```

### Code Quality
```bash
# Lint
pnpm lint
pnpm lint:fix

# Type check
pnpm typecheck

# Format
pnpm format:write
pnpm format:check
```

### Registry Management
```bash
# Validate external registries
pnpm validate:registries

# Capture screenshots (for component previews)
pnpm registry:capture
```

## Architecture Overview

### Three-Layer System

**1. Components** (`/registry/{default,new-york}/ui/`)
- Single UI elements (Button, Input, Card, Dialog)
- Reusable primitives that compose into larger UIs
- Two theme variants: default and new-york
- 149 components total (115 implemented, 34 stubs)

**2. Examples** (`/registry/{default,new-york}/example/`)
- Usage demonstrations for each component
- Shows component in isolation with typical props
- Used in documentation via `<ComponentPreview name="..." />`

**3. Blocks** (`/registry/{default,new-york}/blocks/`)
- Viewport-sized sections (Dashboard, Hero, Login, Pricing)
- Compose multiple components into full-page layouts
- Production-ready templates users can copy
- 24+ blocks including dashboard-01, sidebar-07, login-03

### Registry Build System

The registry is the **core of the component distribution system**:

1. **Source Files**: Components in `/registry/{style}/ui/`
2. **Build Script**: `scripts/build-registry.mts` reads components and generates:
   - JSON metadata files in `/public/registry/styles/{style}/{name}.json`
   - Includes dependencies, files, type info
3. **CLI Consumption**: The `@hanzo/ui` CLI reads these JSON files to install components
4. **Documentation**: MDX files in `/content/docs/components/` reference the registry

**CRITICAL**: Always run `pnpm registry:build` before building the app if you modify components.

### Documentation System

- **Framework**: Fumadocs (replaced Contentlayer in v4 migration)
- **MDX Files**: `/content/docs/` contains all documentation
- **Components in MDX**: Special components available in MDX via `mdx-components.tsx`:
  - `<ComponentPreview name="..." />` - Live component demo
  - `<ComponentSource name="..." />` - Component source code
  - `<CodeTabs>` - Installation method tabs (CLI/Manual)
  - `<Steps>` - Step-by-step instructions
- **Navigation**: Configured in `/config/docs.ts`

### Page Builder (`/builder`)

New drag-drop visual builder for assembling pages from blocks:
- **Left Sidebar**: Filterable block library
- **Canvas**: Drag-drop assembly area with reordering
- **Export**: Generates React TSX code
- **Tech**: @dnd-kit for drag-drop, SortableContext for reordering

Access at `/builder` route.

## Key File Locations

### Component Development
```
registry/default/ui/{component}.tsx          # Component implementation
registry/default/example/{component}-demo.tsx # Usage example
content/docs/components/{component}.mdx       # Documentation
```

### Configuration
```
config/site.ts        # Site metadata, links
config/docs.ts        # Documentation navigation structure
tailwind.config.cjs   # Tailwind configuration
components.json       # hanzo CLI configuration
```

### Build & Scripts
```
scripts/build-registry.mts      # Registry JSON generator
scripts/validate-registries.mts # External registry validator
__registry__/index.tsx          # Auto-generated registry index
```

## Component Creation Workflow

### 1. Create Component Files
```bash
# Create in both variants
touch registry/default/ui/my-component.tsx
touch registry/new-york/ui/my-component.tsx

# Create demo
touch registry/default/example/my-component-demo.tsx
```

### 2. Implement Component
Follow the standard pattern:
```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline"
}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("base-classes", className)}
        {...props}
      />
    )
  }
)
MyComponent.displayName = "MyComponent"

export { MyComponent }
```

### 3. Create Documentation
```bash
# Create MDX file
touch content/docs/components/my-component.mdx
```

Include:
- `<ComponentPreview name="my-component-demo" />`
- Installation instructions with `<CodeTabs>`
- Usage examples
- API table with props

### 4. Add to Navigation
Edit `config/docs.ts` to add component to sidebar navigation.

### 5. Build Registry
```bash
pnpm registry:build
```

### 6. Test
```bash
pnpm dev
# Visit http://localhost:3003/docs/components/my-component
```

## Registry Architecture

The registry system enables the `npx hanzo-ui@latest add {component}` CLI workflow:

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

**External Registries** (`registries.json`):
- 35+ external component sources
- Examples: @aceternity, @magicui, @hanzo-editor
- Validated via `pnpm validate:registries`

## Theme System

**CSS Variables** (`/styles/globals.css`):
- Base theme colors defined in HSL
- Primary color: `210 100% 50%` (electric blue)
- Dark mode via `.dark` class
- All components use `hsl(var(--primary))` pattern

**Two Visual Styles:**
- **default**: More rounded, softer shadows
- **new-york**: Flatter, sharper, minimal

Both styles share the same component API, only visual styling differs.

## Build System

### Production Build Process
1. `pnpm registry:build` - Generate registry JSON files
2. `next build` - Build Next.js app
3. Static export to `/out` directory for GitHub Pages

### Local Development
- Uses Turbopack for fast HMR
- Port 3003 (configurable)
- MDX hot reload via Fumadocs

## Component vs Block Distinction

**Components** (149 total):
- Single-purpose UI elements
- Examples: Button, Input, Card, Dialog, Dropdown
- Used as building blocks
- Installed individually via CLI

**Blocks** (24+ available):
- Full viewport sections
- Examples: dashboard-01 (admin layout), login-03 (auth page), sidebar-07
- Compose multiple components
- Ready-to-use page sections
- Users copy entire blocks, not install via CLI

## Import Patterns

Components can be imported three ways:

**1. Package Import** (if using @hanzo/ui package):
```tsx
import { Button, Card } from "@hanzo/ui"
```

**2. Registry Import** (in documentation/examples):
```tsx
import { Button } from "@/registry/default/ui/button"
```

**3. Local Import** (after installing via CLI):
```tsx
import { Button } from "@/components/ui/button"
```

The registry uses `@/registry/{style}/` which gets rewritten to `@/components/` during installation.

## MDX Component System

Components available in all MDX files:

- `<ComponentPreview name="button-demo" />` - Live demo
- `<ComponentSource name="button" />` - Source code display
- `<ComponentExample>` - Example wrapper
- `<CodeTabs>` - Installation tabs (requires useConfig hook)
- `<Steps>` / `<Step>` - Step-by-step instructions
- `<Tabs>` / `<TabsList>` / `<TabsTrigger>` / `<TabsContent>` - Content tabs
- `<Callout>` - Info/warning callouts

## Testing

No formal test suite currently. Testing is done via:
1. Local dev server visual testing
2. Build process catches type errors
3. Registry validation ensures component metadata is correct

## Deployment

**GitHub Pages** (automatic):
- Workflow: `.github/workflows/deploy-gh-pages.yml`
- Triggers on push to main
- Builds app + pkg/ui package
- Deploys to ui.hanzo.ai
- Requires: npm-run-all, del-cli for dependency builds

**Important**: The GitHub Actions workflow builds the `pkg/ui` package first, then the app, to ensure registry has latest component code.

## Common Patterns

### Stub Components
Components marked for future implementation:
```tsx
export default function Component() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">Component coming soon</p>
    </div>
  )
}
```

Currently 34 stubs remaining (documented but not implemented).

### Component Dependencies
- Radix UI primitives for accessible base components
- `cn()` utility from `@/lib/utils` for className merging
- `cva` (class-variance-authority) for variant management
- Lucide React for icons
- Framer Motion for animations (some components)

### Registry Dependencies
Components can depend on other registry components:
```json
{
  "registryDependencies": ["button", "dialog", "utils"]
}
```

These are auto-installed when user adds the component.

## Recent Architectural Changes (2025-10-05)

1. **Migrated from Contentlayer to Fumadocs** for MDX processing
2. **Upgraded to Next.js 15.3.1** with Turbopack
3. **React 19** with new JSX transform
4. **Added @dnd-kit** for page builder drag-drop
5. **Synced with hanzo/ui v3.4.0** (7 new components: button-group, empty, field, input-group, item, kbd, spinner)
6. **Electric blue primary color** (210 100% 50%)
7. **Page builder feature** at `/builder` route

## Notes for AI Assistants

- **Registry must rebuild** after component changes: `pnpm registry:build`
- **Two theme variants** must be kept in sync: default and new-york
- **Import paths** in components use `@/registry/{style}/` which becomes `@/components/` after CLI install
- **MDX components** are defined in `mdx-components.tsx`, not auto-imported
- **Blocks are different** from components - they're full-page sections, not installable via CLI
- **GitHub Pages deployment** requires building pkg/ui package first (workflow handles this)
