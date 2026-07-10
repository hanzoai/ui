# @hanzo/canvas

A **Railway-grade PaaS project canvas** for any Hanzo console — a pannable /
zoomable board of service nodes with live status, metric sparklines, deploy
timelines, an environment switcher, and a service detail drawer.

Built on [`@hanzo/gui`](https://github.com/hanzoai/ui) (so it is **brand /
white-label aware** via the design tokens — the same components render in the
Hanzo, Lux, and Zoo consoles in each brand) with an optional
[`@xyflow/react`](https://reactflow.dev) peer for the canvas itself.

Every component is **presentational and data-prop-driven**: the host fetches its
`/v1` rows and maps them into the plain view-models in `./types`. The pure folds
(status normalization, layout, relative time) are unit-tested in isolation; the
components never reach into a data layer. One way to do everything, decomplected.

## Install

```sh
pnpm add @hanzo/canvas
# peers: @hanzo/gui, react, react-dom, and (for the canvas) @xyflow/react
```

## The pieces

| Export | What it is |
| --- | --- |
| `ProjectCanvas` | The pan/zoom board (React Flow): dot-grid, minimap, controls, auto-layout, theme-aware. Dynamic-import with SSR disabled. |
| `ServiceNode` | The layered service card — icon, name, type + `/v1` capability, status badge, source ref, replicas, latest-deploy time, metric sparkline. |
| `ServiceStatusBadge` | Status pill (dot + label) with a live pulse for `active`/`deploying`. |
| `MetricSparkline` | A tiny honest sparkline (flat baseline when there is no data — never a fake trend). |
| `DeployTimeline` | A vertical deploy/build timeline. |
| `EnvSwitcher` | A segmented environment switcher (production / preview / …). |
| `ServiceDetailDrawer` | A right-side drawer with a service header + host-supplied tabs (Deployments, Variables, Metrics, Logs, Domains, SBOM). |
| `SourceRef`, `ReplicaPill` | Small primitives — a repo/image source ref and a replica-count pill. |
| `normalizeServiceStatus`, `layoutGraph`, `relativeTime`, `toEpochMs`, `statusColors`, `withAlpha`, `kindLabel` | Pure helpers the host maps its data through. |

## Usage

```tsx
import dynamic from 'next/dynamic'
import { type ServiceNodeData } from '@hanzo/canvas'

// The canvas touches browser globals at import — load it client-side only.
const ProjectCanvas = dynamic(
  () => import('@hanzo/canvas').then((m) => m.ProjectCanvas),
  { ssr: false },
)

const nodes: ServiceNodeData[] = apps.map((a) => ({
  id: a.id,
  name: a.name,
  kind: 'app',
  status: normalizeServiceStatus(a.phase ?? a.status),
  source: { kind: 'image', ref: `${a.image.repository}:${a.image.tag}` },
  replicas: a.replicas,
  deployedAt: toEpochMs(a.updatedAt),
  capability: { id: 'platform', label: 'App Platform' },
}))

<ProjectCanvas
  nodes={nodes}
  edges={edges}
  theme={resolvedTheme}
  reducedMotion={reducedMotion}
  onOpenDetail={(svc) => setSelected(svc)}
/>
```

Status colors are **semantic, not brand** (green = active, amber = deploying,
red = crashed, …) and overridable per brand via the `statusPalette` prop; all
card chrome uses the neutral design tokens, so the canvas takes on each brand's
theme automatically.
