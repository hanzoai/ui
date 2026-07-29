/// <reference path="./css.d.ts" />
// @hanzo/canvas — a Railway-grade PaaS project canvas for any Hanzo console.
//
// A pannable/zoomable board of service nodes with live status, metric
// sparklines, deploy timelines, an environment switcher, and a service detail
// drawer. Every component is presentational and data-prop-driven: the host
// fetches its `/v1` rows and maps them into the plain view-models in `./types`.
// Built on @hanzo/gui (brand/white-label aware via the design tokens) with an
// optional @xyflow/react peer for the canvas itself.
//
//   import { ProjectCanvas, ServiceNode, ServiceStatusBadge } from '@hanzo/canvas'

// Data contract + pure helpers (no React) — also available React-free at
// `@hanzo/canvas/pure` for data mappers + their unit tests.
export * from "./pure"
export { kindGlyph, sourceGlyph } from "./glyphs"

// Presentational components
export {
  ServiceStatusBadge,
  type ServiceStatusBadgeProps,
} from "./ServiceStatusBadge"
export { MetricSparkline, type MetricSparklineProps } from "./MetricSparkline"
export { SourceRef, type SourceRefProps } from "./SourceRef"
export { ReplicaPill, type ReplicaPillProps } from "./ReplicaPill"
export { ServiceNode, type ServiceNodeProps } from "./ServiceNode"
export { DeployTimeline, type DeployTimelineProps } from "./DeployTimeline"
export { EnvSwitcher, type EnvSwitcherProps } from "./EnvSwitcher"
export {
  ServiceDetailDrawer,
  type ServiceDetailDrawerProps,
  type DrawerTab,
} from "./ServiceDetailDrawer"
export { CanvasStyles, CANVAS_CSS } from "./styles"

// The canvas (pulls in @xyflow/react — dynamic-import this with SSR disabled)
export { ProjectCanvas, type ProjectCanvasProps } from "./ProjectCanvas"
export {
  CANVAS_NODE_TYPES,
  CanvasNodeConfigProvider,
  type CanvasNodeConfig,
} from "./canvas-node"
