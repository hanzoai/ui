# @hanzo/dashboard

The reusable **dashboard layer on [`@hanzo/gui`](https://github.com/hanzoai/gui)**.
A set of composable, honest, reduced-motion-guarded dashboard primitives extracted
from the Hanzo Cloud Console so every Hanzo app — console, admin surfaces,
hanzo.team, desktop dashboards — builds the **same** dashboard system instead of
re-implementing it.

Everything here is **pure**: data comes in via props or a loader you supply, actions
are callbacks, and `@hanzo/gui` is a peer dependency (this layer sits _on_ it, never
forks it). No app-specific API imports.

```bash
pnpm add @hanzo/dashboard @hanzo/gui @hanzogui/lucide-icons-2
```

```tsx
import '@hanzo/dashboard/dashboard.css' // once — ships the motion keyframes
import { Overview, Kpi, Sparkline, Landing, Pipeline } from '@hanzo/dashboard'
```

> `dashboard.css` carries the loading shimmer, live-feed pulse, fade-up entrance, and
> the deploy-pipeline animations — **every one reduced-motion-guarded** (→ static).
> The count-up + live sparkline motion is driven in JS and gated on
> `prefers-reduced-motion` in the hooks.

---

## Charts — the ONE way to draw a trend / series / share / distribution

Monochrome SVG (dependency-free) that themes to the shell. Honest by construction: a
`Sparkline` with < 2 points renders nothing; `Donut`/`Bars` with no positive value
render an em-dash. Callers pass REAL series — these never fabricate data.

| Export | What it draws |
| --- | --- |
| `Sparkline` | A fixed-size mini trend (for stat tiles). |
| `Line` | A value over time (line + hover tooltip). |
| `Columns` | A value over time (vertical bars + hover). |
| `Donut` | Categorical share (optional legend, center slot). |
| `Bars` | A ranked distribution (horizontal, token-native). |
| `useContainerWidth` | Measure a container for responsive SVG. |
| `CHART_PALETTE`, `CHART_OTHER` | The categorical hues. |
| types `ChartPoint`, `Slice` | Data shapes. |

```tsx
<Line data={[{ label: 'Mon', value: 12 }, { label: 'Tue', value: 30 }]} formatValue={(v) => `${v}`} />
<Donut slices={[{ label: 'zen', value: 60 }, { label: 'gpt', value: 40 }]} legend />
<Sparkline values={[3, 5, 4, 9, 12]} />
```

## Motion — pure math + rAF/interval hooks

Unit-testable pure functions plus the thin browser hooks that drive them; every hook
self-cleans on unmount (no leaked frames/timers).

- Pure: `easeOutCubic`, `countUpValue`, `progress`, `pushSample`, `shouldTick`, `effectiveInterval`.
- Hooks: `useCountUp`, `usePoll`, `useReducedMotion`, `usePageHidden`.

```tsx
const value = useCountUp(target, /* enabled */ true) // snaps to target under reduced motion
const { tick, bump } = usePoll(15_000)                // paused when interval ≤ 0
```

## Overview — the videogame-like living dashboard

Declare a product's tiles + a REAL data loader; `Overview` renders + animates the
board and keeps it alive (one throttled poll loop, hidden-tab-paused, range selector,
count-up on change). A product is added by writing a config, never overview UI.

```tsx
import { Overview, type OverviewConfig } from '@hanzo/dashboard'
import { Cpu } from '@hanzogui/lucide-icons-2'

const config: OverviewConfig = {
  id: 'gpus', title: 'GPUs',
  live: { pollMs: 15_000, countUp: true },
  rows: [
    [{ tile: 'metric', key: 'active', label: 'Active', icon: Cpu }],
    [{ tile: 'timeseries', key: 'usage', title: 'Usage over time' },
     { tile: 'distribution', key: 'byModel', title: 'By model' }],
    [{ tile: 'activity' }, { tile: 'health' }],
  ],
  load: async ({ range }) => fromMyApi(await MyApi.overview(range)), // → OverviewData
}

<Overview config={config} isGlobalAdmin={amAdmin} />
```

The loader returns the normalized **`OverviewData`** (`kpi` / `series` / `distribution`
/ `activity` / `alerts` / `health` maps). A missing slice renders an honest empty tile
— you can over-declare tiles a slow backend hasn't filled yet. First load shows a
spinner; a failure shows a retry card; a background refetch never blanks a board that
already has real data.

### Composable primitives (use without the driver)

The tiles are also standalone, direct-props components — the valuable, reusable core:

| Export | Props (data in, view out) |
| --- | --- |
| `Kpi` | `label`, `value` (null → "—"), `unit`, `deltaPct`, `series`, `icon`, `color`, `caption`, `animate`, `loading` |
| `Feed` | `items: OverviewEvent[]`, `title`, `empty`, `loading` (virtualizes past a viewport) |
| `Board` | `items: OverviewHealth[]`, `title`, `empty`, `loading` (health tally + dots) |
| `Tile` | Render one declared tile spec against `OverviewData`. |
| `Panel`, `SkeletonBar`, `EmptyPanel`, `PanelSpinner`, `LiveDot` | Shared chrome. |

```tsx
<Kpi label="Requests" value={32_412} unit="count" deltaPct={12} series={[10,14,22,31]} icon={Zap} />
```

Plus the pure tile logic (`formatMetric`, `deltaOf`, `hasTrend`, `mergeActivity`,
`windowRows`, `statusColor`/`healthColor`/`severityColor`, `selectKpi`/`selectSeries`/
`selectDistribution`, …) and the `OverviewConfig` / `OverviewData` / tile types.

## Landing — the polished product landing kit

Compose a `LandingConfig` and render `<Landing>` to get a hero + live count-up metrics
row + an interactive code-sample block + a resources rail. Parts are exported too
(`Hero`, `Metrics`, `Samples`, `Rail`).

```tsx
import { Landing, type LandingConfig } from '@hanzo/dashboard'

const config: LandingConfig = {
  productId: 'embeddings', title: 'Embeddings',
  tagline: 'Vector search over your data.',
  brandName: 'Hanzo Cloud', docsUrl: 'https://docs.hanzo.ai', docsProduct: 'embeddings',
  primary: { label: 'Create collection', onPress: onCreate },
  loadMetrics: async () => [{ key: 'vectors', label: 'Vectors', value: 1_240, series: [...] }],
  samples: [{ lang: 'curl', label: 'cURL', code: 'curl https://api.hanzo.ai/v1/embeddings ...' }],
}

<Landing config={config}>{/* the product's own real content */}</Landing>
```

All links (docs / quickstart / examples / API / support) derive from `config.docsUrl`,
so a Lux/Zoo console links to ITS OWN surfaces. Brand + accent come from the config
(`brandName`, `accent`) — no hardcoded brand. Pure link helpers are exported
(`apexFromDocs`, `apiBaseFromDocs`, `landingDocsUrl`, `standardResources`, `supportMailto`).

## Pipeline — the deploy-stage line

A small, presentational animated pipeline (Queued → Building → Deploying → Live, or any
custom stages). Driven by a `stages` prop; derive it from a real status string with the
pure `pipelineModel`, and poll to pass fresh stages.

```tsx
import { Pipeline, pipelineModel } from '@hanzo/dashboard'

const model = pipelineModel(app.status, furthestReached) // furthest tracked across polls
<Pipeline stages={model.stages} label={model.label} />
```

Pure helpers: `pipelineModel`, `pipelinePhase`, `stageIndex`, `isTerminalPhase`,
`pipelineTone`, `PIPELINE_STAGES`, and the `PipelineStage`/`PipelineModel`/`StageState`
types. Completed stages fill with a check, the current stage pulses, the active leg
flows, a failure turns the reached stage red — all reduced-motion-guarded.

---

## Provenance — how each export maps back to the console

Extracted (and generalized: no `~/lib/*` / `~/config` imports) from
`~/work/hanzo/console2`:

| `@hanzo/dashboard` | console2 source |
| --- | --- |
| `charts/Charts` (`Sparkline`/`Line`/`Columns`/`Donut`/`Bars`) | `src/components/ui/Charts.tsx` (`Sparkline`/`LineChart`/`BarChart`/`Donut`/`BarRows`) |
| `motion/motion` + `motion/hooks` | `src/components/products/overview/living/{motion,hooks}.ts` |
| `overview/{config,logic}` | `.../overview/living/{config,logic}.ts` |
| `overview/primitives` (`Kpi`/`Feed`/`Board`) + `overview/tiles` (`Tile`) | `.../overview/living/tiles.tsx` (the tile views) |
| `overview/Overview` | `.../overview/living/LivingOverview.tsx` |
| `landing/*` (`Landing`/`Hero`/`Metrics`/`Samples`/`Rail`) | `src/components/products/landing/*` (`ProductLanding`/`LandingHero`/`LandingMetrics`/`CodeSamples`/`ResourceRail`) |
| `pipeline/{pipeline,Pipeline}` | `src/components/products/paas/{railway.ts,RailwayDeploy.tsx}` |

### Generalizations made during extraction

- **Icons** are consumer-supplied (`IconComponent` = a `size`/`color` icon), replacing
  the console's `ProductIcon` from its registry.
- **`Overview`** drops `~/lib/api` `ApiError`, `useIsGlobalAdmin`, `PageHeader`,
  `FadeIn`, and `States` — `isGlobalAdmin` is now a prop and the header/fade/error
  chrome is inlined (self-contained).
- **Landing** takes brand/docs/support/discord/accent from `LandingConfig` (was
  `~/config`). `LandingHero` inlines the hero graphic + accent button (was
  `../inference/parts`).
- **Pipeline** takes a `stages` prop and drops the console's `PaasApi.getApp`
  self-poll — the consumer polls and passes fresh stages.
- Naming is de-branded and single-word: `LivingOverview` → `Overview`,
  `RailwayDeploy` → `Pipeline`, `ProductLanding` → `Landing`, `LineChart`/`BarChart`/
  `BarRows` → `Line`/`Columns`/`Bars`. CSS classes `hz-rail-*` → `hz-pipe-*`.

---

## Follow-up: swapping console2 onto this package (a later pass)

console2 is **untouched** this pass. To consume `@hanzo/dashboard` back in console2,
per component:

1. **Charts** — delete `src/components/ui/Charts.tsx`; re-export from the package
   (`export { Sparkline, Line as LineChart, Columns as BarChart, Bars as BarRows, Donut, useContainerWidth, CHART_PALETTE, CHART_OTHER } from '@hanzo/dashboard'`)
   or update call sites to the new names. `~/components/products/inference/parts`,
   `landing/*`, and `overview/living/tiles` import `Charts` — the alias keeps them working.
2. **Motion** — replace `overview/living/{motion,hooks}.ts` with re-exports from
   `@hanzo/dashboard`; `RailwayDeploy` + `LandingMetrics` import these hooks.
3. **Overview** — replace `overview/living/{config,logic,tiles,LivingOverview}` with
   thin wrappers over the package. The console's `LivingOverviewModule` keeps its
   registry-router wrapper and passes `isGlobalAdmin={useIsGlobalAdmin()}` +
   maps `ApiError` into the driver's caught error. `PageHeader`/`FadeIn`/`States`
   stay in console (they're used elsewhere) — the driver now inlines its own.
4. **Landing** — replace `products/landing/*` with the package; the console builds a
   `LandingConfig` with `docsUrl: config.docsUrl`, `brandName: config.brandName`,
   `discordUrl: 'https://discord.gg/hanzo'`. `LandingHero`'s console-specific
   `HeroGraphic`/`AccentButton` (from `inference/parts`) are now inlined in the package.
5. **Pipeline** — swap `paas/RailwayDeploy.tsx` for `<Pipeline>`; the console owns the
   `PaasApi.getApp` poll (`usePoll` + `PaasApi`) and the monotonic `furthest` state,
   calling `pipelineModel(status, furthest)` and passing `.stages` + `.label`.

Once swapped, the console2 tests that already cover the pure logic
(`motion.test.ts`, `logic.test.ts`, `railway.test.ts`, `landing/logic.test.ts`) move
here (or re-run against the re-exports) so coverage follows the code.

## Honest about what didn't extract cleanly

- The console's **`config.ts` registry** (`LivingOverviewConfig.load` adapters:
  `fromCloudUsage`, `fromAdminOverview`, `fromFunctions`, `healthFromApps`) is
  **product/API-specific** and stays in console2 — it's the data half. This package is
  the view half; the `OverviewData` contract is the seam between them.
- Console tile icons come from the console's product registry; here they're plain
  `IconComponent` props (the consumer supplies them).
- The `Pipeline` self-poll was PaaS-coupled and is intentionally dropped — the small,
  minor pipeline primitive is presentational only.

## Build

```bash
pnpm typecheck   # tsc --noEmit (strict) — clean
pnpm build       # tsc → dist (proof; the package ships src)
```

The package **ships `src`** (source-only, like `@hanzo/data`); the consumer's bundler
transpiles it, and the `@hanzo/gui` shorthand style props type-check against the real
token unions via `gui.config.ts` + `gui.d.ts`.

License: MIT · Hanzo AI, Inc. — see [LICENSE.md](../../LICENSE.md). HIP-0137 (`hanzoai/hips`).
