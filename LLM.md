# @hanzo/ui — LLM context

**What this is.** The React component library for AI applications: 161+
components, 24+ blocks, two themes, and a single typed import surface, all on ONE
substrate (`@hanzo/gui`) so the same import runs on web, native and desktop.
Published as `@hanzo/ui` (v8) on npm. Docs at https://ui.hanzo.ai. Dev port: 3003.

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
/dashboard /usage /gitops) · `app/registry/{default,new-york}/`
(component SOURCE OF TRUTH) · `pkgs/*` (auto-published `@hanzo/*` packages) ·
`packages/shadcn/` (CLI) · `app/content/docs/` (MDX docs). Publish = bump a
package `version` + merge to main (`.github/workflows/publish.yml`).

**Spec / more context.** Canonical SDK + docs model: `~/work/hanzo/SDK-ARCHITECTURE.md`.
Detailed engineering notes (build order, import surface, telemetry, upstream sync,
gotchas) follow below.

---

## v8 — the canonical `@hanzo/ui` (`pkg/ui`)

`@hanzo/ui@8` (`pkg/ui`) is THE Hanzo component library, and there is ONE
substrate: every component renders through `@hanzo/gui` (Tamagui) primitives on
the `@hanzo/tokens` scale, so one import works on web, native (expo) and desktop
(Tauri). The Radix + Tailwind surface it used to ship alongside is gone — it
lives on as its own package, `@hanzo/shadcn`, and `@hanzo/ui` no longer depends
on it, on any `@radix-ui/*` package, on cva, cmdk or sonner.

`@hanzo/ui-shadcn` (`pkgs/ui`, v5.x) is the legacy standalone package —
superseded, being retired.

### Layout

```
pkg/ui/src/
  core/            design core: cn.ts (clsx+tailwind-merge),
                   tokens.ts (re-export of @hanzo/tokens), fonts.ts (Geist vars)
  root.tsx         <Hanzo> — the root. Carries the gui config AND the stylesheet.
  gallery.tsx      EVERY component, once, in every variant. The one list.
  theme.css        SELF-CONTAINED token CSS vars + Geist Sans/Mono — the identity
  backends/gui/    THE component surface on @hanzo/gui. index.ts is its manifest.
  product/         the product/app layer (charts, PageHeader, ComboBox, …)
  models/          the unified ModelSelector + catalog helpers
  primitives/      GENERATED per-member entrypoints (scripts/gen-primitives.mjs)
  index.ts         root barrel = the component surface + cn
```

### Out of the box — the package carries its own config and its own CSS

```tsx
import { Hanzo, Button } from '@hanzo/ui'
<Hanzo><Button>Ship</Button></Hanzo>
```

That is the entire setup. No `gui.config.ts`, no CSS import, no generator script.
Three things used to be each app's job:

1. **The stylesheet.** gui compiles a style prop to an atomic class the first
   time something RENDERS it, so the sheet does not exist until a render has
   happened — which is why every app ran a `gen-gui-css.mjs` of its own. hanzo.app
   never did: it shipped 103 `_bg-` classes and 26 `_dsp-` classes against a
   stylesheet containing ZERO of either, every gui-styled element unstyled in
   production, green build throughout. The render happens at OUR publish time now
   (`scripts/gen-css.mjs` renders `src/gallery.tsx` in both themes and writes
   `dist/styles.css` — 381 KB, 35 KB gzipped, 340 atomic selectors), and
   `<Hanzo>` imports it. Styles gui generates at RUNTIME for props we could not
   know at publish time still reach the document through `insertStyleRules`;
   the shipped sheet is what makes the FIRST paint and every SSR/static render
   correct.

2. **The config.** `<Hanzo>` passes `config` from `gui-config.ts` to
   `GuiProvider` — as a VALUE, never a bare `import './gui-config'`. Vite 8
   (rolldown) ignores package.json `sideEffects` ARRAYS outright: with any array
   the registration is dropped and the first render dies on "Missing hanzogui
   config"; only `sideEffects: true` keeps it, and that costs +63% bundle
   (404 KB → 661 KB measured). Correctness does not live in bundler metadata.

3. **The theme.** gui throws `Missing theme.` for any component with no root
   theme context, so a root is structurally required — there is no version of
   this with no root at all. Forgetting `<Hanzo>` is therefore a hard crash on
   first paint, never a silently unstyled page.

`theme.css` is dark-first at `:root` (it used to claim dark-first while shipping
LIGHT at `:root`, so an app that mounted the dark default and read `--background`
got white). `.light` retunes, and both answer to gui's own `.t_light`/`.t_dark`
that `<Hanzo>` stamps on the body — one theme, named the same by the CSS custom
properties and the component tokens.

### Three tests, one list of components

`src/gallery.tsx` is the specification of "what this package has to style", and
all three layers render THAT — a second copy of the list is how a component gets
styled by one and missed by another.

| Layer | Command | What it catches |
|---|---|---|
| `src/styles.test.tsx` | `pnpm test:unit` | every atomic class the gallery renders vs every class `dist/styles.css` defines a rule for. Not "the intersection is large" — TOTAL. Catches a stale sheet. |
| `src/backends/gui/render.test.tsx` | `pnpm test:unit` | the surface mounts under the real provider; a component that throws on first paint fails. |
| `test/consumer.spec.ts` | `pnpm test:consumer` | packs the tarball, installs it into a temp app OUTSIDE the repo (never a workspace link — that hides `files`/`exports`/`workspace:*` defects), builds, serves, and asserts COMPUTED styles + screenshots at 390 and 1280 in both themes. |

The consumer spec also fails on a solid-white border (the `@hanzo/design`
`border-card: var(--white…)` defect — borders are low-alpha hairlines) and on any
element that has a text child and a zero-height box.

### House rules for a component

- Style through gui props and theme tokens (`$background`, `$color12`,
  `$borderColor`) — never a utility class string, never a hard-coded font.
- Touch targets meet the 44px floor via `hitSlop`, never via padding.
- Behaviour (focus, portalling, keyboard, a11y) comes from the matching
  `@hanzogui/*` primitive; nothing reimplements it.
- Free-form text children go through `ink()`; `data-slot` markers through
  `slot()`. One helper each, one place.
- Module scope stays side-effect free — `forwardRef`/`createContext` calls carry
  `/* @__PURE__ */` and nothing assigns `displayName`, so importing one symbol
  never drags a neighbour in. A one-symbol import bundles ~4.7KB against ~29KB
  for the whole barrel.

### Subpaths

| Subpath | What |
|---|---|
| `@hanzo/ui` | the component API: Button, Badge, Card*, Checkbox, Dialog*, DropdownMenu*, Input, Toaster, Avatar*, Tabs*, Select*, Tooltip*, Popover*, Command*, Collapsible*, Resizable*, ScrollArea, Slider, Switch, Progress, Separator, Label, Textarea, AspectRatio — + `cn` (the product layer is kept off root, at `/product`) |
| `@hanzo/ui/components` | alias of the root surface, for hosts that shim the package through a `declare module` |
| `@hanzo/ui/product` | the product/app layer: charts, metrics, PageHeader, StatusTag, EmptyState, ComboBox, SlideOver, Toast, Reorder, Field |
| `@hanzo/ui/models` | ModelSelector + fetchModelCatalog + catalog helpers |
| `@hanzo/ui/core` · `/tokens` | cn, Geist font vars, the @hanzo/tokens color/theme/radii/spacing scale |
| `@hanzo/ui/theme.css` | the design tokens alone (custom properties + Geist + touch/elevation) |
| `@hanzo/ui/styles.css` | the COMPLETE sheet — tokens + motion + the generated gui atomic/theme CSS. `<Hanzo>` imports it, so an app never has to |
| `@hanzo/ui/gallery` | every component, once — what the generator, the unit test and the consumer test all render |
| `@hanzo/ui/primitives/<Member>` | per-member entrypoints (for hosts that modularize `@hanzo/ui` imports) |
| `@hanzo/ui/data` | `@hanzo/data`: RecordsView, DataTable, typed field editors |
| `@hanzo/ui/{canvas,dashboard,usage,gitops}` | the optional-peer kits (each re-exports its home package) |

Everything ships COMPILED from `dist` — every `exports` target is a real file in
the tarball, including `theme.css` and all 90 `primitives/*` entrypoints.

### One DropdownMenu

There is one `DropdownMenu`, with one API. It is the compound surface (Trigger,
Content, Item, CheckboxItem, RadioItem, Label, Separator, Shortcut, Group,
Portal, Sub*, RadioGroup) AND it accepts the declarative `trigger` + `items`
spec, which it renders through those very same parts. `@hanzo/ui` and
`@hanzo/ui/product` export the same component; there is no second shape.

### modularizeImports support

`scripts/gen-primitives.mjs` reads the gui backend barrel and emits one
`src/primitives/<Member>.tsx` per exported value (re-export from the backend).
This makes `@hanzo/ui/primitives/Button` etc. resolve, so a host whose
`next.config` rewrites `@hanzo/ui` → `@hanzo/ui/primitives/{{member}}` works
unchanged. Re-run `pnpm gen:primitives` after changing the surface.

### Build — plain `tsc`, one file in, one file out

There is no bundler. `pnpm build` is two `tsc` passes, `scripts/postbuild.mjs`,
then `scripts/gen-css.mjs` (which renders the gallery through vite's SSR pipeline
to harvest `config.getCSS()` into `dist/styles.css` — the slow step, ~2 min):

| Pass | Config | Emits |
|---|---|---|
| ESM + types | `tsconfig.build.json` | `dist/**/*.js`, `.d.ts`, `.js.map`, `.d.ts.map` |
| CJS | `tsconfig.cjs.json` (`--noCheck`) | `dist-cjs/**/*.js`, folded into `dist/**/*.cjs` |

`postbuild.mjs` does the only two things `tsc` will not: it resolves every
relative specifier to a fully-specified path (`./button` → `./button.js`,
`./x` → `./x/index.js`; `.cjs` on the CJS half) so Node ESM and strict bundlers
resolve, and it prepends `'use client'` to every emitted module — the whole
library is client-side @hanzo/gui UI and Next's flight-client loader wants the
directive first. It is prepended without a newline so source-map lines hold.

The output is UNBUNDLED and mirrors `src/` one-for-one, so a consumer importing
one symbol pulls one module. A bundler here would be actively harmful: tsup's
code splitting emitted 11 shared `chunk-*.js`, and importing `Button` alone
dragged in `chunk-RCMDRI6V.js` (48K of source). Measured with esbuild, `import
{ Button } from '@hanzo/ui'` costs 4717 bytes bundled from tsup output vs 2021
from `tsc` output. Dropping `rollup-plugin-dts` (tsup's `dts` worker) is also
what makes the package build on TypeScript 7, which it cannot do otherwise.

Everything under `src/` is emitted, so every `exports` subpath resolves by
construction — no hand-maintained entry list to drift.

NOTE: `pkg/ui` (singular) sits OUTSIDE the `pkgs/*` pnpm workspace, installs
standalone, and publishes via the maintainer flow, not `publish.yml`. Because the
optional-peer kits (canvas/dashboard/gitops/usage) are not on the public
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

## How this ships

One way, and it runs on our own stack:

    push  ->  github.com/hanzoai/ui            (a mirror)
              .github/workflows/sync.yml        carries refs onward
      ->  git.hanzo.ai/hanzoai/ui               CANONICAL
              .hanzo/workflows/ci.yml           lint, typecheck, build, test
              .hanzo/workflows/registries.yml   the v4 registry check
              .hanzo/workflows/publish.yml      publishes every pkgs/* package
              .hanzo/workflows/deploy.yml       builds ghcr.io/hanzoai/ui
      ->  hanzoai/universe crs/ui.yaml          names the tag that is live
      ->  hanzoai/operator                      reconciles the App
      ->  hanzoai/static behind hanzoai/ingress serves ui.hanzo.ai

**git.hanzo.ai is canonical; GitHub is a mirror.** `.github/workflows/` holds
exactly one file, `sync.yml`, and its only job is getting refs to the forge. Every
build, check, publish and deploy is a workflow under `.hanzo/workflows/`, which the
forge reads. `.hanzo/workflows` uses GitHub Actions syntax, so a workflow moves
between the two by changing directory and nothing else.

No Vercel. `ci.yml` used to end in a `deploy-preview` job that ran `vercel deploy`
on every PR; previews come from our own stack or not at all, so that job is gone.
Its `status` job never depended on it.

## Publishing

One way: bump a package's `version` in its `package.json` and merge to `main`.
`.hanzo/workflows/publish.yml` detects the changed `@hanzo/*` package and publishes
it to npm (needs `NPM_TOKEN` as a forge secret). No changesets, no version-PR bot
— the semver bump is the trigger.

It is the SOLE publisher of every non-private `@hanzo/*` in `pkgs/*`, and it
mirrors the same tarball to `api.hanzo.ai/v1/packages/hanzo/npm` when
`HANZO_REGISTRY_TOKEN` is present. That mirror is best-effort by construction: no
token means a notice, not a failure, and npmjs stays authoritative either way.

## Deploying the site

`app/` is a Next.js static export (`output: "export"`, `trailingSlash: true`);
`pnpm build` there writes `app/out`, which `Dockerfile` copies into
`ghcr.io/hanzoai/static`. ui.hanzo.ai has been served that way since 2026-07-25 —
no Cloudflare, no GitHub Pages.

What was missing until now is the build. `crs/ui.yaml` is live and promoted, but no
workflow ever produced the image it pins: every tag up to `v5.7.6` was pushed by
hand. `.hanzo/workflows/deploy.yml` is that step. It publishes
`ghcr.io/hanzoai/ui:<sha>` and stops there — a build never deploys itself. A human
sets `spec.image.tag` in `hanzoai/universe`
`infra/k8s/operator/crs/ui.yaml`, which is the one live thing that says which build
serves.

Coverage lives in `ci.yml`'s `test` job, which runs `pnpm test:coverage` so the
lcov it uploads to Codecov actually exists. A separate `coverage.yml` used to run
the same suite a second time for the same upload plus a PR comment through the
GitHub API; one workflow does it now.

`registries.yml` keeps the `apps/v4` registry honest: reserved namespaces are
rejected and `pnpm --filter=v4 validate:registries` must pass. Its other job
labelled and commented on pull requests with the `gh` CLI against the GitHub API,
which does not exist on the forge, so that job did not come along.

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

There is NO third plane. Web analytics used to be one — `analytics.hanzo.ai/hz.js`
posting a bare JSON array of `{site, ts, type, …}` to a second collector behind an
identical path spelling — and 0.3.7 deleted both. `hz.js` now lives in this package
as the script-tag DISTRIBUTION of this client: same `WireEvent`, same
`{ batch: [ … ] }`, same `POST {host}/v1/event`. Point everything at the API host.

It could not authenticate until 0.3.12: it sent no `Authorization` and no
`?ingest_key=`, so a keyed static surface's writes were unattributed, the door
refused them (`401`), and nothing in the page said so. `data-ingest-key="pk-…"`.

Entries: `.` (framework-agnostic: `createAnalytics`, `EVENTS`, `GOALS`,
attribution + DSN/scrub helpers) and `./react` (`AnalyticsProvider`,
`useAnalytics`, `usePageview`, `ErrorBoundary`). Auto error capture
(window.onerror / unhandledrejection / React boundary) makes it the drop-in
error-tracking replacement. Secrets and PII are scrubbed client-side before an
error leaves the device. SSR-safe, fail-soft, beacon-on-unload.

Build is a tsup dual bundle: **CJS → `.cjs`, ESM → `.mjs`** (required under
`"type": "module"` — a CJS `.js` is parsed as ESM and crashes `require()` with
"exports is not defined"). Each `exports` condition carries its own types.

### Interaction analytics — `<Hanzo analytics>` is the one wiring

An app instruments nothing. `<Hanzo analytics>` (`pkg/ui/src/root.tsx`) is the
whole setup, and every click / change / submit / route change inside the tree
reaches `POST /v1/event` named by the component it happened on:

```tsx
<Hanzo analytics={{ product: 'console', ingestKey: process.env.NEXT_PUBLIC_EVENT_INGEST_KEY }}>
```

Four packages, one of each concern, no duplication:

| Concern | Where | Note |
|---|---|---|
| client + wire | `@hanzo/event` (`pkgs/event`) | one endpoint, one key |
| capture engine | `@hanzo/observe` (`pkgs/observe`) | delegated listeners, semantic annotation, redaction |
| provider + consent | `@hanzogui/telemetry` (`~/work/hanzo/gui`) | `<TelemetryProvider/>`; owns DNT/GPC + stored choice |
| curated events | `@hanzo/ui/product` `instrument.ts` | `emit({component, action})` — what autocapture cannot know |

**`analytics` is a prop, not a default.** Mounting a component library must not
start a network conversation the app did not ask for. Off, no provider renders.

**Component names are real in production.** Every primitive already carries a
`data-slot` (via `slot()`); `componentName()` in `pkgs/observe/src/annotate.ts`
reads it, ranked ABOVE the React fiber owner deliberately — the fiber name is
dev-only, so grouping on it silently empties the dashboard at deploy. Labels keep
the qualifier: `card/button[Save]`.

**It cannot double-count.** The engine installs *delegated* listeners on a root,
so two engines on one root report everything twice — which is what an app got by
mounting a library provider AND `<ObserveProvider/>`, both correct instructions.
Since observe 0.1.7 the first engine claims its root under a `Symbol.for`
registry (page-wide, so duplicate copies of the package still see each other) and
any later one stays inert (`engine.capturing === false`). Verified in Chromium,
not only in jsdom.

**Consent is decided in ONE layer.** The engine takes `enabled` as a value; the
provider resolves policy (GPC, DNT, stored `hz_consent`, build kill switch) and
passes the answer down. Do not add a second, partial copy to the engine — the two
then disagree about an explicit opt-in.

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
