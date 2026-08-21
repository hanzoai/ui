# Hanzo UI Consolidation — one library, all polish, no duplication

**Goal.** RIP the fragmentation (`@hanzo/data` vs `@hanzo/ui` vs in-console duplicates) into ONE canonical, cross-platform, presentational, clean-room library: **`@hanzo/ui`, built on `@hanzo/gui`**. Preserve every polished component + token; zero loss; no fork.

**Status. LANDED — the sequence below is done, and npm is the record of it:**
`@hanzo/ui@8.0.114` is `latest`, the shadcn line lives at `@hanzo/ui-shadcn@5.9.1`,
and all 210 pre-8 versions of `@hanzo/ui` are deprecated pointing at it. The two
consumers that still name a 5.x do so as `npm:@hanzo/ui-shadcn@^5.9.0`, which is
the intended end state rather than a leftover. What follows is kept as the record
of how it was done, not as work outstanding.

- **Step 1 — Audit:** complete (this document; four source trees read file-by-file).
- **Step 2 — Establish `@hanzo/ui` + migrate the stable foundation:** **DONE & GREEN** (`pkg/ui` is now a real package; `tsc --noEmit` = 0 errors, `vitest` = 12/12).
- **Step 3 — Console re-point:** **STAGED, not merged.** Gate is split (backend live, app lanes in-flight) — see [Step 3](#step-3--console-re-point-staged).

**One decision needs CTO sign-off before publish** — see [Naming / version](#naming--version--the-one-decision).

---

## Architecture — three layers, decomplected

```
@hanzo/gui   (Tamagui/One)   cross-platform primitives: Text, XStack/YStack, Button, Input,
   │                          Card, Popover, Select, Switch, Slider, Spinner, ScrollView …
   ▼
@hanzo/data  (pkg/data)      the metadata-driven RECORD layer: fields → records → views
   │                          (RecordsView, DataTable, BoardView, RecordDetail, field editors)
   ▼
@hanzo/ui    (pkg/ui)  ◄──── THE ONE LIBRARY. Two orthogonal concerns, one package:
                              • product/app layer  →  import { … } from '@hanzo/ui'
                              • record layer        →  import { … } from '@hanzo/ui/data'  (re-exports @hanzo/data)
```

`@hanzo/data` stays the **source of truth** for the record layer; `@hanzo/ui` **composes** it (`export * from '@hanzo/data'` on the `./data` subpath) rather than copying — so the CMS/ERP/Help app lanes that consume `@hanzo/data` today keep working untouched, and there is exactly one home. This mirrors how the gui base wraps `hanzogui`.

Both layers own a `DataTable` (product = generic typed `<T>` list; data = field-driven record grid). Keeping the record layer on the `./data` subpath keeps each name unambiguous — no rename, no collision.

---

## The preserve-and-merge manifest

Legend: **✅ migrated** (in `pkg/ui`, GREEN) · **↪ re-exported** (composed from `@hanzo/data`) · **⏳ staged** (Step 3, after app lanes land) · **🔧 pending prop-injection** (app-coupled; decouple before it can live in a presentational lib) · **🏠 stays in console** (app glue, not a UI component).

### A. Record layer — `@hanzo/data` → `@hanzo/ui/data`  ↪

Source: `pkg/data/src/*` (v1.2.0, clean-room, already published). Surfaced through `@hanzo/ui/data` and `@hanzo/ui/primitives/bases/data`. Nothing re-implemented.

| Component / module | Source | New home |
|---|---|---|
| `RecordsView` (flagship: toolbar over table⇆board, filter/sort/search/group, saved views) | `view/RecordsView.tsx`, `view/Toolbar.tsx` | `@hanzo/ui/data` |
| `DataTable` (field-driven record grid: sort headers, drag resize/reorder, row select, inline edit, pagination) | `table/DataTable.tsx` | `@hanzo/ui/data` |
| `BoardView` (kanban, optimistic drag-move) · `RecordCard` | `board/BoardView.tsx`, `table/RecordCard.tsx` | `@hanzo/ui/data` |
| `RecordDetail` / `RecordForm` | `record/RecordDetail.tsx` | `@hanzo/ui/data` |
| Field model + registry (`FieldType` ×24, `FieldDefinition`, `registerField`, routers) | `field/{types,registry,registerDefaults,FieldDisplay,FieldInput}` | `@hanzo/ui/data` |
| Field displays + **editors** (select/currency/date/relation/file/JSON/boolean/fullName/address…) | `field/{displays,inputs}.tsx` | `@hanzo/ui/data` |
| Composable primitives: `Menu`, `CheckBox`, `Toggle`, `Calendar` | `primitives/*` | `@hanzo/ui/data` |
| Pure logic: `applyView`, `sortRecords`, `filterRecords`, `searchRecords`, `paginate`, `boardColumns`, … | `{table,board,view}/logic.ts` | `@hanzo/ui/data` (+ `@hanzo/data/*/logic` subpaths for Node hosts) |
| Tokens: `tokens`, `TAG_TONES`, `tagTone` | `theme.ts` | **also top-level `@hanzo/ui`** (token surface) |

### B. Console `components/ui/*` product primitives → `@hanzo/ui/product`  ✅ / 🔧

Source: `console2/src/components/ui/*`. The pure subset was ported **byte-identical** (verified by `diff`) — 100% of the polish preserved (Charts' hover tooltips/axis-ticks/honest-null, DataTable width/flex/hover-gating, Field's 6 variants, SlideOver's focus-trap + scroll-lock, ComboBox's ReDoS-safe filter).

| Component | Source (`console2/src/components/ui/`) | New home | Status |
|---|---|---|---|
| `DataTable<T>` (generic typed list) + `Column` | `DataTable.tsx` | `@hanzo/ui` (`product/DataTable`) | ✅ |
| `PageHeader` | `PageHeader.tsx` | `@hanzo/ui` | ✅ |
| `Field*` (`FieldRow/Text/TextArea/Switch/Select/Slider`) | `Field.tsx` | `@hanzo/ui` | ✅ |
| **Charts** (`Sparkline/LineChart/BarChart/Donut/BarRows`, `CHART_PALETTE`) | `Charts.tsx` | `@hanzo/ui` | ✅ |
| `Donut` (standalone dependency-free ring) | `Donut.tsx` | `@hanzo/ui` as **`DonutRing`** (alias — Charts.Donut is canonical) | ✅ |
| `StatusTag` (health verdict → pill) | `StatusTag.tsx` | `@hanzo/ui` | ✅ |
| `EmptyState` (DO/Vercel-class first-run) | `EmptyState.tsx` | `@hanzo/ui` | ✅ (**decoupled** — see §I) |
| `Metric*` (`MetricCard/MiniBars/UtilBar/LegendDot/Panel/HintButton`, `SERIES`) | `Metric.tsx` | `@hanzo/ui` (its `Sparkline` preserved as **`MetricSparkline`**) | ✅ |
| `ComboBox` + pure `filterOptions`/`isKnownOption` | `ComboBox.tsx`, `combobox/filter.ts` | `@hanzo/ui` | ✅ (+ `filter.test.ts`) |
| `PrimaryButton` · `HanzoMark` · `ProductIcon` · `ProviderLogo` | resp. files | `@hanzo/ui` | ✅ |
| `SlideOver` (a11y drawer) · `SelectMenu` · `Toast` (`useToast`) | resp. files | `@hanzo/ui` | ✅ (SlideOver import decoupled `~/…/color`→`./color`) |
| `Reorder<T>` (pointer DnD) · `FadeIn` · `ThemeToggle` · `color` (`asColor`/`IconLike`) | resp. files | `@hanzo/ui` | ✅ (+ `Reorder.test.ts`) |
| `DetailPane` (right-side pane over SlideOver) | `components/DetailPane.tsx` | `@hanzo/ui` | ⏳ (liftable; lands with Step 3 — depends only on SlideOver) |
| `ChunkGuard` (stale-deploy chunk-error reload) | `components/ChunkGuard.tsx` | `@hanzo/ui` | ⏳ (fully portable; lands with Step 3) |

### C. Design tokens + motion → `@hanzo/ui`  ✅

The brief's premise (`globals.css` `t_dark`/`t_light` token blocks) is **corrected**: `t_dark`/`t_light` are `@hanzo/gui` (Tamagui) theme **class names**; the calm values live in three real places, all preserved:

| Polish | Source | New home |
|---|---|---|
| Calm dark-first tokens (surface, text, accent `#60a5fa`, tag tones) — raw hex, theme-config independent | `pkg/data/src/theme.ts` | `@hanzo/ui` (top-level `tokens`/`TAG_TONES`/`tagTone`) |
| OKLCH shadcn-compatible palette (soft-charcoal `oklch(0.145 0 0)`, `--radius: 0.5rem`, indigo sidebar accent) | `pkgs/ui/style/hanzo-default-colors.css`, `@hanzo/tokens` | unchanged (legacy shadcn line); the gui line uses the hex tokens above |
| **Motion vocabulary** — `fade-up` (FadeIn), `collapse`/`slide`/`fade` (shell/drawer), `drag`, `skeleton`/`pulse`/`row-in`; all `prefers-reduced-motion`-guarded | `console2/app/globals.css` (motion section) | **`@hanzo/ui/styles/motion.css`** (verbatim) — `import '@hanzo/ui/styles/motion.css'` once at app root |

### D. Generic DocType renderer → `@hanzo/ui`  ⏳ (Step 3, FINAL — active lane)

Source: `console2/src/components/doctype/*`. **Actively edited by the CMS/ERP/Help lanes (untracked).** Dependency-**injected** (`client: FrameworkClient` prop) — not `~/lib/api`-coupled — so the real move-blockers are `~/lib/framework/{types,fields}` + the `ui/*` primitives (now in `@hanzo/ui`) + `@hanzo/data` (now `@hanzo/ui/data`).

| File | Class | Step-3 disposition |
|---|---|---|
| `MediaGrid.tsx` | presentational | → `@hanzo/ui` (cleanest lift; props-only DAM gallery) |
| `DocTypeRecords.tsx` / `DocTypeDetail.tsx` | mixed (data-bound shell over `@hanzo/data` views) | shell **stays in console**; renders `@hanzo/ui/data` views (already true) |
| `CollectionsBrowser.tsx` | mixed (card grid + install/create orchestration) | presentational card-grid → `@hanzo/ui`; orchestration stays |
| `data.ts` | glue (relation loading) | stays in console |

### E. LivingOverview → `@hanzo/ui`  ⏳ (Step 3 — active lane)

Source: `console2/src/components/products/overview/living/*` (untracked/modified). Pure/presentational parts portable; app-glue concentrated in `registry.ts` (live API clients).

| Part | Class | Step-3 disposition |
|---|---|---|
| `motion.ts`, `hooks.ts`, `logic.ts`, `config.ts` (types) | pure | → `@hanzo/ui` (unit-tested; count-up, poll clock, unit formatting) |
| `tiles.tsx`, `LivingOverview.tsx` | presentational (reuse `ui/Charts` verbatim) | → `@hanzo/ui` (once `config.ts`'s one `~/lib/products/registry` `ProductIcon` type is swapped for `@hanzo/ui`'s `IconLike`) |
| `adapters.ts`, `registry.ts` | glue (map REAL `/v1` sources → `OverviewData`) | **stay in console** |

### F. Framework / Base-data libs → stay in console  🏠

`src/lib/framework/*` (DocType wire contract + `FrameworkApi` client + pure `fields.ts` mapper to `@hanzo/data`) and `src/lib/base-data/*` (Base REST client + schema→field mapper) are **app data-access glue**, not UI. They stay in the console. Their pure mappers (`docTypeToFields`, `baseCollectionToFields`) could later publish as a small `@hanzo/base-data` adapter, but they are not UI components and are out of scope for `@hanzo/ui`.

### G. App-coupled console components → 🔧 pending prop-injection (NOT yet in the lib)

These import app `~/lib`/session/router/branding and must be made presentational (inject props) before they belong in a host-agnostic lib. Kept in console for now; the injection contract is specified so the eventual lift is mechanical.

| Component | Coupling | Inject to lift |
|---|---|---|
| `BackendStateCard` (`BackendState.tsx`) | `~/lib/api` `ApiError` | accept a numeric `status` (or shared error shape) instead of `ApiError` |
| `BrandLogo` | session + live IAM `organization()` + `~/config` + branding | `orgName`, `logoUrl` (or a `loadOrgLogo` loader), brand mark/name as props |
| `Breadcrumbs` | `next/navigation` + catalog lookups | `crumbs[]` (or `pathname` + resolver) + `onNavigate` |
| `Loader` / `BrandMark` | `~/config` + brand logo pkgs | `brand`/`brandName` + the animated-SVG getter |
| `States` (`ErrorState`, `OperatorAccessRequired`) | `~/lib/api` + session + branding | the error, the account identity, brand strings |

---

## What this pass built (Step 2)

New in **`pkg/ui`** (was a bare `src/` staging dir — no package):

- `package.json` — `@hanzo/ui` `8.0.0`, source-published (`files: ["src"]`, exports map to `.ts`), peers `@hanzo/gui >=7.2.2`, `@hanzo/data >=1.2.0`, `react >=19`; MIT (repo `LICENSE.md`). Exports: `.`, `./product`, `./data`, `./primitives/bases/data`, `./styles/motion.css`.
- `src/index.ts` — top-level barrel (product layer + tokens).
- `src/product/index.ts` — product barrel; **collision-free** (Charts `Sparkline`/`Donut` canonical; Metric's → `MetricSparkline`; standalone ring → `DonutRing`; `ComboOption` from the one filter module) — **zero loss**.
- `src/data.ts` — `export * from '@hanzo/data'` (the record layer, one home).
- `src/styles/hanzo-motion.css` — the motion vocabulary, verbatim.
- `tsconfig.json`, `vitest.config.ts`, `gui.config.ts`, `gui.d.ts`, `.npmignore`, `README.md` — mirror the proven `pkg/data` setup.
- **One decouple fix:** `product/EmptyState.tsx` no longer imports `~/lib/products/registry`; it uses the local `IconLike` type — the last host coupling in the product tree is gone.

**Green:** `tsc --noEmit` = 0 errors (strict); `vitest run` = 12/12 (`combobox/filter`, `Reorder`). Every product component is host-agnostic (imports only `react`, `@hanzo/gui`, `@hanzogui/*`, `@hanzo/data`, relative).

## Clean-room guarantee (preserved)

`pkg/data` audited for GPL/Twenty contamination: **none.** No GPL, no copied license headers/SPDX, no Twenty entity/decorator architecture. The field/record model is an independent `FieldType` union + `FieldDefinition` + runtime `Map` registry (records are plain `Record<string, unknown>`). "Twenty" appears **only as benchmark prose** ("Airtable/Twenty-class polish, clean-room"). License: MIT (repo `LICENSE.md`). `@hanzo/ui` inherits the same posture.

---

## Naming / version — DONE: `@hanzo/ui@8`, shadcn retired to `@hanzo/ui-shadcn`

**Decision:** the gui-based unified library takes the `@hanzo/ui` name **forward at `8.0.0`** (aligning with the "Hanzo Cloud 8.x" umbrella; major = breaking re-platform). The legacy shadcn/Radix line (`pkgs/ui`, v5.7.0) is **retired by renaming** to `@hanzo/ui-shadcn` (never hard-deleted) — it stays fully alive under the new name, freeing `@hanzo/ui` for v8. Precedent: `pkg/data@1.2.0` already superseded `pkgs/data@1.1.0` under the same name.

This is **DONE (repo-local):** `pkg/ui/package.json` is `@hanzo/ui@8.0.0`, GREEN. The rest is a coordinated, **sequenced** retire — because publishing `@hanzo/ui@8` (a different, gui-based API with no shadcn `Button/Card/Dialog`) under the name ~20 repos consume for shadcn primitives will BREAK any consumer that resolves to `@8`. So order matters:

**Blast radius (measured across `~/work/hanzo`).** Declared deps on `@hanzo/ui` in ~20 repos. Most pin `^5.x` (semver-safe from an `@8` bump): paas, chat, platform, app, hanzo.ai, o11y, docs, mdx, hanzobot, ui-repo `pkgs/checkout` `^5.3`, `pkgs/agent-ui` `^5.0`. **Would break on `@8`:** `hanzoai/identity/app` (`"latest"`), ui-repo `pkgs/commerce` (`>=5.0.0`); `app/` uses `workspace:^`. The `ui.hanzo.ai` docs app + `pkgs/{commerce,checkout,agent-ui}` import the shadcn line internally.

**Publish reality.** `.github/workflows/publish-on-tag.yml` publishes **`pkgs/ui`** (the shadcn line) as `@hanzo/ui` on a `v*` tag — it does not reference `pkg/ui`. So a tag push today publishes shadcn, not v8. Publishing v8 needs the workflow rewired to build/publish `pkg/ui`. `npm` is not authed locally (`npm whoami` empty) — per house rules, publish goes through **CI (self-hosted runners, canonical org `NPM_TOKEN`)**, not a local `npm publish`.

**Safe sequence to fully land v8 (each step reversible until the tag push):**
1. ✅ `pkg/ui` = `@hanzo/ui@8.0.0`, GREEN (done, committed to a branch).
2. Rename `pkgs/ui` name → `@hanzo/ui-shadcn`; update the internal ui-repo consumers (`app/`, `pkgs/{commerce,checkout,agent-ui}`) + `check-no-hanzogui`/registry scripts that reference it.
3. Migrate external consumers off `@hanzo/ui`→`@hanzo/ui-shadcn` (start with the break-risk ones: `identity` `latest`, `commerce` `>=5`; the `^5` pins are safe to migrate at leisure). ~20 repos — do as a tracked sweep or flag per-repo.
4. Rewire `publish-on-tag.yml` (and `release.yml`) to build + publish `pkg/ui` as `@hanzo/ui@8`, and `pkgs/ui-shadcn` as `@hanzo/ui-shadcn`.
5. `npm deprecate '@hanzo/ui@<8' 'moved to @hanzo/ui-shadcn; @hanzo/ui@8+ is the @hanzo/gui-based unified lib'`.
6. Tag `v8.0.0` → CI publishes `@hanzo/ui@8.0.0`. Verify `npm view @hanzo/ui@8.0.0`.

**Was gated on the CTO's go-ahead** (irreversible / globally-visible / ecosystem-wide): steps 2-6 — given, and done. The `pkgs/ui` rename, the ~20-repo consumer sweep, the CI rewire, `npm deprecate`, and the `v8.0.0` tag push that triggers publish. These were not executed autonomously.

---

## Step 3 — console re-point (STAGED)

**Gate (per the brief):** cloud `/v1/framework/modules` live **AND** console CMS/ERP/Help native.
- ✅ Backend: `/v1/framework/modules[/:module[/install]]` is **implemented + wired** (`cloud/clients/framework/framework.go:71-73`, HIP-0106 order 129, bound in `subsystems.go:130`, real tests).
- ⏳ Console: `CmsModule.tsx`, `ErpModule.tsx`, `HelpModule.tsx`, `components/doctype/` are **untracked/in-flight** on `feat/console-native-cms`.

→ Gate is **split**, so the re-point is **staged, not applied.** I deliberately did **not** touch `console2`'s working tree (it holds the lanes' uncommitted work — editing it would collide and risk loss, the opposite of the goal).

**Ready-to-apply re-point (mechanical, once the lanes land + merge):**
1. `console2` deps: keep `@hanzo/gui`, `@hanzo/data`; add `@hanzo/ui` (`^6.0.0`). (`@hanzo/data` may stay as a direct dep or be dropped in favor of `@hanzo/ui/data` — both resolve to the same source.)
2. Re-point imports (delete the now-duplicated in-console copies — extract, don't copy):
   - `~/components/ui/{DataTable,PageHeader,Field,Charts,Donut,StatusTag,EmptyState,Metric,ComboBox,combobox/filter,PrimaryButton,HanzoMark,ProductIcon,ProviderLogo,SlideOver,SelectMenu,Toast,Reorder,FadeIn,ThemeToggle,color}` → **`@hanzo/ui`** (or `@hanzo/ui/product`). Two spot-renames: Metric's `Sparkline`→`MetricSparkline`, standalone `Donut`→`DonutRing`.
   - `@hanzo/data` (in `doctype/*`, `base-data/*`, `products/*Module`) → **`@hanzo/ui/data`** (identical surface).
   - `~/components/{DetailPane,ChunkGuard}` → **`@hanzo/ui`**.
   - `app/globals.css` motion block → `import '@hanzo/ui/styles/motion.css'` (keep base resets local).
   - Move the 5 app-coupled components (§G) into the lib only after applying their inject-props contract; until then they stay local.
3. Verify **identical render**: `tsc --noEmit` + `vitest` + `next build` green, then headless-Playwright the live pages pixel-same (the polish is byte-identical, so parity is expected).

**Report:** `@hanzo/ui` is the ONE unified library — product layer + record layer (`@hanzo/data`) + charts + calm tokens + motion, all on `@hanzo/gui`, presentational, cross-platform, clean-room, GREEN. Console re-point is **ready to apply once the CMS/ERP/Help lanes land**; it was not merged to avoid colliding with that in-flight work.

## Follow-ups (semver-minor, with visual e2e)

- Collapse the preserved Sparkline/Donut variants to one each (`MetricSparkline`→`Sparkline`, `DonutRing`→`Donut`) once call-sites are proven identical.
- Lift §G's five components after applying their prop-injection contracts.
- Consider publishing the pure `framework`/`base-data` mappers as a small `@hanzo/base-data` adapter (not UI).
