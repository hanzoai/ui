# @hanzo/event

## 0.3.1

### Patch Changes

- Fixed the CommonJS build: under `"type": "module"` the CJS bundle emitted to
  `dist/index.js` was parsed as ESM, so `require('@hanzo/event')` threw
  `ReferenceError: exports is not defined in ES module scope`. CJS is now emitted
  as `.cjs` (ESM stays `.mjs`) and `exports` maps each condition to its own
  types, so both `import` and `require` resolve. No API change.

## 0.3.0

### Minor Changes

- Repointed the whole client onto the ONE canonical Hanzo Cloud ingestion front
  door: **`POST /v1/event`** with the batched `{ batch: [Event, …] }` wire,
  replacing the deprecated `/v1/analytics` + `/v1/tracker` split (and the
  interim `/v1/ingest` publishable-key door — publishable keys now authenticate
  directly on `/v1/event`). One door, one wire, for cookie, bearer, and
  publishable-key auth alike.
- Errors now reliably reach the error-tracking lens. The batched Event wire
  carries the `type` field, which Cloud folds to `event_type='error'`; the
  captured exception rides the top-level `error` field (Cloud lifts it into
  `properties.$exception`). `window.onerror`, `unhandledrejection`, and the React
  `ErrorBoundary` all funnel here.
- The publishable key (`ingestKey`) rides `Authorization: Bearer pk_…` on fetch
  and `?ingest_key=pk_…` on a headerless unload beacon, so public pages emit to
  all three lenses (web + product + error) anonymously.

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
