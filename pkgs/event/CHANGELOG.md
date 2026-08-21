# @hanzo/event

## 0.3.36

### Patch Changes

- **Four live Hanzo sites were absent from the domain table, so they resolved no
  key and reported nothing.** `hanzo.works`, `hanzo.codes`, `hanzoskills.com` and
  `hanzo.ventures` are all served by universe and all answered 200 while filing
  zero events; `hanzo.team` was missing too. This is the exact failure 0.3.34
  described — "a site added tomorrow reports nothing until somebody remembers to
  paste one in" — arriving as four sites nobody pasted one into. `hanzo.ventures`
  is the clearest: it mounts `AnalyticsProvider` with
  `NEXT_PUBLIC_PUBLISHABLE_KEY || ''` and its own comment admits the key is empty.
  It now resolves Hanzo's key from its hostname and needs no edit of its own.

  A brand's domains are not a pattern — `hanzoskills.com` does not end in
  `hanzo.ai`, and `hanzo.works` is a registrable domain rather than a subdomain of
  one — so each is a separate fact and the test pins all five against the hosts
  universe actually serves.

## 0.3.35

### Patch Changes

- **The hosted tag's address here was one the door does not answer.** 0.3.33 removed
  `hz.js` and pointed readers at `api.hanzo.ai/v1/event.js`. Hours later the ingest
  door took the app's name, and the tag moved UNDER it: `.js` is part of a segment
  rather than a child of one, so a tag beside `/v1/event` could not be routed by the
  prefix that serves it. The address is `GET /v1/event/tag.js`, there is no alias
  behind the old one, and this README was sending people to a 404.

- **It also described autocapture the tag does not do.** The listed `$click`,
  `$outbound`, `$scroll`, `$form` and `$vitals` are the BUNDLED capture engine's.
  The hosted tag captures pageviews (initial and every `pushState` navigation),
  uncaught errors and rejected promises; everything deliberate goes through
  `window.hanzo`. A page reading the old paragraph would have shipped a tag
  expecting a heatmap and got none.

- Its config door is `/v1/projects/tags`, not `/v1/tags` — the config follows the
  project store it reads. A key is minted with `POST /v1/projects`, not a keys
  endpoint of its own, and one that names no project is refused `403`.

- Says plainly that a surface runs the tag OR this client, never both: they post
  pageviews to the same door, so a page carrying both counts every one twice.

## 0.3.34

### Patch Changes

- **A surface no longer configures its own key — the host resolves it.** A domain
  belongs to exactly one brand, so a key stated per site restates something the
  page already knows, and the fleet held one copy per surface of a value with a
  single source. `org.ts` answers `orgOf(location.hostname)` and hands back that
  org's publishable key, as a THIRD step after an explicit `ingestKey` and the
  KMS-sourced `NEXT_PUBLIC_PUBLISHABLE_KEY` — so it never overrides what a build
  already resolved, it only replaces going dark.

  This is the defect hanzo.id already fixed for the identity hosts, in its other
  form. There, ONE build-time key was inlined for every brand, so Lux's, Zoo's,
  Osage's and Pars' visitors were all filed in HANZO's project. On the marketing
  sites each surface commits its OWN literal instead, so a site added tomorrow
  reports nothing until somebody pastes one in. Both are the same mistake: a key
  treated as a property of the BUILD rather than of the brand being served.

  `keyFor(host, keyring?)` takes the keyring as a parameter precisely so the
  identity runtime — which receives one from `/config.json` because a single image
  serves every brand — resolves through this function rather than a second copy.

  An unrecognised host resolves to UNDEFINED and reports nothing. There is no
  fallback to Hanzo: `osage`, `pars` and `bootnode` have no project of their own,
  and filing them under a brand that is not theirs is silent, reads as working,
  and only surfaces later in someone else's warehouse.

## 0.3.15

### Patch Changes

- **One anonymous identity chain, in one file, for all three distributions.**
  0.3.14 moved `anonId()` onto a shared cookie, but only in the bundled client:
  `hz.js` still minted into `hz_id` — a KEY OF ITS OWN — and the tag the door
  hosts at `/v1/event.js` had a third implementation of the same idea. A page
  carrying two of them counted one visitor as two people, and which snippet a
  surface happened to load decided who the visitor was. The chain now lives in
  `src/anon.js` and nothing else implements it: `src/storage.ts` imports it,
  `hz.js` inlines the marked region verbatim (`src/anon.test.ts` fails on a byte
  of drift), and hanzoai/cloud vendors the same file and serves that region with
  its tag as one asset.
- **`hz_id` is adopted, not orphaned.** Resolution is cookie, else localStorage
  `hz_anon_id`, else localStorage `hz_id`, else in-memory, else mint — every id
  already in a browser is taken over, and only a browser holding none is given a
  new one. Every visitor who has ever loaded `hz.js` keeps their history.
- `hz.js` also drops its own restated UUIDv7 minter: the chain carries the one
  minter, so the version nibble the event plane's session rollups admit can no
  longer diverge between distributions. `sessionId()` is unchanged.

## 0.3.14

### Patch Changes

- **One anonymous visitor is now ONE person across every `*.hanzo.ai` surface.**
  The anonymous id lived in `localStorage`, which is ORIGIN-scoped, so docs,
  cloud, console, studio, pay and www each minted their own id for the same
  browser: a single marketing → docs → signup → checkout journey arrived as
  several strangers, and 463 anonymous identities carried 545 events in a week —
  about 1.2 events each, which is a funnel that cannot be read. `anonId()` now
  keeps the id in a first-party cookie on the registrable domain
  (`Domain=hanzo.ai; Path=/; SameSite=Lax; Secure`, two years, refreshed on
  read), which every subdomain shares.
- **The migration is additive — no returning visitor is reset.** Resolution is
  cookie, else the `hz_anon_id` this package has always written in
  `localStorage` — ADOPTED into the cookie, never minted over, because minting
  there would hand every returning visitor a new identity and detach them from
  their own history — else mint. `localStorage` keeps being written, so a
  rollback finds everyone where it left them.
- Degrades the way it always did: SSR and prerender still return `undefined`
  rather than minting a server-side id; cookies refused falls back to
  `localStorage`; both refused holds one id in memory for the page load instead
  of letting every event mint its own. `Domain` and `Secure` are omitted off
  `hanzo.ai` (localhost, previews), where either attribute would make the
  browser drop the cookie outright. `sessionId()` is deliberately unchanged — a
  session stays origin-local.

## 0.3.13

### Patch Changes

- **A credential is redacted by the parameter name it is filed under, not by its
  shape.** Every `SECRET_PATTERNS` entry recognised a secret by what it looks
  like — a JWT's three dots, `sk-`, `AKIA`, `ghp_` — but an OAuth code, a state,
  a password-reset nonce and an invite token are opaque random strings
  indistinguishable from a page id, so none matched and all survived. The client
  stamps `url` on EVERY event, so one visit to `/callback?code=&state=` put a
  live, still-redeemable authorization code on the wire once per event.
  Ordinary params (`plan`, `utm_source`, `page`) are untouched.

## 0.3.12

### Patch Changes

- **`hz.js` can finally present a key, so a keyed static surface stops filing
  nothing.** Through 0.3.11 the script tag sent no credential on either
  transport — no `Authorization`, no `?ingest_key=` — so every write from an
  origin other than the door's own was unattributed, and the door refuses an
  unattributable write (`401 ingest_key_required`). Nothing here reads the
  response, so the tag measured fine in the browser and the surface was simply
  absent from the warehouse. `data-ingest-key="pk-…"` now rides
  `Authorization: Bearer` on fetch and `?ingest_key=` on the headerless unload
  beacon — the same pair `core.ts` uses, so the door cannot tell the
  distributions apart.
- **The tag honours the consent the rest of the stack honours.** It read Do Not
  Track only. It now also obeys Global Privacy Control (the signal CPRA actually
  requires) and the `hz_consent` stored choice a Hanzo consent banner writes —
  which outranks the browser signal in BOTH directions, because that is what
  explicit means.
- **`libraryVersion` is pinned to the package version.** It had drifted to
  `0.3.9` against a published `0.3.11`, dating every static-site row in the
  warehouse to a release three patches old — including the ones that changed
  what the tag sends. A test now fails on any drift, matching the one that
  already pins `src/version.ts`.
- **The hz.js suite runs again.** Node ≥ 21 ships a real `navigator` whose
  descriptor is an accessor with no setter, so the harness's plain assignment
  threw and every test in the file failed — the one shipped file with no bundler
  and no import-time type checking had no executed coverage at all. Globals are
  defined, not assigned, and the suite now also asserts what reaches the wire:
  transport, URL and headers, not just the batch.

## 0.3.7

### Patch Changes

- **`hz.js` moved here — the tag is a distribution of this client, not a second
  client.** It lived in `hanzoai/analytics` and posted a **bare JSON array** of
  `{site, ts, type, path, …}` to `analytics.hanzo.ai/v1/event`: a second protocol
  behind an identical path spelling, served by a second collector with its own
  database. Measured, `POST api.hanzo.ai/v1/event {"batch":[]}` answered 200 and
  `POST analytics.hanzo.ai/v1/event []` answered 204, so a client pointed at the
  wrong host failed silently. The tag now emits the canonical `WireEvent` shape as
  `{ batch: [ … ] }` to `POST {host}/v1/event`, defaulting to `api.hanzo.ai`; the
  Next.js door and the collector it fed are deleted. One wire, one door, one home.
- **DOM autocapture reaches the one stream.** `$click` (with a compact, PII-light
  element locator), `$outbound`, `$scroll` depth, `$form` and `$vitals` — what a
  bundled app does not need and a plain page cannot get. `data-product` names the
  surface, `data-host` overrides the API host, `data-capture="0"` turns autocapture
  off, DNT is respected, and optional `data-ga` / `data-fb` fan out unchanged.

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
