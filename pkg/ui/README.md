# @hanzo/ui

The **one** Hanzo component library, built on [`@hanzo/gui`](https://github.com/hanzoai/gui) (Tamagui) so every component runs on **web, native (iOS), and desktop**. It unifies what used to be three fragmented homes — `@hanzo/data`, the console's in-app `components/ui/*`, and ad-hoc duplicates — into one canonical, presentational, host-agnostic, clean-room library.

> **v8+** is one substrate: every component renders through `@hanzo/gui`, so one import works on web, native and desktop. The v5.x Radix + Tailwind line is a different architecture and is retired — see `CONSOLIDATION.md` at the repo root.

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

## The DocType renderer — one UI for every business app

`@hanzo/ui/framework` renders the **Hanzo Framework** DocType engine (`hanzoai/cloud
clients/framework`, live at `/v1/framework/*`; also published as
[`hanzoai/framework`](https://github.com/hanzoai/framework) over
[`hanzoai/doctype`](https://github.com/hanzoai/doctype)). The engine is
metadata-driven: a CMS Page, an ERP Sales Order, a Helpdesk Ticket and a CRM
Company are the same kind of thing — a DocType with typed fields. So they get the
same renderer. An **app lane is a `module` filter** over the DocType registry plus
its own copy; there is no per-lane list, form, detail or builder to drift.

```tsx
import { createFrameworkClient } from '@hanzo/ui/framework/core'      // transport only
import { CollectionsBrowser, DocTypeRecords, DocTypeDetail } from '@hanzo/ui/framework'

// The HOST owns transport: paths are relative to the framework root, so the app
// decides the origin + the credential. Nothing in the library picks a URL.
const client = createFrameworkClient({
  get: (p) => api.get(`/v1/framework/${p}`),
  post: (p, b) => api.post(`/v1/framework/${p}`, b),
  put: (p, b) => api.put(`/v1/framework/${p}`, b),
  del: (p) => api.del(`/v1/framework/${p}`),
})

<CollectionsBrowser client={client} module="erp" label="ERP" … onOpen={openCollection} />
<DocTypeRecords client={client} doctype="erp-sales" onOpen={…} onCreate={…} />
<DocTypeDetail  client={client} doctype="erp-sales" name={name} onBack={…} onView={…} />
```

**Mobile first — a rule, not a fallback.** The layout is decided from the
CONTAINER's measured width (`onLayout`, so a narrow pane on a wide screen is still
a phone), and the answer to "not measured yet" is PHONE. So the first paint —
SSR included — is a stacked **card** per record; the `@hanzo/data` table is the
enhancement applied once the box proves it can hold one. Every control meets the
44px tap floor (WCAG 2.5.5) at phone width, and the table honors the DocType's own
`inListView` projection so a twelve-field document does not become a horizontal
scroll wall.

**Two entries, because they are two different things.** `./framework/core` is the
contract — wire types, the client, the metadata↔render mapping, the builder
projection, the media model. It imports no React and no `@hanzo/gui`, so a data
layer, a server route or a plain node test can bind the engine without loading a
component tree. `./framework` re-exports all of it plus the views.

**Ports, not bindings.** The client takes a `FrameworkTransport`; the DAM takes a
`MediaStore` (ensure-bucket / presign / put / delete) and a **bucket parameter**,
so ERP attachments never land in a bucket named after the CMS. Routing is
`onOpen`/`onCreate`/`onBack`/`onView` callbacks — no router import anywhere.

**One entry, not two.** 8.0.24 shipped a first `./framework` lift with the same
`createFrameworkClient(Transport)` shape but no builder, no DAM and no mobile
layout, injecting `renderBuilder`/`renderMedia` instead. 8.0.25 is the convergence:
the same entry, a superset implementation, and every 8.0.24 name still resolves —
`Transport` aliases `FrameworkTransport`, `Loader` aliases the in-flow `Loading`,
`setupDescription`/`setupBullets` stay optional (they now fall back to copy DERIVED
FROM THE LANE, which is the actual fix — the old default was one lane's words), and
`renderBuilder`/`renderMedia` still win when supplied. A host that passes neither
now gets the real built-in `CollectionBuilder`/`MediaGrid` instead of nothing.

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
