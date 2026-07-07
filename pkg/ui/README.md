# @hanzo/ui

The **one** Hanzo component library, built on [`@hanzo/gui`](https://github.com/hanzoai/gui) (Tamagui) so every component runs on **web, native (iOS), and desktop**. It unifies what used to be three fragmented homes — `@hanzo/data`, the console's in-app `components/ui/*`, and ad-hoc duplicates — into one canonical, presentational, host-agnostic, clean-room library.

> This is the gui-based line (**v8+**). The legacy shadcn/Radix `@hanzo/ui` (v5.x) is a different architecture; it is being retired to `@hanzo/ui-shadcn` so the `@hanzo/ui` name carries the unified gui-based library forward — see `CONSOLIDATION.md` at the repo root.

## Install

```sh
bun add @hanzo/ui @hanzo/gui @hanzo/data
```

`@hanzo/gui`, `@hanzo/data`, and `react` are peers.

## Two orthogonal layers, one package

```tsx
// product / app layer — charts, metrics, headers, status, empty states, combobox…
import { PageHeader, Sparkline, LineChart, EmptyState, StatusTag, ComboBox, tokens } from '@hanzo/ui'

// metadata-driven record layer — RecordsView & the typed field editors (@hanzo/data)
import { RecordsView, DataTable, BoardView, RecordDetail, registerField } from '@hanzo/ui/data'
```

- **`@hanzo/ui`** — the product/app component layer:
  - **Charts** (dependency-free inline SVG): `Sparkline`, `LineChart`, `BarChart`, `Donut`, `BarRows` — hover tooltips, axis ticks, honest `null` under two real points.
  - **Metric** tiles/panels: `MetricCard`, `MiniBars`, `UtilBar`, `LegendDot`, `Panel`, `HintButton` (+ `MetricSparkline`).
  - **Chrome**: `PageHeader`, `StatusTag`, `EmptyState` (DO/Vercel-class first-run), `PrimaryButton`, `HanzoMark`, `ProductIcon`, `ProviderLogo`.
  - **Interaction**: `ComboBox` (typeable, ReDoS-safe filter), `SelectMenu`, `SlideOver` (a11y drawer), `Toast` (`useToast`), `Reorder` (pointer DnD), `Field*` rows, `FadeIn`, `ThemeToggle`, generic `DataTable<T>`.
  - **Tokens**: `tokens`, `TAG_TONES`, `tagTone` — the calm, dark-first, zinc-on-black identity.
- **`@hanzo/ui/data`** — the metadata-driven record layer (source of truth: `@hanzo/data`): `RecordsView` (table ⇆ board, filter/sort/search/group, inline edit, saved views), the record-grid `DataTable`, `BoardView`, `RecordDetail`/`RecordForm`, every typed field editor, the field registry, and the pure view/sort/filter logic.

Both layers are **presentational + data-injected**: the host supplies rows and persistence callbacks; the components own only interaction state. Nothing imports an app's `~/lib`.

> Each layer owns a `DataTable` — the product one is a generic typed `<T>` list; the data one is the field-driven record grid. Keeping the record layer on the `./data` subpath keeps each name unambiguous.

## Motion

The calm motion vocabulary (`FadeIn`, drawer/backdrop transitions, skeleton shimmer, live pulse) ships as one stylesheet. Import it once at the app root:

```ts
import '@hanzo/ui/styles/motion.css'
```

Every animation honors `prefers-reduced-motion`.

## Extend the record layer

```tsx
import { registerField } from '@hanzo/ui/data'
registerField('rating', { Display: MyStars, Input: MyStarPicker })
```

## Design principles

- **One home, no duplication** — components are extracted, never copied. The record layer's source of truth stays in `@hanzo/data`; `@hanzo/ui` composes it.
- **Host-agnostic** — data + effects injected; zero coupling to any app.
- **Clean-room** — original implementation, no GPL / Twenty code. Airtable/Twenty-*class* polish, our own code.
- **Cross-platform** — web + native + desktop, because it's only `@hanzo/gui`.

BSD-3-Clause · Hanzo AI
