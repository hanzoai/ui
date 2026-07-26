# @hanzo/event

The **ONE** telemetry client for Hanzo surfaces. Every kind of event —
`pageview` / `event` / `identify` / `group` **and errors** — rides one batched,
de-duped stream with a single session and identity. Analytics go to **Hanzo
Cloud** (`/v1/analytics` + `/v1/tracker`); errors go to the **Hanzo Sentry
product** (`/v1/sentry`) as a Sentry-compatible envelope. No third-party SDK.

- **One pipe**: `pageview` / `event` / `identify` / `group` / `captureError` — one
  client, one session, one identity. Errors are events too.
- **Batched** analytics with a size + interval flush, and **beacon-on-unload**
  (`sendBeacon` for cookie apps, `fetch(keepalive)` for token apps).
- **Error tracking** (drop-in `@sentry` replacement): auto-captures
  `window.onerror` + `unhandledrejection`, a React `ErrorBoundary`, and manual
  `captureError`/`captureException`. With a DSN it POSTs a **Sentry envelope** to
  `/v1/sentry`; without one, errors ride the analytics stream as `type:'error'`
  events. De-duplicated by signature so a flapping error never storms ingest.
- **First-touch attribution**: UTM + referrer + `refCode`, parsed once, persisted.
- **Cohorts**: `signupWeek`, `channel`, `refCode` ride each event.
- **Tenant-safe**: the client NEVER sends an org/tenant — the server stamps it
  from the validated session (analytics) or the DSN's project (errors).
- **SSR-safe**: importing on the server is a no-op; it only acts in the browser.

## Core (framework-agnostic)

```ts
import { createAnalytics, EVENTS } from '@hanzo/event'

// Cookie/session apps (console, admin): same-origin, no token.
const analytics = createAnalytics({ product: 'console' })

// Token apps (app, site): give the cloud host + a bearer getter. Add a
// Hanzo-minted DSN to route errors to /v1/sentry (else they ride /v1/analytics).
const analytics = createAnalytics({
  product: 'app',
  host: 'https://api.hanzo.ai',
  getToken: () => localStorage.getItem('hanzo_access_token') ?? undefined,
  sentryDsn: 'https://1:<hmac>@sentry.hanzo.ai/v1/sentry/<projectUUID>',
  release: 'app@1.42.0',
  environment: 'production',
})

analytics.pageview()
analytics.identify('user-42')
analytics.capture(EVENTS.SIGNUP_COMPLETED, { plan: 'pro' })
analytics.captureError(new Error('boom'))        // → /v1/sentry envelope (or /v1/analytics)
```

## React

```tsx
'use client'
import { AnalyticsProvider, ErrorBoundary, useAnalytics, usePageview } from '@hanzo/event/react'
import { usePathname } from 'next/navigation'

export function Providers({ children }) {
  return (
    <AnalyticsProvider config={{ product: 'console' }}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AnalyticsProvider>
  )
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

## Errors → /v1/sentry (the @sentry replacement)

`captureError` (and the auto/global + `ErrorBoundary` capture) normalize the
throwable, de-duplicate by signature, then — when `sentryDsn` is set — serialize
a Sentry-compatible envelope and POST it to the DSN's ingest endpoint:

```
https://<version>:<hmac>@<host>/v1/sentry/<projectUUID>
        └────────── the DSN, minted by the Hanzo Sentry product ──────────┘
                     ↓ derives
POST https://<host>/v1/sentry/<projectUUID>/envelope/?sentry_key=<version>:<hmac>
```

The envelope is newline-framed (header line · item header `{"type":"event"}` ·
event payload) and carries the same session + identity as the analytics stream.
It replaces `@sentry/nextjs`: delete `sentry.{server,client,edge}.config.ts`, drop
the `@sentry/*` dep, and point your error logger at this client's `captureError`.

## Goals & cohorts

`GOALS` and `COHORTS` (see `goals.ts`) are the shared, machine-readable insights
spec: **Signup** (funnel view→submit→verify→first-action), **Sale** (a
`order_completed` with `kind=plan`), and **Upgrade Intent** (`plan_clicked`,
funnel from `pricing_viewed`). Cohort fields map to the `signup_week`,
`channel`, and `ref_code` columns of `hanzo.events`.
