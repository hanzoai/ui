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
pnpm install && pnpm --filter @hanzo/ui... build
```

**Key entry points.** `pkg/ui/` (core lib + v8 subpaths: /product /data /canvas
/dashboard /usage /gitops) · `pkgs/*` (auto-published `@hanzo/*` packages) ·
`apps/cd` (the @hanzo/cd demo). Publish = bump a package `version` + merge to
main (`.hanzo/workflows/publish.yml`).

**What is NOT here.** Everything shadcn-lineage lives in **`hanzoai/shadcn`**:
the `shadcn` CLI, the component registry (`app/registry/**`, `apps/v4/registry/**`),
both docs sites, the `templates/*` scaffolds, and the docs-site e2e suite.
ui.hanzo.ai is built and deployed from there. This repo is `@hanzo/ui@8` on
`@hanzo/gui` plus the `@hanzo/*` family, and nothing else — no Tailwind, no
Radix, no registry.

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
                   tokens.ts (re-export of @hanzo/tokens), fonts.ts (Zen vars)
  root.tsx         <Hanzo> — the root. Carries the gui config AND the stylesheet.
  gallery.tsx      EVERY component, once, in every variant. The one list.
  theme.css        SELF-CONTAINED token CSS vars + Zen / Zen Mono — the identity
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
   `dist/styles.css` — 362 KB, 71 KB gzipped, 611 atomic selectors, plus
   react-native-web's own sheet, which is 13 KB of that and is not gui's to
   generate), and
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
| `src/styles.test.tsx` | `pnpm test:unit` | every class the gallery renders — gui's `_…` AND react-native-web's `r-…`/`css-…` — vs every class `dist/styles.css` defines a rule for. Not "the intersection is large" — TOTAL. Catches a stale sheet. |
| `src/backends/gui/render.test.tsx` | `pnpm test:unit` | the surface mounts under the real provider; a component that throws on first paint fails. |
| `test/consumer.spec.ts` | `pnpm test:consumer` | packs the tarball, installs it into a temp app OUTSIDE the repo (never a workspace link — that hides `files`/`exports`/`workspace:*` defects), builds, serves, and asserts COMPUTED styles + screenshots at 390 and 1280 in both themes. |
| `test/stress.tsx` | `pnpm test:contain` | every shell given LESS room than its content: what escapes, what is merely clipped, and what actually scrolls. Mounts in a browser, and checks the stylesheets arrived before it believes a box. |

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
- Utility classes carry `hz-`, and **as of 8.3.0 that is the only spelling**.
  This sheet claimed twelve bare names at the document level — `collapse`, `drag`,
  `fade`, `fade-up`, `menu-in`, `mono`, `paper`, `row`, `row-in`, `skeleton`,
  `slide`, `tnum` — in a package an app imports once at its root; an app with its
  own `.row` got no warning, it got whichever rule the cascade preferred. Each was
  a second selector on a rule the `hz-` form already carried, so removing them
  changed 21 selectors and no declarations.
  Nothing here emitted them — `styles.test.tsx` scans every `className=` literal in
  `src/` and fails on an unprefixed one, which is why this was a promise to
  outside callers rather than a migration of our own. Two earlier releases named
  themselves as the one that would do it and shipped carrying them anyway; a
  removal scheduled in prose is not scheduled. `glass`/`elevation-N` are the one
  family still bare: they are an API VALUE (`glass(3).className`), not a typed
  literal, so they move on their own change.
- A prop must actually arrive. gui is not the DOM, and two measured cases prove
  it in both directions: **`name` is gui's OWN prop** (it names a styled component
  and a theme) and is consumed before it reaches the element, so a `name` on a
  field type-checks and renders nothing; and gui **drops `secureTextEntry` on
  web**, which is why masking needs BOTH spellings via `masked()` in
  `backends/gui/mask.ts` and why `<Input type="password">` rendered passwords in
  PLAIN TEXT until 8.0.61 (the wrapper destructured `type` out and never
  forwarded it, next to an eye offering to reveal what was already visible).
  Render it and read the markup before you believe a prop works.

### TWO stylesheets, and only one of them was being shipped

Components here render through gui, and gui renders through react-native-web, so
the markup carries classes from both: gui's atomic `_…` classes, and rnw's `r-…`
(one declaration each) and `css-…` (a component's base rule). **Both are written
by the running app** — rnw appends its `<style>` on import, gui inserts a rule the
first time a prop renders — and `scripts/gen-css.mjs` collected only gui's.

So `dist/styles.css` shipped 20 rnw classes with no rule anywhere, including the
`overflow-y: auto` that makes every `ScrollView` scroll. A browser hid it: rnw
appends that sheet itself, so a client-rendered app was always fine and only
server-rendered markup was bare. `dist/gallery.html` is server-rendered — so the
gallery drew those components as unstyled block-level HTML, and `responsive.mjs`
measured that page.

`styles.test.tsx` claimed a TOTAL match of classes-to-rules and stayed green
throughout, because it read only tokens starting `_`. It reads `r-` and `css-`
too now, which is the guard that closes this rather than the fix that patched it.

**A harness renders the way an app renders.** `scripts/contain.mjs` mounts
`test/stress.tsx` in a real browser through vite, and refuses to report a number
until it has confirmed both base rules arrived (`display:flex`, `min-height:0`).
That check is not decoration. A document with no styles fails every containment
question AND fails the negative control, which reads exactly like a good run — an
earlier server-rendering version of this harness reported the sidebar and the
drawer as broken shells on that basis, and both are fine.

### The shell contract, measured

A shell is something pinned top, something pinned bottom, and a middle that takes
what is left and scrolls. `Screen` and `Fill` (`backends/gui/screen.tsx`) are that
shape; `ScrollView` is the other way to get it, and it is the one that also works
off the web. `scripts/contain.mjs` over-fills all of them and asks three
questions: does visible content escape the frame, is clipped content reachable,
and what actually scrolls.

Measured at 24 rows in a 320px column and 90 rows in a 900px drawer: nothing
escapes, and the scroller in each case is real — the sidebar's middle holds 804px
of rows in 193px and the user chip stays pinned inside the frame; the drawer's
body holds 2884px in 844px.

On web, the half of the folklore that does the work is **declaring the overflow**.
`minHeight: 0` is already zero before anyone writes it — rnw's `View` base and
gui's own stack base both set `min-height: 0` and `min-width: 0`, measured on the
rendered element, not read off a source file. The gate keeps one frame of each as
a control: `only-overflow` (overflow, no `minH`) contains and scrolls;
`only-minh` (`minH`, no overflow) escapes by 310px and is REQUIRED to fail, since
a gate nobody has watched fail is not known to run.

Nothing here says what happens on native. This harness is a browser and cannot
answer it, so no claim is recorded.

### Subpaths

| Subpath | What |
|---|---|
| `@hanzo/ui` | the component API: Button, Badge, Card*, Checkbox, Dialog*, DropdownMenu*, Input, Toaster, Avatar*, Tabs*, Select*, Tooltip*, Popover*, Command*, Collapsible*, Resizable*, ScrollArea, Slider, Switch, Progress, Separator, Label, Textarea, AspectRatio — + `cn` (the product layer is kept off root, at `/product`) |
| `@hanzo/ui/components` | alias of the root surface, for hosts that shim the package through a `declare module` |
| `@hanzo/ui/product` | the product/app layer: charts, metrics, PageHeader, StatusTag, EmptyState, ComboBox, SlideOver, Toast, Reorder, Field |
| `@hanzo/ui/models` | ModelSelector + fetchModelCatalog + catalog helpers |
| `@hanzo/ui/core` · `/tokens` | cn, Zen font vars, the @hanzo/tokens color/theme/radii/spacing scale |
| `@hanzo/ui/theme.css` | the design tokens alone (custom properties + Zen + touch/elevation) |
| `@hanzo/ui/styles.css` | the COMPLETE sheet — tokens + motion + the generated gui atomic/theme CSS. `<Hanzo>` imports it, so an app never has to |
| `@hanzo/ui/gallery` | every component, once — what the generator, the unit test and the consumer test all render |
| `@hanzo/ui/primitives/<Member>` | per-member entrypoints (for hosts that modularize `@hanzo/ui` imports) |
| `@hanzo/ui/data` | `@hanzo/data`: RecordsView, DataTable, typed field editors |
| `@hanzo/ui/{canvas,dashboard,usage,gitops}` | the optional-peer kits (each re-exports its home package) |
| `@hanzo/ui/product/*` · `/primitives/*` | deep imports — one module without its barrel |
| `@hanzo/ui/product/pure` | the product layer's RULES with none of the layer (below) |
| `@hanzo/ui/product/theme-toggle-next` | the `@hanzogui/next-theme` binding, off the barrel on purpose (below) |
| `@hanzo/ui/grid` | `Grid` + `Cell` — a real CSS grid, so web-only and off the barrel (below) |
| `@hanzo/ui/css` | `substitute()` — resolve a `var()` chain, for tests jsdom cannot answer (below) |

Everything ships COMPILED from `dist` — every `exports` target is a real file in
the tarball, including `theme.css` and all 90 `primitives/*` entrypoints.
`src/dist.test.ts` asserts that against the built output, wildcards included; a
subpath pointing at a file tsc never emitted is invisible from source.

### Three entry points that exist because the barrel is not one

`@hanzo/ui/product` mounts the whole gui runtime to give you one component, and
for three kinds of caller that is not a cost — it is a wall.

**`@hanzo/ui/product/pure` — the rules, without the layer.** `pages()`,
`masked()`, `displayName()`, `tone()`, `orgScope`, `filterOptions`,
`resolveBrand` and the wordmark geometry. Every module it re-exports imports
NOTHING (`src/dist.test.ts` asserts the closure is empty) and is on
`postbuild.mjs`'s `DATA` list, so none is stamped `'use client'` — a stamped
module is a client REFERENCE on React's server layer, and calling `pages()`
through one in a server component throws instead of paging. It loads under a
bare `require()` with no transform and no DOM; the test proves it in a child
node process rather than under vitest, which has vite's transform already
installed and would prove nothing.

The components import these same modules, so there is one definition and not a
testable copy of a shipped one.

**`@hanzo/ui/product/theme-toggle-next` — Next, quarantined.**
`@hanzogui/next-theme`'s provider imports `next/script`, so the product barrel's
one `export { ThemeToggleNext }` line put Next in the graph of every Vite,
Express and Tauri host — the hosts this layer promises to run on. A barrel
re-export is a static edge no bundler can split. It is off the barrel; `<ThemeToggle />`
with no props still reaches it by dynamic import and degrades when next-theme is
absent, and `dist.test.ts` asserts BOTH — no static edge, and the dynamic one
still there, because a test that only asserted the absence would pass on a
deleted feature. `next` is now an OPTIONAL peer here: next-theme requires it and
nothing in this package admitted that.

**`@hanzo/ui/css` — `substitute(value, vars?)`.** jsdom does not resolve
`var()`; it hands a test the text verbatim. The theme rungs are
`var(--border, rgb(255 255 255 / .10))` on purpose (follow the live cascade
where design's sheet is mounted, keep the audited literal where it is not), so
every consumer trying to assert a border's contrast compared a colour to a
function call. With no `vars` map the answer is exact rather than approximate:
jsdom mounts no design sheet, so the fallback IS what a browser computes. It is
NOT part of `@hanzo/ui/core` — that subpath is ESM-only because @hanzo/design
publishes no `require` condition, and a jest consumer is the caller that needs
this. Importing nothing is what lets it ship both formats.

### `Grid` is off the barrel — 8.2.0

It renders a `div` and sets `display: grid`, and neither exists on React Native,
so it ships at `@hanzo/ui/grid` beside `@hanzo/ui/dots` rather than on the surface
that promises to run everywhere. That is a statement about the file, not a claim
about anyone's bundle.

One prop carries the tracks. `columns` takes a count, a list, a written track
list, or `{min, max}` — the responsive `repeat(auto-fill, minmax(…))` form, which
is why there are no breakpoint props. `rows` is the same down the page, and `Cell`
takes `col`/`row`, where a number spans and a string places. `min`/`cols`/`max`
are gone with no alias; the seven `trust/site` call sites moved in the same
change.

Two formulas in `tracks()` look like verbosity and are each one tidy-up away from
the ragged row this component exists to prevent, so `grid.test.ts` asserts both
against the shorter spelling they must NOT produce. A count is `minmax(0, 1fr)`,
never a bare `1fr`, because `1fr` means `minmax(auto, 1fr)` and `auto` floors the
track at its content. A fit floor is `min(Npx, 100%)`, never a bare `Npx`, because
`minmax(240px, 1fr)` forces a 240px track into a 390px phone: measured at 390, the
900px-min grid lays out one 342px track and the document does not scroll sideways.

The min-width floor grid children need is `[data-slot='grid'] > *` in
`styles/motion.css`, declared once. `Cell` does not restate it inline — a
`grid-column` only applies to a direct child of the grid, so a Cell is always in
range of that selector, and the computed floor is 0px on every cell at both 390
and 1280.

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

**`@hanzo/data` runs this same script**, with its package root and its own data
modules as arguments (`node ../ui/scripts/postbuild.mjs . theme,table/logic,…`).
It has the same two formats and the same two problems, and a second copy of the
file would be a second place to get the barrel rule wrong. That package used to
point its `exports` at `src/index.ts` and ship raw TSX — every consumer had to
transpile it, and `require('@hanzo/data')` could not load at all, which is one of
the two edges that broke `require('@hanzo/ui')`. It emits `dist/` now, both
formats, from 1.2.2.

The output is UNBUNDLED and mirrors `src/` one-for-one, so a consumer importing
one symbol pulls one module. A bundler here would be actively harmful: tsup's
code splitting emitted 11 shared `chunk-*.js`, and importing `Button` alone
dragged in `chunk-RCMDRI6V.js` (48K of source). Measured with esbuild, `import
{ Button } from '@hanzo/ui'` costs 4717 bytes bundled from tsup output vs 2021
from `tsc` output. Dropping `rollup-plugin-dts` (tsup's `dts` worker) is also
what makes the package build on TypeScript 7, which it cannot do otherwise.

**Every package here emits declarations the same way, and none of them use
tsup's `dts`.** That worker loads `rollup-plugin-dts`, which reads `ts.sys` at
import time; TypeScript 7 moved the compiler API behind `./unstable/*`, so it
throws `Cannot read properties of undefined (reading 'useCaseSensitiveFileNames')`
before writing anything and takes the whole build down. A tsup package therefore
builds `tsup && tsc --emitDeclarationOnly --declaration --outDir dist && node
../../scripts/dts.mjs` — one spelling, everywhere.

`scripts/dts.mjs` is the last step because tsc will not write the same
declaration under two extensions, and a dual-format package promises `.d.cts`
beside `.d.ts`. It reads the package's OWN `exports`, copies each missing alias
from the `.d.ts` tsc emitted, and **exits non-zero if a promised declaration has
no source**. That check is the point: a subpath with no types resolves to `any`
for every consumer without erroring anywhere, which is how `@hanzo/react` came to
publish four subpaths — `./hooks`, `./components`, `./tools`, `./mcp` — that
resolved to nothing at all, two of them with no source directory in the repo.
They are gone; the root barrel already exported everything they named.

Three things TypeScript 7 requires that 5 did not, each of which failed as
"cannot find" rather than as a config error:

- **`types` is now the whole list.** TS7 stops sweeping every installed
  `@types` package into scope, so a project naming any of them must name all of
  them — `pkg/ui` said `["react"]` and lost `node:fs` in its own suites. Add it
  to the CHECK config only; `tsconfig.build.json` overrides back to `["react"]`
  so node's globals stay out of a browser library's declarations.
- **A relative specifier is resolved strictly.** `declare module '*.css'` no
  longer covers `import './styles.css'`, and that file is GENERATED into `dist`
  after tsc runs. `allowArbitraryExtensions` plus `src/styles.d.css.ts` is the
  form the compiler asks for, and it beats a placeholder stylesheet in `src`
  that would shadow the real one.
- **`moduleResolution: node10` is removed** (TS5108), and the TS5095 rule that
  `bundler` needs an ES module target went with it. Every CJS config here used
  to state `node` to escape TS5095; they inherit `bundler` now.

`pkgs/annotate` is the one package still on TypeScript 5, and it stays there: it
consumes the compiler API (`ts.ScriptKind`, `ts.Node`), which TS7 does not
publish from its main export.

**`@hanzo/canvas` ships compiled, from 0.2.3.** Its `exports` pointed at
`./src/index.ts` and `./src/pure.ts`, so every consumer had to transpile it —
the same defect `@hanzo/data` carried until 1.2.2 — and it also put this
package's source inside a CONSUMER's program: `@hanzo/cd` then spanned two
packages, its common root became the repo, and tsc refused to emit anything for
it (TS5011). `gui.config.ts` and `gui.d.ts` moved into `src/` in the same change
so nothing lands outside `dist`.

Everything under `src/` is emitted, so every `exports` subpath resolves by
construction — no hand-maintained entry list to drift.

NOTE: `pkg/ui` (singular) sits OUTSIDE the `pkgs/*` pnpm workspace and installs
standalone — but it DOES publish through `.hanzo/workflows/publish.yml`, which
globs `pkg/*/package.json` AND `pkgs/*/package.json`. This line used to say the
opposite ("the maintainer flow, not publish.yml"), and the workflow's own comment
records why nobody should trust prose here: "It guessed wrong twice, in opposite
directions." Measured — bumping this package's version and pushing main put
8.0.115 on npm with no further step. Read the glob, not this paragraph.

**Install from the REPO ROOT, not from `pkg/ui`.** This package depends on
siblings by `workspace:*` (`@hanzo/cd` among them), so `pnpm install
--ignore-workspace` here cannot resolve them and stops at
`ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` — the standalone recipe this paragraph used to
give. One root `pnpm install` links every sibling and this package with it:

```bash
pnpm install                        # from the repo root
pnpm --filter @hanzo/ui gen:primitives   # refresh the per-member entrypoints
pnpm --filter @hanzo/ui exec tsc --noEmit
```

The reason given for going standalone was that the optional-peer kits are not on
the public registry. They are: `@hanzo/canvas`, `@hanzo/dashboard`,
`@hanzo/gitops` and `@hanzo/usage` all resolve on npmjs.

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
  pkg/                   published, and the reason this repo exists
    ui/                  @hanzo/ui@8 — the core library (npm)
    appearance/          @hanzo/appearance
    composer/            @hanzo/composer
    data/                @hanzo/data
  pkgs/                  the rest of the @hanzo/* family, auto-published
    event/               telemetry client — POST /v1/event
    observe/             capture engine        og/       OG image generation
    commerce/  checkout/  shop/  products/     canvas/   cd/   dashboard/
    agent-ui/  annotate/  react/  replay/      sentinel/ tokens/
    events/    next/      vite/   observe-native/  observe-svelte/
  apps/
    cd/                  demo app for @hanzo/cd
```

Both roots publish: `.hanzo/workflows/publish.yml` globs `pkg/*/package.json`
AND `pkgs/*/package.json`. A package in either place ships on a version bump.

## Build Order

`@hanzo/ui` depends on siblings that type themselves through their own
`"types": "dist/index.d.ts"`, so they must be built first. The `...` suffix does
that, in topological order — never build `@hanzo/ui` alone.

```bash
pnpm --filter @hanzo/ui... build
```

## Commands

```bash
pnpm --filter @hanzo/ui... build   # the library and its workspace deps
pnpm --filter @hanzo/ui test:unit  # styles + render surface
pnpm lint                          # lint all workspaces
pnpm typecheck                     # type checking
pnpm test                          # unit tests
```

## How this ships

One way, and it runs on our own stack:

    push  ->  git.hanzo.ai/hanzoai/ui           CANONICAL
              .hanzo/workflows/cicd.yml         the whole pipeline, from hanzo.yml
              .hanzo/workflows/publish.yml      publishes pkg/* and pkgs/*
              .hanzo/workflows/snapshots.yml    refreshes the visual baselines
      ->  npmjs                                 @hanzo/ui and the @hanzo/* family
        github.com/hanzoai/ui                   a mirror, pushed alongside;
                                                it runs nothing

No image and no deploy lane. This repo emits packages. ui.hanzo.ai is built
from `hanzoai/shadcn`, which owns the docs site and the registry it serves.

**git.hanzo.ai is canonical; GitHub is a mirror.** There is no `.github/workflows/`
— every build, check, publish and deploy is a workflow under `.hanzo/workflows/`,
which the forge reads. `.hanzo/workflows` uses GitHub Actions syntax, so a workflow
moves between the two by changing directory and nothing else, and github.com has no
runner registered for the `hanzo-build-*` labels these ask for. Keeping the mirror
current means pushing both remotes; nothing carries refs for you.

`cicd.yml` names only the triggers: every decision — what to test, what to build,
where it rolls — is read from the root `hanzo.yml`. No Vercel, no preview deploys.

## Publishing

One way: bump a package's `version` in its `package.json` and merge to `main`.
`.hanzo/workflows/publish.yml` detects the changed `@hanzo/*` package and publishes
it to npm (needs `NPM_TOKEN` as a forge secret). No changesets, no version-PR bot
— the semver bump is the trigger.

It is the SOLE publisher of every non-private `@hanzo/*` in `pkg/*` and `pkgs/*`,
and it mirrors the same tarball to `api.hanzo.ai/v1/packages/hanzo/npm` when
`HANZO_REGISTRY_TOKEN` is present. That mirror is best-effort by construction: no
token means a notice, not a failure, and npmjs stays authoritative either way.

## The gate

`hanzo.yml`'s `test:` block, which `cicd.yml` runs through `hanzoai/ci`:
`ui-unit` builds `@hanzo/ui` with its workspace deps and runs `test:unit`, and
`ui-consumer` installs chromium and runs `test:consumer` under both bundlers —
Vite and webpack disagree about css `url()` asset resolution, and a Vite-only gate
is how 8.0.46 shipped a stylesheet pointing at a font the package does not pack.
No coverage upload runs here.

**`test:consumer` is red on published 8.1.0 and later, and it is not a split
defect.** `@hanzo/ui` → `@hanzogui/lucide-icons-2` → `react-native-svg@15.15.5`
imports `AssetRegistry`, which `react-native-web@0.21.2` does not export, so the
consumer app fails to build. The fix is a version pin on that chain, which is its
own decision — do not paper over it here.

## Telemetry — `@hanzo/event` is the ONE client (`pkgs/event`)

`@hanzo/event` is the single canonical telemetry client for every Hanzo surface.
ONE API surface over **TWO** planes — the client never sends the org; the server
resolves the tenant.

1. **Event stream** — pageview/event/identify/group (and an error breadcrumb),
   batched to `POST {host}/v1/event` with `{ batch: [Event, …] }`
   `-> { accepted, dropped }`. Tenant from the session or a publishable `pk_` key.
2. **Error plane** — every captured exception is ALSO framed as a real **Sentry
   envelope** and POSTed to `POST {dsn.base}/envelope/?sentry_key=…`, i.e. the
   SAME `/v1/event` address the stream uses: `/v1/event/{projectId}/envelope/`.
   This is the ONLY thing that reaches the error dashboard.

   ONE address, from 0.3.29. Both planes are `/v1/event` — the error plane used to
   be spelled `/v1/sentry/{projectId}/envelope/`, a second public address for the
   same wire. And it was written THREE times: `dsnForProduct` minted it,
   `parseDsn` threw the DSN's path away and rebuilt it as a literal, and
   `buildEnvelope` restated it again in the envelope header. `Dsn.base` is that
   address now, DERIVED from the DSN in `parseDsn`, so `dsnForProduct` is the one
   place it is spelled. Do not re-introduce a second spelling, and do not
   hardcode a path anywhere downstream of the DSN.

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
identical path spelling — and 0.3.7 deleted both.

This package no longer ships a script tag at all. 0.3.33 deleted `hz.js`: the
hosted tag is CLOUD'S, served at `GET https://api.hanzo.ai/v1/event/tag.js`
from `hanzoai/cloud` (`apps/event/tag.go`, which splices this package's
`src/anon.js` ahead of it so both distributions resolve ONE anonymous id). It
versions with the address it posts to, which is what keeps a tag from drifting off
its own wire. `data-key` is the attribute, `pk-…` the value, and no key means the
tag installs nothing — a keyless beacon lands in a tenant its owner cannot read,
so silence is the honest failure.

`/v1/event.js` was that tag's address until the ingest endpoint took the app's name.
`.js` is part of a segment rather than a child of one, so the tag became a CHILD
of `/v1/event`; the old sibling 404s and there is no alias behind it. Its config
endpoint moved the same way: `/v1/projects/tags`, never `/v1/tags`.

So this package is the client for a surface that BUILDS, and the hosted tag is
the client for one that does not. A page runs exactly one of them — both post
pageviews to the same endpoint, so a page carrying both counts every one twice.

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
<Hanzo analytics={{ product: 'console', ingestKey: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY }}>
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

**The CLIENT cannot be doubled either.** The same shape one layer down, and it
was live on hanzo.ai/pricing until event 0.3.28: two clients on one page, each
with its own queue, putting two batches on `/v1/event` in the same frame — one
authenticated (200) and one with no `Authorization` at all (401
`ingest_key_required`), because the library asked for its client before the app
supplied the key. Both batches held a `$pageview` for the same page, so the
number was over- and under-counted at once and neither said so.

Since 0.3.28 `createAnalytics` returns THE client for a `(host, product)`
stream, held on the page under `Symbol.for('hanzo.event.clients')`. The slot is
global for the same reason observe's is, and here it is load-bearing rather than
defensive: `@hanzo/event` and `@hanzo/event/react` are separate tsup entries
that each carry their own copy of `core`, so on any page importing both there
are always TWO module scopes — a module-scope map would dedupe nothing. A caller
arriving with a credential the client lacks hands it over (the key belongs to
the stream, not to whoever asked first), and the error plane, which derives from
that key, comes up with it.

`pageview()` records a view once, keyed on path + location. Counting a page is
the client's rule, not each emitter's: `AnalyticsProvider`'s autoPageview, the
telemetry route hook and nav autocapture each correctly believe they count the
first view and cannot see one another. Without this half, sharing the client
turns two half-counted pageviews into two counted ones.

`AnalyticsProvider` no longer memoizes construction. `useMemo(…, [client])`
never saw a config change, and adding `config` builds a client per render since
call sites pass an object literal — the memo was only ever standing in for an
identity the registry now supplies.

**Consent is decided in ONE layer.** The engine takes `enabled` as a value; the
provider resolves policy (GPC, DNT, stored `hz_consent`, build kill switch) and
passes the answer down. Do not add a second, partial copy to the engine — the two
then disagree about an explicit opt-in. Only a client that can emit takes the
stream: `createAnalytics` skips the registry for `enabled: false`, and `adopt`
fills in a missing credential and nothing else, so no surface overrules
another's reading of consent in either direction. 0.3.27 registered the
disabled one — `TelemetryProvider` renders once reporting `enabled: false`
before its ownership resolves in an effect, and the client built in that
moment became the one every later caller got, which took hanzo.ai's telemetry
to ZERO. Whenever you touch this registry, read `enabled` off the live client
(`globalThis[Symbol.for('hanzo.event.clients')]`), not just the request count:
silence and correctness look identical in a network panel.

### One way — supersessions (no divergent telemetry client)

| Package | Status | Note |
|---|---|---|
| `@hanzo/event` | **canonical** | `pkgs/event`, posts `/v1/event` only |
| `@hanzo/capture` (npm) | **deprecated → `@hanzo/event`** | the old name of this package; `@hanzo/event` is a superset |
| `pkgs/capture` (`@hanzo/analytics@0.1.0` dup) | **deleted** | stale in-repo duplicate, removed |
| `hanzoai/analytics` `packages/event` (`@hanzo/event@0.2.0`) | **deleted** | An unpublished FORK of this package in another repo. It was the only copy that could actually reach Sentry, while the published one here could not — the fleet's error telemetry died in that gap. Its envelope + scrub implementation was merged here in 0.3.2. Never fork this package again; it publishes from `pkgs/event` only. |

## Package Exports

```typescript
import { Button, Card } from '@hanzo/ui'
import { Button } from '@hanzo/ui/components'
import * as Dialog from '@hanzo/ui/primitives/dialog'
import { cn } from '@hanzo/ui/lib/utils'
```

## Adding a Component

`src/backends/gui/` is the surface and `src/gallery.tsx` is the list. Add the
component to the backend, export it from the backend barrel, and render it once
in the gallery — the styles test, the render test and the consumer screenshots
all read that one list, so a component missing from it is a component three
layers do not check.

```bash
pnpm gen:primitives                 # refresh the per-member entrypoints
pnpm --filter @hanzo/ui... build
pnpm --filter @hanzo/ui test:unit
```

The registry flow — two themes, an example, an MDX page, `pnpm build:registry` —
belongs to `hanzoai/shadcn` now, along with the registry itself.

## Tech Stack

React 19, `@hanzo/gui` (Tamagui) on the `@hanzo/tokens` scale, plain `tsc` (no
bundler), Turborepo + pnpm, vitest + playwright.

## Upstream Sync

Nothing here syncs from upstream shadcn any more; that relationship moved with
the registry and the CLI to `hanzoai/shadcn`. `@hanzo/ui@8` is clean-room on
`@hanzo/gui`.

## Where Tailwind belongs, and where it is a bug

Two different things wear the same clothes here, and confusing them breaks
something either way.

**Framework — `pkg/ui`.** `@hanzo/ui@8` is @hanzo/gui style props on the
`@hanzo/tokens` scale. Zero `@radix-ui` imports, zero utility classes; the only
class names are `hz-*` handles its own `theme.css` defines. A Tailwind class
appearing in `pkg/ui/src` is a mistake. (One exception, on purpose:
`hover-card.test.tsx` passes `text-xs` as a caller className to prove an
arbitrary class survives the merge, and that gui's own width outranks it — that
is the interop contract for call sites still on Tailwind.)

**Product — the v5 holdouts.** `pkgs/commerce`, `pkgs/checkout` and `pkgs/shop`
still emit Tailwind class strings against the `@hanzo/ui-shadcn@^5` peer.
Tailwind there is the deliverable, not a defect. The registry and the CLI that
hand those classes to customers moved to `hanzoai/shadcn` — do not "clean up" a
registry, and do not go looking for one here.

**The defect that survives a live pipeline.** Tailwind reads SOURCE TEXT.
`grid-cols-${n}`, `rounded-${size}`, `scale-${n*100}` never become rules — and
the failure hides, because a neighbouring file that spells one literally lends
you its rule. `grid-cols-3` is literal in two commerce files, so a
three-option selector laid out and a four-option one stacked.

Ask Tailwind's own extractor rather than reasoning about it (from a tree that
has it installed — this repo no longer does):

```js
import { Scanner } from '@tailwindcss/oxide'
new Scanner({ sources: [{ base: '/abs/dir', pattern: '**/*.tsx', negated: false }] }).scan()
```

Anything the interpolation was reaching for is absent from that list. Two fixes,
both one-way: a count or a length becomes an inline style
(`gridTemplateColumns: repeat(n, minmax(0, 1fr))` is what the utility compiles
to); a value off a fixed scale becomes a literal lookup table, so the extractor
can see every arm.

**Commerce is still on the v5 line and cannot leave yet.** `@hanzo/commerce`
peers on `npm:@hanzo/ui-shadcn@^5` and holds the repo's last direct
`@radix-ui/*` import (`react-radio-group`, for an image tile — v5's
`RadioGroupItem` hardcodes a 16px dot and takes no children). v8 has gained
`RadioGroup`/`RadioGroupItem`/`Image`; what it still lacks, and commerce imports,
is `ApplyTypography`, `MediaStack`, `Skeleton`, `Carousel`, the `Form*` set, and
the media type surface (`Dimensions`, `ImageDef`, `MediaStackDef`,
`MediaTransform`, `VideoDef`, `AnimationDef`). The peer is one choice for the
whole package, so commerce moves when those land, not file by file.

## A primitive that discards a prop is the migration's real blocker

Two components here silently dropped the prop their caller cared about, and both
were what stopped hanzo.chat converting its last Radix call sites. Neither was
visible as a failure: a discarded prop is not an error, the component still
renders, and the test suite was green through both. Fixed in **8.0.73**.

- **`PopoverContent` destructured `align` into a variable it never read.** Every
  caller asking for a left- or right-aligned panel got a centred one. gui keeps
  the whole placement fact on the popper ROOT as one floating-ui string while the
  compound API splits it into a side and an align, so Content now publishes into
  the root exactly as `sideOffset` already did. `place(side, align)` is the
  rejoining and it is a PURE function, because the panel is portalled and
  positioned at run time — it never reaches server-rendered markup, so no
  snapshot could have caught this and the decision is the only assertable thing.
- **`Slider` spread caller props onto the root**, but gui puts `role="slider"` on
  the Thumb — so every `aria-label` landed on a plain container and the control
  announced as unnamed. `named()` routes the four ARIA naming properties to the
  thumb and leaves value/range/step on the root, where gui reads them.

Both tests are mutation-checked: reverting either fix fails them (2 and 3
respectively). A test nobody has watched fail is not known to run.

- **`DialogContent` rendered `<DialogOverlay />` with no props and no way in**,
  fixed in **8.0.115**. Content owning its own portal and overlay is the point —
  it is what lets a caller mount Content alone — but owning is not hiding, and
  with nothing through, the dim, the stacking order and the click target were
  unreachable from outside the package. A consumer stacking a preview over a
  dialog had no way to say which one dims which. `overlay?: DialogOverlayProps`
  is the way through; absent, nothing changes. This is the last of the three
  things keeping hanzo.chat's dialog files on Radix, whose own Dialog lets them
  render the overlay themselves.

  Its test reads the COMPUTED z-index, never `el.style`: gui compiles a style
  prop to one atomic class (`_z-1234`) and writes no inline style at all, so
  `el.style.zIndex` is `''` on an overlay that is correctly stacked. Written the
  inline way first — and the test failing against working code is what said so.

**Before believing a report that a primitive is MISSING, check the version it was
measured against.** A fleet pass concluded @hanzo/ui "cannot receive" Accordion,
HoverCard or RadioGroup and that `<TabsTrigger>Label</TabsTrigger>` renders an
empty tab. All four claims were true of 8.0.63 and false of 8.0.72 — the three
primitives exist and `ink()` wraps bare text children in a Text host. That stale
answer is what a consumer repo reads to decide the migration is blocked, so it
costs a whole conversion.

## Two packages removed public exports in a PATCH — decided, not an oversight

`@hanzo/agent-ui` 0.1.0→**0.1.1** dropped `getStatusTone`,
`getStatusBadgeClasses`, `STATUS_TONES`, type `StatusTone` and the `./style/*`
subpath, and moved its `@hanzo/ui` peer from `^5.0.0` to `>=8`. `@hanzo/react`
1.0.0→**1.0.1** dropped `cn`. Both are live on npm and cannot be unpublished.

**Publishing 0.2.0 / 1.1.0 would fix nothing**, and that is the part worth
knowing: `^0.1.0` resolves `>=0.1.0 <0.2.0`, so 0.1.1 is still the version a
caret range picks. Only a RESTORING patch or a deprecation changes what anyone
installs.

So it was measured instead. Nothing in the fleet imports `@hanzo/agent-ui` at all
— the four grep hits are comments inside its own barrel — nothing imports
`@hanzo/agent-ui/style`, and nothing imports `cn` from `@hanzo/react`. Last-month
downloads are 83 and 107, which is CI traffic against packages with two and
twenty-three versions. And every removed name is a Tailwind class-string helper
this repo is deliberately deleting, so restoring them would re-import the thing
the whole migration exists to remove.

**Accepted, deliberately, with no version churn.** Recorded here so the next
reader who notices it does not spend a release cycle repairing a break with no
consumer. If an outside consumer ever appears, the lever is `npm deprecate` on
those two exact versions, not a new minor.

## Gotchas

- Build with `...` or not at all — `pnpm --filter @hanzo/ui build` alone reports
  its siblings as missing modules and blames @hanzo/ui for it
- `tsconfig.check.json` does not exist, so `pnpm typecheck:ui` fails on a missing
  file. Use `pnpm --filter @hanzo/ui exec tsc --noEmit` until someone writes it
- `@hanzo/auth` v2.6.0 uses a pluggable provider registry: `registerAuthProvider('firebase', FirebaseAuthService)`

## Rules

1. Use pnpm, not npm/yarn
2. Never commit symlinked files (AGENTS.md, CLAUDE.md, etc.)
3. Knowledge goes in this file, not random root MD files
4. Anything shadcn-lineage belongs in `hanzoai/shadcn`, not here
