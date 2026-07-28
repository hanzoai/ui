// @hanzo/cd/pure — the React-free surface: the data contract + the pure folds
// (health/sync normalization, resource-tree layout, diff classing). Import from
// here (not the package root) when you only need the logic — e.g. a host's data
// mapper and its unit tests — so you never pull in any component or React.

export type {
  HealthStatus,
  SyncStatus,
  OperationPhase,
  StatusPalette,
  ResourceRef,
  ResourceHealth,
  ResourceInfo,
  AppTreeNode,
  ResourceTree,
  AppSource,
  AppDestination,
  GitopsApplication,
  ManagedResource,
  DiffLineType,
  DiffLine,
  DiffStats,
  AppEvent,
  LogLine,
  RevisionHistory,
} from './types'

export {
  foldHealth,
  healthColors,
  healthLabel,
  healthRank,
  healthSpins,
  rollupHealth,
  HEALTH_PALETTE,
  HEALTH_RANK,
} from './health'

export {
  foldSync,
  syncColors,
  syncLabel,
  syncRank,
  syncSpins,
  rollupSync,
  SYNC_PALETTE,
  SYNC_RANK,
} from './sync'

export {
  buildResourceGraph,
  resourceId,
  type ResourceGraph,
  type ResourceGraphNode,
  type ResourceGraphEdge,
  type ResourceGraphOptions,
} from './tree'

export { classifyDiff, lineDiff, diffStats } from './diff'
