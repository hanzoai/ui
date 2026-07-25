import { createAnalytics } from "@hanzo/event"

// One client for the whole site. Pageviews (components/analytics.tsx) and
// product events (lib/events.ts) share it, so there is a single place that
// knows where telemetry goes — call sites only name what happened. Host
// defaults to the one edge (api.hanzo.ai), which is what a static site wants.
//
// /v1/event is authed, and deliberately does not trust the request Host — a Host
// header is spoofable, so a static page proves which org it belongs to by
// carrying a publishable key. `pk_` keys are write-only and HMAC-verified with no
// database hop, which is what makes them safe to ship inside a public bundle (the
// same reason a Sentry DSN is public). The build supplies it, so each deployment
// reports as the org that deployed it; without one the client stays inert rather
// than posting events that would only be rejected.
export const analytics = createAnalytics({
  product: "site",
  ingestKey: process.env.NEXT_PUBLIC_HANZO_INGEST_KEY,
})
