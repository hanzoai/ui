# @hanzo/cd

A presentational, data-prop-driven React surface for a full CD/GitOps console —
a clean-room port of the [Argo CD](https://github.com/argoproj/argo-cd) UI
(Apache-2.0; see `NOTICE`). Every component takes typed props and renders; it
never fetches. The embedding app wires the Hanzo native CD API (`/v1/gitops`) and
maps its rows into these view-models.

```ts
import {
  GitopsAppList,      // applications grid/table (health, sync, revision, search)
  GitopsAppDetails,   // the app view shell (header + tree + node panel + sync)
  GitopsAppTree,      // resource-tree topology (health/sync color-coded, pan/zoom)
  GitopsNodeInfo,     // node drill-in: manifest / diff / events / logs
  GitopsSyncPanel,    // sync + rollback panel
  GitopsRollbackDialog,
  GitopsDiffView,     // colorized desired-vs-live unified diff
  ResourceNode,       // a single resource card (kind + health + sync)
  HealthBadge,        // Healthy / Progressing / Degraded / Suspended / Missing / Unknown
  SyncBadge,          // Synced / OutOfSync / Unknown
  GitopsStyles,       // one <style> tag: theme-aware CSS for the whole surface
} from '@hanzo/cd'
```

## Design

Two orthogonal status axes, exactly as Argo CD models them — never conflated:

- **Health** — `Healthy | Progressing | Degraded | Suspended | Missing | Unknown`
- **Sync** — `Synced | OutOfSync | Unknown`

The pure folds (`foldHealth`, `foldSync`, `buildResourceGraph`, `classifyDiff`)
are React-free and unit-tested in isolation, importable without pulling in any
component:

```ts
import { foldHealth, foldSync, buildResourceGraph, classifyDiff } from '@hanzo/cd/pure'
```

The resource-tree topology reuses `@hanzo/canvas`'s deterministic layered layout
(`layoutGraph`) — no separate graph dependency. Nodes are laid out left-to-right
by parent references (Application → Service → Deployment → ReplicaSet → Pod, plus
Ingress, ConfigMap, certificates…) and color-coded by health and sync.

## Theming

Presentational and theme-aware. Mount `<GitopsStyles />` once (or inline
`GITOPS_CSS`); drive the `theme` prop off your app's resolved theme. Status colors
are semantic (Argo CD hues) and overridable via the `healthPalette` / `syncPalette`
props. Migrates cleanly to `@hanzo/gui` primitives when that base lands — the
components are clean-room React over a small scoped stylesheet.
