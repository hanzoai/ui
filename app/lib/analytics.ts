import { createAnalytics } from "@hanzo/event"

// One client for the whole site. Pageviews (components/analytics.tsx) and
// product events (lib/events.ts) share it, so there is a single place that
// knows where telemetry goes — call sites only name what happened. Host
// defaults to the one edge (api.hanzo.ai), which is what a static site wants.
export const analytics = createAnalytics({ product: "site" })
