---
"@hanzo/capture": patch
---

Add `@hanzo/capture` — the shared product-analytics capture client. Batched
pageview/event/identify/group emit to Hanzo Cloud (`/v1/analytics` +
`/v1/tracker`) with first-touch UTM/referrer/refCode attribution,
beacon-on-unload, dual cookie/bearer auth, and the shared event + goal + cohort
vocabulary (`EVENTS`, `GOALS`, `COHORTS`). Framework-agnostic core plus a
`@hanzo/capture/react` provider and hooks.
