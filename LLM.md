# Hanzo UI - LLM Context

## Overview

React component library (shadcn/ui fork). 161 components, 24+ blocks, two themes, multi-framework. Published as `@hanzo/ui` on npm.

**Docs**: https://ui.hanzo.ai | **Dev port**: 3003

## v8 — the canonical, backend-flexible `@hanzo/ui` (`pkg/ui`)

`@hanzo/ui@8` (`pkg/ui`) is THE Hanzo component library: one design core, many
rendering backends. It is `@hanzo/gui` + `@hanzo/tokens` based, and its ROOT
barrel exposes the **shadcn-compatible component API** apps import (so consumers
drop the old `@hanzo/ui-shadcn` alias and point `@hanzo/ui` here with zero import
churn). `@hanzo/ui-shadcn` (`pkgs/ui`, v5.x) is the legacy standalone shadcn
package — superseded by this.

### Layout (backend-flexible)

```
pkg/ui/src/
  core/            design core (backend-agnostic): cn.ts (clsx+tailwind-merge),
                   tokens.ts (re-export of @hanzo/tokens), fonts.ts (Geist vars)
  theme.css        SELF-CONTAINED standard-token CSS vars (Hanzo dark-first,
                   sourced from @hanzo/tokens) + Geist Sans/Mono — the identity
  backends/
    shadcn/        Radix + Tailwind — the shadcn-compatible web API (root default)
    gui/           @hanzo/gui (Tamagui) product layer — web + native + desktop
    README.md      backend contract + how to add one (svelte/solid/…)
  models/          the unified ModelSelector + catalog helpers
  primitives/      GENERATED per-member entrypoints (see scripts/gen-primitives.mjs)
  index.ts         root barrel = shadcn API + product layer + tokens
```

Add a backend under `src/backends/<name>/` (same tokens, different substrate) +
a `./<name>` export. The two that exist are `shadcn` and `gui`.

### Token-bug fix (the point of the rework)

The old shadcn components reached for app-private token names — `bg-bg-dark`,
`bg-bg-secondary`, `text-text-secondary`, `bg-divider`, `bg-brand`, `bg-level-2`,
hard-coded `bg-gray-*` — that consumers never defined, so surfaces rendered
transparent. Every component here uses ONLY standard design tokens
(`bg-popover`, `border-border`, `bg-primary`, `text-muted-foreground`, …) and no
hard-coded font (UI inherits Geist Sans, code Geist Mono; portaled surfaces bind
`font-sans`). `theme.css` defines every token, so the package is self-contained.

### Subpaths

| Subpath | What |
|---|---|
| `@hanzo/ui` | the component API (shadcn backend, the default): Button, Badge, Card*, Checkbox, Dialog*, DropdownMenu*, Input, Toaster, Avatar*, Tabs*, Select*, Tooltip*, Popover*, Command*, Collapsible*, ScrollArea, Slider, Switch, Progress, Separator, Label, Textarea, AspectRatio — + `cn` + tokens (the gui product layer is kept off root, at `/product`, so web consumers never pull the native runtime) |
| `@hanzo/ui/shadcn` | the shadcn backend barrel (explicit) |
| `@hanzo/ui/gui` · `/product` | the @hanzo/gui product layer: charts, metrics, PageHeader, StatusTag, EmptyState, ComboBox, SlideOver, Toast, Reorder, Field |
| `@hanzo/ui/models` | ModelSelector + fetchModelCatalog + catalog helpers |
| `@hanzo/ui/core` · `/tokens` | cn, Geist font vars, the @hanzo/tokens color/theme/radii/spacing scale |
| `@hanzo/ui/theme.css` | the self-contained Hanzo identity stylesheet |
| `@hanzo/ui/primitives/<Member>` | per-member entrypoints (for hosts that modularize `@hanzo/ui` imports) |
| `@hanzo/ui/data` | `@hanzo/data`: RecordsView, DataTable, typed field editors |
| `@hanzo/ui/{canvas,wallet,network,billing,dashboard,usage,gitops}` | the optional-peer kits (unchanged; each re-exports its home package) |

### modularizeImports support

`scripts/gen-primitives.mjs` reads the shadcn barrel and emits one
`src/primitives/<Member>.tsx` per exported value (re-export from the backend).
This makes `@hanzo/ui/primitives/Button` etc. resolve, so a host whose
`next.config` rewrites `@hanzo/ui` → `@hanzo/ui/primitives/{{member}}` works
unchanged. Re-run `pnpm gen:primitives` after changing the surface.

NOTE: `pkg/ui` (singular) sits OUTSIDE the `pkgs/*` pnpm workspace, installs
standalone, and publishes via the maintainer flow, not `publish.yml`. Because the
optional-peer kits (canvas/dashboard/gitops/ui-shadcn/usage) are not on the public
registry, a standalone install must skip auto-installing peers. `.npmrc` and
`pnpm-lock.yaml` are gitignored here, so create the `.npmrc` once:

```bash
cd pkg/ui
printf 'auto-install-peers=false\nstrict-peer-dependencies=false\n' > .npmrc
pnpm install --ignore-workspace     # component-surface deps (radix, cmdk, sonner, …) + @hanzo/tokens
pnpm gen:primitives                 # refresh the per-member entrypoints
pnpm typecheck:ui                   # scoped typecheck of the component surface (green)
```

`@hanzo/tokens` (`pkgs/tokens`) must be built first (`pnpm --filter @hanzo/tokens build`)
so the `file:` link resolves. The scoped `typecheck:ui` excludes the optional-peer
subpaths, whose homes aren't installed standalone.

The **kits** = canvas, wallet, network, billing, dashboard, usage, gitops, data.
Add one by mirroring `src/gitops.ts` (a one-line `export *`) + a `./name` export
+ an optional peer/devDep. `pkg/*` is a pnpm workspace member (for `workspace:*`
dev links), but `pkg/ui` publishes via the maintainer flow, not `publish.yml`
(which auto-publishes only `pkgs/*` on a version bump — see PUBLISH_GUIDE.md). The
shared shell lives here too: `AppHeader` + `BrandMark` (@hanzo/logo) +
`OrgSwitcher` + `orgScope` (the console org-scope contract, hoisted per #36). Lux
surfaces use `@luxfi/web3` for wallet/login; `@hanzo/ui/wallet`+`/network` are the
Hanzo-branded equivalents.

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
```

## Publishing

One way: bump a package's `version` in its `package.json` and merge to `main`.
`.github/workflows/publish.yml` detects the changed `@hanzo/*` package and
publishes it to npm (needs the repo `NPM_TOKEN` secret). No changesets, no
version-PR bot — the semver bump is the trigger.

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
