import { createAnalytics } from "@hanzo/analytics"

// One client for the whole site. Pageviews (components/analytics.tsx) and
// product events (lib/events.ts) share it, so there is a single place that
// knows where telemetry goes — call sites only name what happened.
export const analytics = createAnalytics({
  host: "https://api.hanzo.ai",
  product: "site",
})
