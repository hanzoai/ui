# @hanzo/event

## 0.3.2

### Patch Changes

- **`FUNNELS` — the one funnel registry.** Funnels are now data (`funnels.ts`):
  an ordered list of steps per product journey, each step naming an `EVENTS`
  value. A test fails the build if a funnel references an event no constant
  defines, so the spec cannot drift from the vocabulary. `GOALS` no longer
  restate their steps — they carry a `funnelId` and derive `funnel` from the
  registry. Shipped: `signup`, `apiActivation`, `upgrade`, `appShip`,
  `chatEngage`, `siteToChat`.
- **Fixed the Signup goal.** Its funnel required `signup_verified`, which no
  surface emits (it is IAM-internal) — the third step was always empty, so the
  goal reported 0% conversion. The funnel is now
  `$pageview → signup_viewed → signup_submitted → signup_completed → first_action`.
- **New events**, each load-bearing in a shipped funnel: `login_completed` (a
  returning sign-in is not a signup), `build_started` (build INTENT, distinct
  from `app_created`), `generation_completed` / `generation_failed` (the outcome
  of anything a model produces, carrying `durationMs`), `deploy_succeeded` /
  `deploy_failed` (a live URL is its own event, never inferred), and
  `model_switched` (the strongest dissatisfaction signal a chat surface has).
- **`PRODUCTS`** is now a closed set (`site | app | chat | console | admin |
  cloud`) — the values `AnalyticsConfig.product` may take, and what a funnel
  scopes by. Event names stay product-free: the surface is already on the wire.
- A cross-origin funnel must declare `join: 'aggregate'`. Two origins mean two
  `anonymousId`s for a logged-out visitor, so a per-person conversion across
  them would be a lie; the type makes that explicit (see `siteToChat`).
- `VERSION` had drifted to `0.3.0` while the package was `0.3.1`, so
  `libraryVersion` on every event was wrong. It now tracks package.json.
- Documented the whole thing in **`TAXONOMY.md`** — naming convention, required
  properties, identify/group semantics, the per-app funnels, and the exact
  emit sites in hanzo.ai / hanzo.app / hanzo.chat.

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
