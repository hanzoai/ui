# @hanzo/ui — LLM context

**What this is.** The React component library for AI applications: a shadcn/ui
fork with 161+ components, 24+ blocks, two themes, multi-framework output, and a
single typed import surface. Published as `@hanzo/ui` (v8) on npm. Docs at
https://ui.hanzo.ai. Dev port: 3003.

**Canonical role.** This is the canonical impl repo for Hanzo's web UI kit —
frontend components, not an SDK. It sits alongside the two SDK lines (full cloud
SDK generated from OpenAPI in `hanzo-<lang>/sdk` + wrapper in `hanzoai/<lang>-sdk`;
AI/agents lib `hanzo` in `hanzoai/python-sdk` flagship, `@hanzo/ai` in `hanzo-js/ai`).
`@hanzo/event` (telemetry, `POST /v1/event`) lives here in `pkgs/event`. DRY: one
impl, one place — link out, never duplicate.

**Brand rules (hard).**
- Never call Hanzo an "LLM gateway" or position it against LiteLLM — it is a full
  AI SDK / AI cloud, not a proxy. Purge that framing on sight.
- Paths are `/v1/…` only — never an `/api/` prefix.
- Zen models are our own family — never name upstream models.
- Voice: "Hanzo — the Open AI Cloud." Developer-first, crisp, no emoji-spam.

**Install / run.**
```bash
pnpm add @hanzo/ui         # consume
# dev:
pnpm install && pnpm build:registry && pnpm dev   # registry MUST build before app
```

**Key entry points.** `pkg/ui/` (core lib + v8 subpaths: /product /data /canvas
/wallet /network /billing /dashboard /usage /gitops) · `app/registry/{default,new-york}/`
(component SOURCE OF TRUTH) · `pkgs/*` (auto-published `@hanzo/*` packages) ·
`packages/shadcn/` (CLI) · `app/content/docs/` (MDX docs). Publish = bump a
package `version` + merge to main (`.github/workflows/publish.yml`).

**Spec / more context.** Canonical SDK + docs model: `~/work/hanzo/SDK-ARCHITECTURE.md`.
Detailed engineering notes (build order, import surface, telemetry, upstream sync,
gotchas) follow below.

---

## v8 — the one import surface (`@hanzo/ui@8`, `pkg/ui`)

`@hanzo/ui@8` (`pkg/ui`) is the cross-platform product/record layer on `@hanzo/gui`.
Every recent component kit is reachable from this single package as a thin subpath
that re-exports its home package (code lives once; each home is an OPTIONAL peer,
pulled only when the subpath is used):

| Subpath | Home | Components |
|---|---|---|
| `@hanzo/ui` · `/product` | (this) | charts, metrics, PageHeader, StatusTag, EmptyState, ComboBox, SlideOver, Toast, Reorder, Field |
| `@hanzo/ui/data` | `@hanzo/data` | RecordsView, DataTable, typed field editors |
| `@hanzo/ui/canvas` | `@hanzo/canvas` | ProjectCanvas, ServiceNode, DeployTimeline, EnvSwitcher, ServiceDetailDrawer, ServiceStatusBadge |
| `@hanzo/ui/wallet` | `@hanzo/ui-shadcn/wallet` | WalletMenu, injectedEvmAdapter (EIP-1193), walletAvailable, ensureEvmNetwork |
| `@hanzo/ui/network` | `@hanzo/ui-shadcn/network` | NetworkSwitcher, useNetwork, configureNetworks, HANZO_NETWORKS |
| `@hanzo/ui/billing` | `@hanzo/ui-shadcn/billing` | CreditModal |
| `@hanzo/ui/dashboard` | `@hanzo/dashboard` | landing + deploy-pipeline + overview kit |
| `@hanzo/ui/usage` | `@hanzo/usage` | UsageMeter, UsageProviderCard, UsageDashboard |
| `@hanzo/ui/gitops` | `@hanzo/gitops` | GitopsAppList, tree, diff, sync/rollback, HealthBadge |

The **8 newest kits** = canvas, wallet, network, billing, dashboard, usage, gitops,
data. Add one by mirroring `src/gitops.ts` (a one-line `export *`) + a `./name`
export + an optional peer/devDep. NOTE: `pkg/*` is a pnpm workspace member (for
`workspace:*` dev links), but `pkg/ui` publishes via the maintainer flow, not
`publish.yml` (which auto-publishes only `pkgs/*` on a version bump — see
PUBLISH_GUIDE.md). The shared shell lives here too: `AppHeader` + `BrandMark`
(@hanzo/logo) + `OrgSwitcher` + `orgScope` (the console org-scope contract,
hoisted per #36). Lux surfaces use `@luxfi/web3`
for wallet/login; `@hanzo/ui/wallet`+`/network` are the Hanzo-branded equivalents.

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

## Telemetry — `@hanzo/event` is the ONE client (`pkgs/event`)

`@hanzo/event` is the single canonical telemetry client for every Hanzo surface.
ONE API surface over **TWO** planes — the client never sends the org; the server
resolves the tenant.

1. **Event stream** — pageview/event/identify/group (and an error breadcrumb),
   batched to `POST {host}/v1/event` with `{ batch: [Event, …] }`
   `-> { accepted, dropped }`. Tenant from the session or a publishable `pk_` key.
2. **Error plane** — every captured exception is ALSO framed as a real **Sentry
   envelope** and POSTed to `POST {dsn.origin}/v1/sentry/{projectId}/envelope/?sentry_key=…`.
   This is the ONLY thing that reaches the Sentry error dashboard.

> **There is NO server-side fan-out from `/v1/event` into Sentry.** Versions
> ≤ 0.3.1 claimed there was ("lensed server-side into … error tracking"). There
> is not: cloud's handler folds the exception into `properties.$exception`,
> writes one row to the event warehouse (readable via `GET /v1/errors`), and
> stops. Because every property believed that claim, the whole fleet reported
> **zero** errors to Sentry until 0.3.2 added the envelope. Do not re-collapse
> these planes.

Configure the error plane with `dsn` (or `NEXT_PUBLIC_HANZO_EVENT_DSN`), minted
per property via `POST /v1/sentry/projects`. The DSN key is publishable and
write-only — safe in a bundle, same trust class as `pk_`. **No DSN => the error
plane is inert** (fail-safe: nothing sent, nothing thrown, event stream
unaffected); assert `client.errorPlaneEnabled` if you need to know.

Note that web analytics is a THIRD, separate plane and is NOT this client — it is
the `analytics.hanzo.ai/hz.js` tag, which speaks a different wire (a bare JSON
array of `{site, ts, type, …}`). `analytics.hanzo.ai/v1/event` and
`api.hanzo.ai/v1/event` share a path spelling but are different protocols; point
this client at the API host, never the analytics host.

Entries: `.` (framework-agnostic: `createAnalytics`, `EVENTS`, `GOALS`,
attribution + DSN/scrub helpers) and `./react` (`AnalyticsProvider`,
`useAnalytics`, `usePageview`, `ErrorBoundary`). Auto error capture
(window.onerror / unhandledrejection / React boundary) makes it the drop-in
error-tracking replacement. Secrets and PII are scrubbed client-side before an
error leaves the device. SSR-safe, fail-soft, beacon-on-unload.

Build is a tsup dual bundle: **CJS → `.cjs`, ESM → `.mjs`** (required under
`"type": "module"` — a CJS `.js` is parsed as ESM and crashes `require()` with
"exports is not defined"). Each `exports` condition carries its own types.

### One way — supersessions (no divergent telemetry client)

| Package | Status | Note |
|---|---|---|
| `@hanzo/event` | **canonical** | `pkgs/event`, posts `/v1/event` only |
| `@hanzo/capture` (npm) | **deprecated → `@hanzo/event`** | the old name of this package; `@hanzo/event` is a superset |
| `pkgs/capture` (`@hanzo/analytics@0.1.0` dup) | **deleted** | stale in-repo duplicate, removed |
| `hanzoai/analytics` `packages/event` (`@hanzo/event@0.2.0`) | **deleted** | An unpublished FORK of this package in another repo. It was the only copy that could actually reach Sentry, while the published one here could not — the fleet's error telemetry died in that gap. Its envelope + scrub implementation was merged here in 0.3.2. Never fork this package again; it publishes from `pkgs/event` only. |

## Three-Layer Architecture

1. **Components** (`registry/{style}/ui/`) — single primitives (Button, Card, Dialog). CLI-installable.
2. **Examples** (`registry/{style}/example/`) — usage demos for docs via `<ComponentPreview />`.
3. **Blocks** (`registry/{style}/blocks/`) — full-page sections (Dashboard, Login). NOT CLI-installable, docs only.

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

Remote `shadcn` points to a local clone of shadcn-ui/ui.
hanzoai/ui is NOT a GitHub fork — no shared object store, so large merges can fail on push.
Strategy: file-level checkout from shadcn/main for specific directories (not git merge).
- Take theirs: packages/shadcn/, packages/tests/, apps/, templates/, scripts/, skills/
- Keep ours: app/, pkg/, demo/, docs/, template/next/, pnpm-workspace.yaml, package.json
- Regenerate: pnpm-lock.yaml after sync

## Key Features

- **Page Builder** (`/builder`): drag-drop block assembly with @dnd-kit, export to TSX
- **White-Label**: Zoo/Lux forks via `brands/{BRAND}.brand.ts`
- **External Registries**: 35+ sources in `app/registries.json`, install via `npx @hanzo/ui add @aceternity/spotlight`

## Gotchas

- Registry index is `Index[style][name]`, NOT `Index[name]` — caused silent block render failures
- Shiki `getHighlighter` incompatible with static export — replaced with basic pre/code
- Some blocks (login-01, login-02, sidebar-02) have Server Component issues with event handlers
- `@hanzo/auth` v2.6.0 uses a pluggable provider registry: `registerAuthProvider('firebase', FirebaseAuthService)`

## Rules

1. Always build registry before app
2. Keep default and new-york themes in sync
3. Blocks are docs only, not CLI-installable
4. Use pnpm, not npm/yarn
5. Never commit symlinked files (AGENTS.md, CLAUDE.md, etc.)
6. Documentation goes in `app/content/docs/`, not random root MD files
