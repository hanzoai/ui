// @hanzo/ui/telemetry — the ONE telemetry surface, re-exported from its home in
// the framework layer (@hanzogui/telemetry) so an app that already depends on
// @hanzo/ui adds no new dependency and nothing is defined twice:
//
//   import { TelemetryProvider } from '@hanzo/ui/telemetry'
//   <TelemetryProvider>{children}</TelemetryProvider>
//
// That is the whole setup. With no configuration it wires all three planes —
// errors + session capture (sentry.hanzo.ai), pageviews (analytics.hanzo.ai),
// and product events incl. analytics_errors (insights.hanzo.ai) — through the
// ONE entry point, POST api.hanzo.ai/v1/event. Honors DNT/GPC, consent-aware,
// SSR-safe, fail-soft, no CDN script.
//
// Optional peer — only pulled when the subpath is used.
export * from '@hanzogui/telemetry'
