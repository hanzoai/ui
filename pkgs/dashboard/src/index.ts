// @hanzo/dashboard — the reusable dashboard layer on @hanzo/gui.
//
// Composable dashboard primitives extracted from the Hanzo Cloud Console so every
// Hanzo app builds the SAME dashboard system: monochrome SVG charts, a live
// count-up KPI + streaming-feed + health Overview, the Landing kit, and a deploy
// Pipeline. Each is pure (data via props / a loader), typed, reduced-motion-guarded.
//
//   import '@hanzo/dashboard/dashboard.css'   // once, for the motion keyframes
//   import { Overview, Kpi, Sparkline, Landing, Pipeline } from '@hanzo/dashboard'

// Shared
export type { IconComponent } from './types'

// ── Charts (the ONE way to draw a trend / series / share / distribution) ─────
export {
  Sparkline,
  Line,
  Columns,
  Donut,
  Bars,
  useContainerWidth,
  CHART_PALETTE,
  CHART_OTHER,
  type ChartPoint,
  type Slice,
} from './charts/Charts'

// ── Motion (pure math + rAF/interval hooks) ──────────────────────────────────
export { easeOutCubic, countUpValue, progress, pushSample, shouldTick, effectiveInterval } from './motion/motion'
export { useReducedMotion, usePageHidden, useCountUp, usePoll } from './motion/hooks'

// ── Overview: the videogame-like living dashboard ────────────────────────────
export { Overview } from './overview/Overview'
export { Tile } from './overview/tiles'
export { Kpi, Feed, Board, Panel, SkeletonBar, EmptyPanel, PanelSpinner, LiveDot } from './overview/primitives'
export type { KpiProps, FeedProps, BoardProps } from './overview/primitives'
export {
  formatMetric,
  metricTarget,
  deltaOf,
  hasTrend,
  statusColor,
  healthColor,
  severityColor,
  worstHealth,
  healthTally,
  selectKpi,
  selectSeries,
  selectDistribution,
  distributionTotal,
  mergeActivity,
  windowRows,
  ago,
  isSkeleton,
  OK,
  WARN,
  BAD,
  MUTED,
  type Loadable,
} from './overview/logic'
export type {
  OverviewConfig,
  OverviewContext,
  OverviewData,
  OverviewRange,
  OverviewTile,
  MetricTile,
  TimeseriesTile,
  DistributionTile,
  ActivityTile,
  AlertsTile,
  HealthTile,
  MetricUnit,
  LiveConfig,
  LoadOverview,
  OverviewKpi,
  OverviewSeries,
  OverviewSlice,
  OverviewPoint,
  OverviewEvent,
  OverviewAlert,
  OverviewHealth,
} from './overview/config'

// ── Landing kit (Hero / Metrics / Samples / Rail) ────────────────────────────
export { Landing } from './landing/Landing'
export { Hero } from './landing/Hero'
export { Metrics } from './landing/Metrics'
export { Samples } from './landing/Samples'
export { Rail } from './landing/Rail'
export { LandingCard, ActionRow, DeltaChip, openExternal } from './landing/parts'
export { apexFromDocs, apiBaseFromDocs, landingDocsUrl, standardResources, supportMailto, type StandardResources } from './landing/logic'
export type {
  LandingConfig,
  LandingAction,
  LandingMetric,
  ResourceLink,
  CodeSample,
  CodeLang,
} from './landing/types'

// ── Pipeline (deploy-stage line) ─────────────────────────────────────────────
export { Pipeline, type PipelineProps } from './pipeline/Pipeline'
export {
  PIPELINE_STAGES,
  pipelinePhase,
  stageIndex,
  isTerminalPhase,
  pipelineModel,
  pipelineTone,
  type PipelinePhase,
  type PipelineStage,
  type PipelineStageName,
  type PipelineModel,
  type StageState,
} from './pipeline/pipeline'
