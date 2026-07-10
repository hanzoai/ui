---
"@hanzo/canvas": minor
---

feat: new `@hanzo/canvas` package — a Railway-grade PaaS project canvas.

A pannable/zoomable board of service nodes (`ProjectCanvas`) with live status
(`ServiceStatusBadge`), metric sparklines (`MetricSparkline`), deploy timelines
(`DeployTimeline`), an environment switcher (`EnvSwitcher`), and a service detail
drawer (`ServiceDetailDrawer`), plus the `ServiceNode` card and `SourceRef` /
`ReplicaPill` primitives. Presentational and data-prop-driven, built on
`@hanzo/gui` (brand/white-label aware via the design tokens) with an optional
`@xyflow/react` peer. Pure folds (status/layout/time) are unit-tested.
