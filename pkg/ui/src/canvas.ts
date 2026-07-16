// @hanzo/ui/canvas — the PaaS project canvas, re-exported from its home package
// @hanzo/canvas (a Railway-grade pannable/zoomable board of service nodes with
// live status, metric sparklines, deploy timelines, an environment switcher and
// a service detail drawer). Kept as a thin subpath so a console can
//
//   import { ProjectCanvas, ServiceNode, ServiceStatusBadge, DeployTimeline,
//            EnvSwitcher, ServiceDetailDrawer } from '@hanzo/ui/canvas'
//
// while the code lives once in @hanzo/canvas. Optional peer — only pulled when
// the subpath is used.
export * from '@hanzo/canvas'
