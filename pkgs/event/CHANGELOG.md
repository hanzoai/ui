# @hanzo/event

## 0.3.3

### Patch Changes

- **A hostile thrown object no longer costs the report.** `name`, `message` and
  `stack` are ordinary getters, and a thrown object is free to define them to
  throw — the thrown value is the least trustworthy input this library handles.
  Each is now read defensively, and `String()` coercion is guarded too, so
  `normalizeError` is total: it returns a usable record for ANY input. Both
  planes share that one normalizer; previously each rolled its own reader, so a
  throwing `stack` getter silently lost the crash report on both.
- **Bounded the email rule.** Like the creds-in-URL rule fixed in 0.3.2, the
  unbounded local-part backtracked across a long run of legal characters that
  never reached an `@`. Capped to the RFC 5321 maxima; no real address is
  excluded.

## 0.3.2

### Patch Changes

- **Errors actually reach Sentry now.** Every captured exception is framed as a
  real **Sentry envelope** and POSTed to `/v1/sentry/{projectId}/envelope/`,
  authenticated by a DSN key on `?sentry_key=`. Set `dsn` (or
  `NEXT_PUBLIC_HANZO_EVENT_DSN`); with no DSN the error plane is inert
  (fail-safe) and the event stream is unaffected.
  **This closes a total outage of the fleet's error telemetry.** Versions ≤0.3.1
  documented errors as "lensed server-side into … error tracking (sentry)". No
  such fan-out exists — `/v1/event` writes a `type:'error'` row to the event
  warehouse and stops. Every property believed the claim, nobody set a DSN, and
  **zero** errors reached the Sentry dashboard. The claim has been corrected
  everywhere it shipped (description, README, `src`).
- **The two planes are independent, in both directions.** `captureError` reports
  to Sentry FIRST, and each plane has its own `try`. `properties` is arbitrary
  caller data — a DOM node, a React synthetic event or an axios error is
  circular — and previously anything that threw while serializing the event
  stream killed the crash report before it was sent, and dropped the events
  already buffered too. Batch serialization now salvages per event.
- **Bounded the scrubber against denial of service.** The creds-in-URL pattern
  backtracked quadratically on colon-rich text: 32KB took 4.9s and 128KB never
  finished, freezing the main thread from inside `captureError`
  (`throw new Error(await res.text())` on an HTML error page is the one-line
  trigger). Input is capped at 8KB and the pattern bounded; 128KB now completes
  in ~1ms. Stack parsing is bounded the same way.
- **Card redaction is Luhn-gated.** The bare 13–19 digit rule was a
  false-positive cannon that ate every millisecond epoch timestamp
  (`request 1753468800000 timed out` → `request [redacted]timed out`), wrecking
  the readability of the messages this client exists to deliver. Gating on Luhn
  removes the false positives without adding a false negative — a real card
  always passes.
- **Transport outcome is visible under `debug`.** A non-OK or failed ingest was
  swallowed, which is the same silent-failure shape as the incident above; note
  the ingest CORS allowlist rejects non-production origins, so local dev never
  reports.
- Client-side secret + PII scrubbing (a faithful port of the server's
  `scrub.go`) now runs before any error leaves the device.

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
