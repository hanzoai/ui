// Analytics views, built once and mounted by analytics.hanzo.ai and by a project's
// page in the platform: the same components over the same source.
export { WebAnalytics } from './web'
export { ProductAnalytics, JOURNEY } from './product'
export {
  analyticsSource,
  windowOf,
  RANGES,
  ZONE,
  SourceError,
  type Source,
  type Range,
  type Stats,
  type Series,
  type Point,
  type Dimension,
  type Step,
  type FunnelStep,
  type Website,
} from './source'
