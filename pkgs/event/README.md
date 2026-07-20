# @hanzo/capture

Tiny, batched product-analytics capture client for Hanzo surfaces. Emits
`pageview` / `event` / `identify` / `group` to **Hanzo Cloud** — never to a
third-party or to `insights-capture` directly. Cloud (`/v1/analytics` +
`/v1/tracker`) is the one front door and fans out to the insights/datastore
warehouse.

- **Batched** with a size + interval flush, and **beacon-on-unload**
  (`sendBeacon` for cookie apps, `fetch(keepalive)` for token apps).
- **First-touch attribution**: UTM + referrer + `refCode` are parsed once and
  persisted, then attached to every event.
- **Cohorts**: `signupWeek`, `channel`, `refCode` ride each event.
- **Tenant-safe**: the client NEVER sends an org/tenant — Cloud stamps it from
  the validated session.
- **SSR-safe**: importing on the server is a no-op; it only acts in the browser.

## Core (framework-agnostic)

```ts
import { createAnalytics, EVENTS } from '@hanzo/capture'

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
import { AnalyticsProvider, useAnalytics, usePageview } from '@hanzo/capture/react'
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

## Goals & cohorts

`GOALS` and `COHORTS` (see `goals.ts`) are the shared, machine-readable insights
spec: **Signup** (funnel view→submit→verify→first-action), **Sale** (a
`order_completed` with `kind=plan`), and **Upgrade Intent** (`plan_clicked`,
funnel from `pricing_viewed`). Cohort fields map to the `signup_week`,
`channel`, and `ref_code` columns of `hanzo.events`.
