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
  - **The identity trio** — one row of chrome, three switchers: `OrgSwitcher` (which workspace, `direction` up or down, `footer` for a surface's own rows), the app switcher inside `AppHeader`, and `UserMenu` (who I am). `AppHeader` composes all three; each is importable alone, so a surface that wants an account menu without the whole header does not write a sixth one.
  - **Settings**: `Fieldset` — the titled, optionally destructive group the `Field*` rows sit in. Not `Panel`: that is a dashboard metric tile.
  - **Interaction**: `ComboBox` (typeable, ReDoS-safe filter), `SelectMenu`, `SlideOver` (a11y drawer), `Toast` (`useToast`), `Reorder` (pointer DnD), `Field*` rows, `CopyButton`, `SecretInput` (mask · reveal · copy), `Pagination` (+ the pure `pages` rule), `FadeIn`, `ThemeToggle`, generic `DataTable<T>`.

> **Masking needs both spellings.** `secureTextEntry` is React Native's and gui **drops it on web**, so an input carrying only that prop renders the secret in plain text; `type="password"` is the web one and native ignores it. `masked(on)` sets both and is what `SecretInput` and `<FieldText secure>` use. Never pass `secureTextEntry` alone.
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

## Analytics — one flag, and the components report themselves

```tsx
import { Hanzo } from '@hanzo/ui'

<Hanzo analytics={{ product: 'console', ingestKey: process.env.NEXT_PUBLIC_EVENT_INGEST_KEY }}>
  <App />
</Hanzo>
```

That is the entire wiring. Every click, form change, submit and route change
inside the tree arrives on the ONE front door (`POST /v1/event`) annotated with
the component it happened on — no `onClick` handler anywhere reports anything,
and no call site changes:

```jsonc
{
  "event": "$click",
  "$el": "card/button[Save]",      // the significant-node trail, root→leaf
  "$role": "button",
  "$component": "button",          // from the data-slot every primitive carries
  "$name": "Save"
}
```

Component names are real **in production**. Every primitive here stamps a
`data-slot` through one helper (`slot()`), and the capture engine reads it — so
attribution does not depend on React fiber owners, which a production build
minifies away. A component that wants a better name than its slot says so once,
on itself: `data-hz-name="SaveButton"` outranks everything.

### What it is made of — one of each

| Concern | Package | There is exactly one |
|---|---|---|
| Client + wire | [`@hanzo/event`](../../pkgs/event) | endpoint `POST /v1/event`, batched, beacon-on-unload |
| Capture engine | [`@hanzo/observe`](../../pkgs/observe) | delegated listeners, semantic annotation, redaction |
| Provider + consent | `@hanzogui/telemetry` | `<TelemetryProvider/>`, which `analytics` renders |

`analytics` is a **prop, not a default**. Mounting a component library must
never start a network conversation the app did not ask for: without it `<Hanzo>`
renders no provider, installs no listener and sends nothing.

### It cannot double-count

An app that already mounts `<TelemetryProvider/>` itself leaves `analytics`
off — but if both are mounted, the events still do not double. The capture
engine installs *delegated* listeners on a root, so two engines on one root
would report every interaction twice; a page-wide claim (`Symbol.for`, so
duplicate copies of the package in one bundle still see each other) gives the
root to the first engine and leaves any later one inert. Both providers also
resolve the same client, so there is one session and one stream either way.

### Privacy

Consent decides whether any of it runs: Global Privacy Control, Do Not Track,
and a stored choice a consent banner records — which outranks the browser signal
in **both** directions, because that is what explicit means. Beyond that:

- **Input values are withheld.** `$input`/`$change` carry the field's kind and
  value length, never the typed text.
- **Sensitive fields are never captured at all** — password, email, card, cvv,
  token, ssn — not even a length.
- **`data-hz-private`** on any element excludes its whole subtree.

### One ingest key

`ingestKey` is a publishable `pk-…` — write-only, safe in a bundle, minted per
org with `POST /v1/keys {"type":"publishable"}`. Omit it and the client reads
`NEXT_PUBLIC_EVENT_INGEST_KEY` from the build env, which is the spelling the
fleet already carries end to end (KMS holds `deploy/EVENT_INGEST_KEY`; the
Dockerfile takes it as a build-arg and re-exports it with the `NEXT_PUBLIC_`
prefix Next needs to inline it). A surface with no key reports only for whoever
is signed in and silently drops every logged-out visitor — the door refuses an
unattributable write rather than filing it where its owner cannot read it.

For a page with no build step at all, the same client ships as a script tag:
`@hanzo/event/hz.js`, with `data-ingest-key="pk-…"`.

### Naming a moment the components cannot see

Autocapture reports what was clicked; it cannot know that a click *was* a
checkout. Curated events live on `@hanzo/ui/product`, one closed verb set over
one event name, on the same client and the same stream:

```tsx
import { useEmit, InstrumentSurface } from '@hanzo/ui/product'

const emit = useEmit()
emit({ component: 'PlanCard', action: 'select', id: 'pro' })
```

## Design principles

- **One home, no duplication** — components are extracted, never copied. The record layer's source of truth stays in `@hanzo/data`; `@hanzo/ui` composes it.
- **Host-agnostic** — data + effects injected; zero coupling to any app.
- **Clean-room** — original implementation, no GPL / Twenty code. Airtable/Twenty-*class* polish, our own code.
- **Cross-platform** — web + native + desktop, because it's only `@hanzo/gui`.

MIT · Hanzo AI — see [LICENSE.md](../../LICENSE.md). HIP-0137 (`hanzoai/hips`).
