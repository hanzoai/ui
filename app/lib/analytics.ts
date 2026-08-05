import { createAnalytics } from "@hanzo/event"

// One client for the whole site. Pageviews (components/analytics.tsx) and
// product events (lib/events.ts) share it, so there is a single place that
// knows where telemetry goes — call sites only name what happened. Host
// defaults to the one edge (api.hanzo.ai), which is what a static site wants.
//
// /v1/event is authed, and deliberately does not trust the request Host — a Host
// header is spoofable, so a static page proves which org it belongs to by
// carrying a publishable key. `pk-` keys are write-only and HMAC-verified with no
// database hop, which is what makes them safe to ship inside a public bundle (the
// same reason a Sentry DSN is public). The build supplies it, so each deployment
// reports as the org that deployed it; without one cloud answers
// `401 ingest_key_required` and every logged-out pageview is dropped in silence.
//
// NEXT_PUBLIC_PUBLISHABLE_KEY is the ONE name, and it is the name the fleet
// already carries end to end: KMS holds `deploy/PUBLISHABLE_KEY`, the Dockerfile
// takes it as the PUBLISHABLE_KEY build-arg and re-exports it with the
// NEXT_PUBLIC_ prefix that makes Next inline it.
//
// This file used to read NEXT_PUBLIC_HANZO_INGEST_KEY — a spelling nothing in KMS
// or CI carries, so no builder could ever supply it. A key reached the live bundle
// exactly once, passed by hand on a local `docker build`, and that is the failure
// this rename removes: a name only a human can satisfy gets satisfied once and
// then goes stale silently. The key v5.7.6 shipped (`pk_…`, the older format) is
// now dead — api.hanzo.ai answers `401 ingest_key_required` for it on both
// transports, so ui.hanzo.ai has been dropping every logged-out pageview.
//
// Written as a full literal on purpose: Next replaces textual `process.env.
// NEXT_PUBLIC_*` occurrences at build time, so a name assembled at runtime
// resolves to undefined in a static export.
export const analytics = createAnalytics({
  product: "site",
  ingestKey: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
})
