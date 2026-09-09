// @hanzo/canvas/pure — the React-free surface: the data contract + the pure folds
// (status normalization, layout, relative time, color helpers). Import from here
// (not the package root) when you only need the logic — e.g. a host's data mapper
// and its unit tests — so you never pull in @xyflow/react or any JSX.

export type {
  ServiceStatus,
  ServiceKind,
  ServiceSource,
  ServiceMetric,
  ServiceCapability,
  ServiceNodeData,
  ServiceEdgeReason,
  ServiceEdgeData,
  DeployEvent,
  EnvOption,
  EnvVarRow,
  StatusPalette,
} from "./types"

export {
  normalizeServiceStatus,
  statusColors,
  statusLabel,
  statusPulses,
  DEFAULT_STATUS_PALETTE,
} from "./status"
export { relativeTime, toEpochMs } from "./time"
export {
  layoutGraph,
  type LayoutOptions,
  type PositionedId,
  type XYPosition,
} from "./layout"
export { withAlpha, kindLabel } from "./color"
