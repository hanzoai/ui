// @hanzo/cd — a presentational, data-prop-driven React surface for a full
// CD/GitOps console. A clean-room port of the Argo CD UI (Apache-2.0; see NOTICE).
//
//   import {
//     GitopsAppList, GitopsAppDetails, GitopsAppTree, GitopsNodeInfo,
//     GitopsSyncPanel, GitopsRollbackDialog, GitopsDiffView,
//     ResourceNode, HealthBadge, SyncBadge, GitopsStyles,
//   } from '@hanzo/cd'
//
// Every component takes typed props and renders; the embedding app wires the
// Hanzo native CD API (/v1/gitops) and maps its rows into the view-models.

// Data contract + pure folds (React-free) — also at `@hanzo/cd/pure`.
export * from './pure'

// Theme + styles
export { GitopsStyles, GITOPS_CSS, THEME_VARS, themeStyle } from './styles'

// Status marks + kind glyphs
export { HealthMark, SyncMark, ResourceKindGlyph, Chevron } from './glyphs'

// Badges
export { HealthBadge, type HealthBadgeProps } from './HealthBadge'
export { SyncBadge, type SyncBadgeProps } from './SyncBadge'

// Resource node + tree topology
export { ResourceNode, type ResourceNodeProps } from './ResourceNode'
export { GitopsAppTree, type GitopsAppTreeProps } from './ResourceTree'

// Node drill-in (manifest / diff / events / logs) + diff view
export { GitopsNodeInfo, type GitopsNodeInfoProps, type NodeInfoTab } from './NodeInfoPanel'
export { GitopsDiffView, type GitopsDiffViewProps } from './DiffView'

// Applications list
export { GitopsAppList, type GitopsAppListProps } from './ApplicationsList'

// Sync + rollback
export { GitopsDialog, type GitopsDialogProps } from './Dialog'
export {
  GitopsSyncPanel,
  type GitopsSyncPanelProps,
  GitopsSyncDialog,
  type GitopsSyncDialogProps,
  type SyncOptions,
} from './SyncPanel'
export { GitopsRollbackDialog, type GitopsRollbackDialogProps } from './RollbackDialog'

// The app detail shell (composes the above)
export { GitopsAppDetails, type GitopsAppDetailsProps } from './ApplicationDetails'
