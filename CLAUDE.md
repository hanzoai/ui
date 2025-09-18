# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the Hanzo UI monorepo - a comprehensive React component library built on shadcn/ui v4 with Hanzo branding. It provides 50+ accessible, customizable components with a sophisticated build system and multiple deployment targets.

## Key Commands

### Development
```bash
# Start main documentation site (port 3333)
pnpm www:dev

# Start v4 component registry (port 4000)
pnpm v4:dev

# Start main app with Turbopack (port 3003)
cd app && npm run dev --turbopack

# Run all development servers
make dev
```

### Building & Testing
```bash
# Build everything
make build
pnpm build

# Build registry (required before building apps)
pnpm build:registry
cd apps/www && pnpm registry:build

# Run tests
pnpm test
pnpm test:dev  # Watch mode

# Run single test
pnpm test path/to/test.spec.ts
```

### Linting & Formatting
```bash
# Lint all workspaces
pnpm lint
make lint

# Format code
pnpm format
make format

# Type checking
pnpm typecheck
make typecheck
```

### CLI Development
```bash
# Test CLI locally
pnpm shadcn --help
pnpm shadcn add button

# CLI development mode
cd packages/shadcn && pnpm dev
```

### Package Publishing
```bash
# Create changeset
pnpm changeset

# Version packages
pnpm changeset version

# Publish to npm
make publish
```

## Architecture & Structure

### Monorepo Layout
- **apps/www**: Main documentation site (Next.js 14.3.0-canary.43, port 3333)
- **apps/v4**: Component registry/playground (Next.js 15.3.1 with React 19, port 4000)
- **packages/shadcn**: CLI tool for component installation (v3.3.1)
- **pkg/ui**: Core UI library (@hanzo/ui v4.5.6)
- **app/**: Main demo application with all components

### Component Registry System

The registry is the core of the component system:

1. **Registry Structure**:
   - `apps/www/registry/default/ui/` - Default theme components
   - `apps/www/registry/new-york/ui/` - New York theme variant
   - `apps/www/public/r/` - Built JSON registry files

2. **Registry Build Process**:
   ```bash
   # Build registry files (must run before app build)
   cd apps/www
   tsx scripts/build-registry.mts
   ```

3. **External Registries**: Supports 35+ external registries configured in `registries.json`

### Package Exports

The `pkg/ui` package provides multiple export paths:
- `@hanzo/ui` - Top-level exports with cn utility
- `@hanzo/ui/components` - All components
- `@hanzo/ui/blocks` - UI patterns
- `@hanzo/ui/primitives` - Base primitives
- `@hanzo/ui/lib/utils` - Utilities including cn()

### Deployment Targets

1. **GitHub Pages** (ui.hanzo.ai):
   - Workflow: `.github/workflows/deploy-pages.yml`
   - Static export with Next.js
   - Automatic deployment on main push

2. **Forked Repositories** (Zoo, Lux):
   - Zoo UI: `~/work/zoo/ui`
   - Lux UI: `~/work/lux/ui`
   - Sync with: `git fetch hanzo main && git merge hanzo/main`

## Critical Configuration

### Environment Variables
```bash
# For GitHub Pages deployment
NEXT_PUBLIC_APP_URL=https://ui.hanzo.ai
GITHUB_ACTIONS=true  # Enables static export

# For local development
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### Build Dependencies
- The registry MUST be built before building apps
- Apps depend on registry JSON files in `public/r/`
- Use Turbo for coordinated builds: `pnpm build`

### Model Context Protocol (MCP)
The CLI includes an MCP server for AI assistance:
```bash
# Start MCP server
pnpm shadcn serve

# Available tools: list_components, get_component, add_component, search_registry
```

## White-Label System

The repository includes a white-label system for creating branded forks:

1. **Brand Configuration**: Edit `brand.config.ts`
2. **Update Package Names**: Search/replace @hanzo with your scope
3. **Sync Updates**: Pull from upstream hanzo/main regularly

## Common Workflows

### Adding New Components
1. Create component in `apps/www/registry/default/ui/`
2. Add example in `apps/www/registry/default/example/`
3. Update registry configuration
4. Run `pnpm build:registry`
5. Test with CLI: `pnpm shadcn add [component]`

### Updating from Upstream shadcn/ui
```bash
git remote add upstream https://github.com/shadcn-ui/ui.git
git fetch upstream
git merge upstream/main
# Resolve conflicts, preserve Hanzo branding
```

### Running Specific App Builds
```bash
# Build www only
pnpm --filter=www build

# Build v4 only
pnpm --filter=v4 build

# Build CLI only
pnpm --filter=shadcn build
```

## Technical Stack

- **React**: 18.3.1 (www) / 19.1.0 (v4)
- **Next.js**: 14.3.0-canary.43 (www) / 15.3.1 (v4)
- **Tailwind CSS**: 3.4.6-4.1.11 with OKLCH colors
- **Build System**: Turborepo + pnpm workspaces
- **Component Base**: Radix UI primitives
- **Documentation**: Contentlayer2 (www) / Fumadocs (v4)

## Important Notes

- Components use `@/lib/utils` imports that must be aliased correctly
- The cn() utility is essential for component styling
- Registry files are gitignored but required for builds
- Use pnpm 9.0.6+ for workspace compatibility
- The v4 app uses React 19 with experimental features