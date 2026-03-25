# Hanzo UI - LLM Context

## Overview

React component library (shadcn/ui fork). 161 components, 24+ blocks, two themes, multi-framework. Published as `@hanzo/ui` on npm.

**Docs**: https://ui.hanzo.ai | **Dev port**: 3003

## Repository Structure

```
ui/
  app/                   Hanzo documentation site (Next.js 15.3.1, React 19)
    registry/            Component registry (SOURCE OF TRUTH)
      default/ui/        150+ components
      default/example/   Usage demos
      default/blocks/    24+ full-page sections
      new-york/          Alternative theme
    content/docs/        MDX documentation
    scripts/             Build scripts
  apps/
    v4/                  Upstream shadcn v4 docs/registry app (port 4000)
  packages/
    shadcn/              shadcn CLI v4.1.0 (font system, chart colors, scaffold)
    tests/               Integration tests for shadcn CLI
    og/                  OG image generation (Hanzo-only)
  pkg/
    ui/                  Core library (npm)
    react/               React primitives
    brand/               Branding system
    commerce/            E-commerce components
    checkout/            Checkout flow
    shop/                Shop components
    agent-ui/            AI agent UI components
    gui/                 GUI component packages (@hanzogui/*)
    tokens/              Design tokens
  skills/
    shadcn/              AI skill definitions for shadcn CLI
  templates/             Project templates (next, vite, astro, react-router, start + monorepo variants)
  template/next/         Hanzo-customized Next.js template
```

## Critical: Build Order

**Registry MUST build before app.** The registry generates JSON that the CLI reads.

```bash
pnpm build:registry    # MUST run first
pnpm build             # Then build app
```

## Commands

```bash
pnpm dev               # Dev server (:3003)
pnpm build:registry    # Build component registry
pnpm build             # Build app
pnpm lint              # Lint all workspaces
pnpm typecheck         # Type checking
pnpm test              # Unit tests
pnpm test:e2e          # Playwright E2E
pnpm changeset         # Create changeset for publishing
```

## Three-Layer Architecture

1. **Components** (`registry/{style}/ui/`) -- Single primitives (Button, Card, Dialog). CLI-installable.
2. **Examples** (`registry/{style}/example/`) -- Usage demos for docs via `<ComponentPreview />`.
3. **Blocks** (`registry/{style}/blocks/`) -- Full-page sections (Dashboard, Login). NOT CLI-installable, docs only.

## Import Path Transformation

Registry files use `@/registry/default/ui/button`. After CLI install, rewritten to `@/components/ui/button`.

## Package Exports

```typescript
import { Button, Card } from '@hanzo/ui'
import { Button } from '@hanzo/ui/components'
import * as Dialog from '@hanzo/ui/primitives/dialog'
import { cn } from '@hanzo/ui/lib/utils'
```

## Adding a Component

1. Create in BOTH themes: `app/registry/{default,new-york}/ui/my-component.tsx`
2. Create example: `app/registry/default/example/my-component-demo.tsx`
3. Create docs: `app/content/docs/components/my-component.mdx`
4. Update nav: `app/config/docs.ts`
5. Build: `pnpm build:registry`

## Tech Stack

React 19, Next.js 15.3+, Tailwind CSS 4 (OKLCH colors), Radix UI, Turborepo + pnpm, Fumadocs (MDX), class-variance-authority.

## Upstream Sync

Remote `shadcn` points to `/Users/z/work/shadcn/ui` (local clone of shadcn-ui/ui).
hanzoai/ui is NOT a GitHub fork -- no shared object store, so large merges can fail on push.

Last sync: 2026-03-24 (shadcn@4.1.0, commit 8bec9c123)
Strategy: file-level checkout from shadcn/main for specific directories (not git merge).
- Take theirs: packages/shadcn/, packages/tests/, apps/, templates/, scripts/, skills/
- Keep ours: app/, pkg/, demo/, docs/, template/next/, pnpm-workspace.yaml, package.json
- Remove: deprecated/ (upstream deleted it)
- Regenerate: pnpm-lock.yaml after sync

## Key Features

- **Page Builder** (`/builder`): Drag-drop block assembly with @dnd-kit, export to TSX
- **White-Label**: Zoo/Lux forks via `brands/{BRAND}.brand.ts`
- **External Registries**: 35+ sources in `app/registries.json`, install via `npx @hanzo/ui add @aceternity/spotlight`

## Gotchas

- Registry index is `Index[style][name]`, NOT `Index[name]` -- caused silent block render failures
- Shiki `getHighlighter` incompatible with static export -- replaced with basic pre/code
- Some blocks (login-01, login-02, sidebar-02) have Server Component issues with event handlers
- Zod validation removed from `_getAllBlocks()`/`_getBlockCode()` -- we control generation
- Firebase split to optional `@hanzo/auth-firebase` package (Jan 2025)
- `@hanzo/auth` v2.6.0 uses pluggable provider registry: `registerAuthProvider('firebase', FirebaseAuthService)`

## Component Stats

- 161 total files, ~127 implemented, ~34 stubs
- Unique: 9 3D components, 12 AI components, 13 animation components, 15 nav variants
- 3x more components than upstream shadcn/ui (161 vs 58)
- shadcn CLI: v4.1.0 with font transformers, chart color picker, scaffold from github

## Rules

1. Always build registry before app
2. Keep default and new-york themes in sync
3. Blocks are docs only, not CLI-installable
4. Use pnpm, not npm/yarn
5. Never commit symlinked files (AGENTS.md, CLAUDE.md, etc.)
6. Documentation goes in `app/content/docs/`, not random root MD files
