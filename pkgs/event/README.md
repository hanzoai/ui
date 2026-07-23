# @hanzo/event

The ONE telemetry client for Hanzo surfaces. Emits every kind of event —
`pageview` / `event` / `identify` / `group` **and errors** — to **Hanzo Cloud**,
never to a third-party. There is exactly one front door:

```
POST {host}/v1/event   body: { batch: [Event, …] }   ->  { accepted, dropped }
```

Cloud resolves the tenant server-side and fans the one stream out into three
lenses: **product analytics** (insights.hanzo.ai), **web analytics**
(analytics.hanzo.ai), and **error tracking** (sentry.hanzo.ai). Errors are just
events (`type:'error'`) on the same pipe — one client, one door.

- **Batched** with a size + interval flush, and **beacon-on-unload**
  (`sendBeacon` for cookie/publishable-key apps, `fetch(keepalive)` for token apps).
- **Auto error capture** (subsumes `@sentry`): `window.onerror`,
  `unhandledrejection`, and a React `ErrorBoundary` become `type:'error'` events;
  Cloud stamps `event_type='error'` → the sentry lens. Opt out with
  `captureErrors: false`.
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

```tsx
import { ErrorBoundary } from '@hanzo/event/react'

<AnalyticsProvider config={{ product: 'console' }}>
  <ErrorBoundary fallback={(err, reset) => <Crash error={err} onReset={reset} />}>
    <App />
  </ErrorBoundary>
</AnalyticsProvider>
```

```ts
try { risky() } catch (err) { analytics.captureError(err, { properties: { where: 'checkout' } }) }
```

Each becomes a `type:'error'` event carrying the exception; Cloud folds it into
`properties.$exception`, stamps `event_type='error'`, and it surfaces in the
error-tracking lens (`GET /v1/errors` → sentry.hanzo.ai).

## Publishable key (public pages, no bearer)

Marketing/public pages have no session. Mint a write-only publishable key
(`POST /v1/ingest/keys`) and pass it as `ingestKey`; it rides `Authorization`
on fetch and `?ingest_key` on an unload beacon, so all three lenses light up
anonymously. It is safe to ship in a bundle (write-only, cannot read).

```ts
createAnalytics({ product: 'site', host: 'https://api.hanzo.ai', ingestKey: 'pk_live_…' })
```

## Goals & cohorts

`GOALS` and `COHORTS` (see `goals.ts`) are the shared, machine-readable insights
spec: **Signup** (funnel view→submit→verify→first-action), **Sale** (a
`order_completed` with `kind=plan`), and **Upgrade Intent** (`plan_clicked`,
funnel from `pricing_viewed`). Cohort fields map to the `signup_week`,
`channel`, and `ref_code` columns of `hanzo.events`.
