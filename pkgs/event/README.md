# @hanzo/event

The ONE telemetry client for Hanzo surfaces. Emits every kind of event —
`pageview` / `event` / `identify` / `group` **and errors** — to **Hanzo Cloud**,
never to a third-party.

ONE API surface over **TWO** planes. They are separate pipes, and neither can
starve the other:

```
1. event stream  POST {host}/v1/event    body: { batch: [Event, …] } -> { accepted, dropped }
2. error plane   POST {dsn}/v1/sentry/{projectId}/envelope/?sentry_key=…   (a real Sentry envelope)
```

> ### Errors need a DSN. Without one, nothing reaches Sentry.
>
> **There is no server-side fan-out from `/v1/event` into Sentry.** Versions
> ≤ 0.3.1 of this README claimed there was — that "Cloud fans the one stream out
> into three lenses". It does not. `/v1/event` writes a `type:'error'` row to the
> cloud event warehouse (readable via `GET /v1/errors`) and stops there. Because
> every Hanzo property believed that claim, nobody set a DSN, and the entire
> fleet reported **zero** errors to Sentry until 0.3.2 added the envelope.
>
> Set `dsn` (or `NEXT_PUBLIC_HANZO_EVENT_DSN`). Mint one per property with
> `POST /v1/sentry/projects`. The key is publishable and write-only — safe in a
> browser bundle, same trust class as a `pk_` ingest key. No DSN means the error
> plane is **inert**: nothing is sent, nothing throws, analytics is unaffected.
> Assert `client.errorPlaneEnabled` if you want to know which you have.

### No bundler? Use the `hz.js` tag — same client, same wire

```html
<script async src="https://unpkg.com/@hanzo/event/hz.js"
        data-product="hanzo.ai"
        data-ingest-key="pk-…"
        data-capture="1"></script>
```

> **`data-ingest-key` is required off the door's own origin**, and through
> 0.3.11 this file could not present one at all — no header, no query. A keyed
> static surface therefore sent UNATTRIBUTED writes, which the door refuses
> (`401 ingest_key_required`) silently, because nothing here reads the response.
> The tag measured fine in the browser and filed nothing. It now rides
> `Authorization: Bearer pk-…` on fetch and `?ingest_key=pk-…` on a headerless
> unload beacon — the same pair the npm client uses.

`hz.js` (in this package) is the **script-tag distribution** of this client, for
surfaces with no build step. It posts the SAME `{ batch: [WireEvent, …] }` to the
SAME `POST {host}/v1/event`, and adds DOM **autocapture** — `$click` (with an
element locator), `$outbound`, `$scroll`, `$form`, `$vitals` — which a bundled app
does not need and a plain page cannot get. Manual API: `window.hanzo.track()` /
`identify()` / `page()`.

It honours the same consent sources the bundled stack does: an explicit stored
choice (`hz_consent`, the key a Hanzo consent banner writes) outranks the browser
signal in both directions; otherwise Global Privacy Control and Do Not Track are
refusals. A React app does not need this file — mount `<Hanzo analytics>` from
`@hanzo/ui`, which wires this client and the capture engine together.

> The tag used to live in `hanzoai/analytics` and post a **bare JSON array** of
> `{site, ts, type, path, …}` to `analytics.hanzo.ai/v1/event` — a second protocol
> behind an identical path spelling, served by a second collector with its own
> database. `POST api.hanzo.ai/v1/event {"batch":[]}` answered 200 while
> `POST analytics.hanzo.ai/v1/event []` answered 204, and a client pointed at the
> wrong host failed silently. Both the second door and the second collector are
> deleted. One wire, one door, one client home — this package.

- **Batched** with a size + interval flush, and **beacon-on-unload**
  (`sendBeacon` for cookie/publishable-key apps, `fetch(keepalive)` for token apps).
- **Auto error capture** (subsumes `@sentry`): `window.onerror`,
  `unhandledrejection`, and a React `ErrorBoundary` are reported on both planes —
  a Sentry envelope to the DSN host, and a correlated `type:'error'` event on the
  stream. Opt out with `captureErrors: false`.
- **Scrubbed at the source**: secrets are always redacted and PII is masked
  client-side before an error leaves the device.
- **First-touch attribution**: UTM + referrer + `refCode` are parsed once and
  persisted, then attached to every event.
- **Cohorts**: `signupWeek`, `channel`, `refCode` ride each event.
- **Tenant-safe**: the client NEVER sends an org/tenant — Cloud stamps it from
  the validated session or the signed publishable key.
- **Fail-soft**: telemetry loss is swallowed; the client never throws into the app.
- **SSR-safe**: importing on the server is a no-op; it only acts in the browser.

## Core (framework-agnostic)

```ts
import { createAnalytics, EVENTS } from '@hanzo/event'

// Cookie/session apps (console, admin): same-origin, no token.
const analytics = createAnalytics({ product: 'console' })

// Token apps (app, site): give the cloud host + a bearer getter.
const analytics = createAnalytics({
  product: 'app',
  host: 'https://api.hanzo.ai',
  getToken: () => localStorage.getItem('hanzo_access_token') ?? undefined,
})

analytics.pageview()
analytics.identify('user-42')
analytics.capture(EVENTS.SIGNUP_COMPLETED, { plan: 'pro' })
analytics.capture(EVENTS.ORDER_COMPLETED, { kind: 'plan' }, { productId: 'plan_pro', revenue: 49, quantity: 1, currency: 'usd' })
```

## React

```tsx
'use client'
import { AnalyticsProvider, useAnalytics, usePageview } from '@hanzo/event/react'
import { usePathname } from 'next/navigation'

export function Providers({ children }) {
  return <AnalyticsProvider config={{ product: 'console' }}>{children}</AnalyticsProvider>
}

function RouteTracker() {
  usePageview(usePathname()) // one pageview per navigation
  return null
}

function UpgradeButton() {
  const a = useAnalytics()
  return <button onClick={() => a.capture(EVENTS.PLAN_CLICKED, { plan: 'pro' })}>Upgrade</button>
}
```

## Errors (the @sentry replacement)

Unhandled errors and promise rejections are captured automatically. React render
errors never reach `window.onerror`, so wrap your tree in the `ErrorBoundary` to
catch those too. Report caught errors yourself with `captureError`.

**Pass a `dsn` or none of this reaches Sentry.**

```tsx
import { ErrorBoundary } from '@hanzo/event/react'

<AnalyticsProvider config={{ product: 'console', dsn: process.env.NEXT_PUBLIC_HANZO_EVENT_DSN }}>
  <ErrorBoundary fallback={(err, reset) => <Crash error={err} onReset={reset} />}>
    <App />
  </ErrorBoundary>
</AnalyticsProvider>
```

```ts
try { risky() } catch (err) { analytics.captureError(err, { properties: { where: 'checkout' } }) }
```

Each report goes to both planes:

- **Sentry** — a real Sentry envelope to the DSN's ingest route. This is the only
  thing that creates an issue in the error dashboard, with grouping and stack
  frames. Sent one envelope per error, immediately; batching a crash report is
  how you lose it.
- **the event stream** — a `type:'error'` event; Cloud folds the exception into
  `properties.$exception` and stamps `event_type='error'`, so the error stays
  correlated with the session's pageviews (`GET /v1/errors`). This is product
  signal, *not* error tracking, and it never reaches Sentry on its own.

The message and any `properties` are scrubbed of secrets and PII before sending,
and the message is capped at 8KB. `captureError` never throws back into your app,
and a failure on one plane cannot suppress the other.

## Publishable key (public pages, no bearer)

Marketing/public pages have no session. Mint a write-only publishable key
(`POST /v1/ingest/keys`) and pass it as `ingestKey`; it rides `Authorization` on
fetch and `?ingest_key` on an unload beacon, so the **event stream** accepts
anonymous traffic. It is safe to ship in a bundle (write-only, cannot read).

The `ingestKey` authenticates the event stream ONLY. The error plane
authenticates independently with the DSN key on `?sentry_key=`, and the two
credentials are never sent to each other's host. A public page that wants errors
in Sentry needs the `dsn` as well:

```ts
createAnalytics({
  product: 'site',
  host: 'https://api.hanzo.ai',
  ingestKey: 'pk_live_…',                          // event stream
  dsn: process.env.NEXT_PUBLIC_HANZO_EVENT_DSN,    // error plane
})
```

## Taxonomy, funnels & goals

**[TAXONOMY.md](./TAXONOMY.md) is the canonical spec** — naming convention,
property rules, `identify`/`group` semantics, the funnels for hanzo.ai /
hanzo.app / hanzo.chat, and the exact emit site (file:line) of every event on
each surface. Read it before adding an event.

`FUNNELS` (see `funnels.ts`) is the one funnel registry: each journey is an
ordered list of steps naming `EVENTS` values, scoped by `product`. A funnel that
spans origins while logged out is marked `join: 'aggregate'` — two origins mean
two `anonymousId`s, so a per-person rate across them would be a lie.

```ts
import { FUNNELS, GOALS } from '@hanzo/event'

FUNNELS.appShip.steps.map((s) => s.event)
// ['$pageview','build_started','generation_completed','deploy_started','deploy_succeeded']
GOALS.signup.funnel // derived from FUNNELS.signup — never restated
```

## Goals & cohorts

`GOALS` and `COHORTS` (see `goals.ts`) are the shared, machine-readable insights
spec: **Signup** (funnel view→submit→verify→first-action), **Sale** (a
`order_completed` with `kind=plan`), and **Upgrade Intent** (`plan_clicked`,
funnel from `pricing_viewed`). Cohort fields map to the `signup_week`,
`channel`, and `ref_code` columns of `hanzo.events`.
