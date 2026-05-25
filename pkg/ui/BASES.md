# Bases — framework-specific subpath exports

`@hanzo/ui` is a brand-neutral umbrella that re-exports framework-specific component bases. Consumers pick a base; the import path stays stable across stack swaps.

## Subpaths

| Subpath | Base | Source of truth | Status |
|---|---|---|---|
| `@hanzo/ui/primitives/bases/admin` | Hanzo GUI v7 admin chrome (Sidebar, TopBar, AdminApp, PageShell, primitives, IAM pages, data hooks) | `@hanzogui/admin` (`~/work/hanzo/gui/pkgs/ui-admin/`) | canonical |
| `@hanzo/ui/primitives/bases/gui` | Hanzo GUI v7 base primitives umbrella (XStack, YStack, Text, Input, Button, etc.) | `hanzogui` (`~/work/hanzo/gui/pkgs/ui/hanzogui/`) | canonical |
| `@hanzo/ui` (root) | shadcn/ui React + Radix + Tailwind component registry | `~/work/hanzo/ui/app/registry/default/ui/` | existing |
| `@hanzo/ui/primitives/bases/svelte` | Svelte adapter | not yet authored | placeholder, throws on import |
| `@hanzo/ui/primitives/bases/vue` | Vue adapter | not yet authored | placeholder, throws on import |

## Default

The canonical Hanzo stack for new product surfaces is **Hanzo GUI v7 via `@hanzo/ui/primitives/bases/admin`**. Use that for anything that needs the shared admin chrome (Sidebar/TopBar/PageShell, shared IAM pages, data hooks, brand-neutral primitives).

The shadcn+Radix root export (`@hanzo/ui`) is the existing 161-component shadcn fork — kept for surfaces that haven't migrated and for consumers who prefer Tailwind+Radix.

## Usage

```ts
import { AdminApp, Sidebar, TopBar, DataTable, Badge } from '@hanzo/ui/primitives/bases/admin'
import { XStack, YStack, Text, Button, Input } from '@hanzo/ui/primitives/bases/gui'
```

Tomorrow, if a Svelte port lands, the same consumers swap one import line:

```ts
import { AdminApp, Sidebar, TopBar, DataTable, Badge } from '@hanzo/ui/primitives/bases/svelte'
```

Component names stay identical across bases by contract.

## Adding a new base

1. Author the framework port at `~/work/hanzo/gui/pkgs/ui-admin-<framework>/` exporting the same component names with the same API.
2. Wire its package as a peer-dep in `@hanzo/ui` `package.json`.
3. Update the matching `src/primitives/bases/<framework>/index.ts` to re-export from it.
4. Update this doc's status table.

Throwing placeholder files for `svelte` and `vue` exist so callers see a clear runtime error when they import an unauthored base — no silent missing-component bugs.

## Why pass through `@hanzo/ui` instead of importing directly

1. **Stable import path** — when the canonical base swaps (Hanzo GUI v7 → v8, or React → Svelte for a given app), consumer imports don't move.
2. **One umbrella to depend on** — consumers add `@hanzo/ui` as one peer dep, and pick which bases they need at the subpath level. Tree-shaking does the rest.

The authoritative source files still live in `~/work/hanzo/gui/`. `@hanzo/ui` does not re-implement them.

## Brand layer

Each consumer applies its own brand at the theme/token layer:
- `@hanzo/tasks` (the SPA at `~/work/hanzo/gui/apps/admin-tasks/`) → Hanzo brand
- `~/work/liquidity/superadmin` → Liquidity brand (separate repo, separate registry)
- `@hanzo/ui` bases ship brand-neutral — never include a `<HanzoMark/>` in the bases themselves.

See `~/work/hanzo/HANZO_BINARY.md` for the Go binary architecture (one binary + go:embed UI) that consumes these bases.
