# @hanzo/canvas

## 0.2.0

### Minor Changes

- [#239](https://github.com/hanzoai/ui/pull/239) [`520886f`](https://github.com/hanzoai/ui/commit/520886fcc2dc13dd35e987ee02087ec062c2804c) Thanks [@zeekay](https://github.com/zeekay)! - feat: new `@hanzo/canvas` package — a pannable/zoomable PaaS project canvas.

  A pannable/zoomable board of service nodes (`ProjectCanvas`) with live status
  (`ServiceStatusBadge`), metric sparklines (`MetricSparkline`), deploy timelines
  (`DeployTimeline`), an environment switcher (`EnvSwitcher`), and a service detail
  drawer (`ServiceDetailDrawer`), plus the `ServiceNode` card and `SourceRef` /
  `ReplicaPill` primitives. Presentational and data-prop-driven, built on
  `@hanzo/gui` (brand/white-label aware via the design tokens) with an optional
  `@xyflow/react` peer. Pure folds (status/layout/time) are unit-tested.
