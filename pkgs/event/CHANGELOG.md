# @hanzo/event

## 0.2.0

### Minor Changes

- Renamed from `@hanzo/capture` to **`@hanzo/event`** — the ONE telemetry client.
  An error is just another event on the one stream, so error tracking now lives
  here too (subsumes `@sentry`): `captureError()`/`captureException()`, a React
  `ErrorBoundary`, and auto-capture of unhandled errors + promise rejections
  (opt-out via `captureErrors: false`). Added the `error` event kind and the
  `Exception` type. The server lenses the one stream into product analytics, web
  analytics, and error tracking (insights/analytics/sentry.hanzo.ai).

## 0.1.1

### Patch Changes

- [#240](https://github.com/hanzoai/ui/pull/240) [`8b5164a`](https://github.com/hanzoai/ui/commit/8b5164a6e122f774bad151384bb732a3dac31493) Thanks [@zeekay](https://github.com/zeekay)! - Add `@hanzo/capture` — the shared product-analytics capture client. Batched
  pageview/event/identify/group emit to Hanzo Cloud (`/v1/analytics` +
  `/v1/tracker`) with first-touch UTM/referrer/refCode attribution,
  beacon-on-unload, dual cookie/bearer auth, and the shared event + goal + cohort
  vocabulary (`EVENTS`, `GOALS`, `COHORTS`). Framework-agnostic core plus a
  `@hanzo/capture/react` provider and hooks.
