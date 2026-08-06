/**
 * The product → Sentry DSN registry.
 *
 * An app declares WHAT it is (`product: 'console'`); this module knows WHERE its
 * errors go. That split is the whole point: no surface has to learn a DSN, carry
 * a build argument, or grow a config file to report errors — declaring the
 * product it already declares is enough.
 *
 * A Sentry DSN is PUBLIC by construction. It ships inside the client bundle and
 * is readable in devtools on any deployed page, and it grants exactly one
 * capability: submitting new events. It cannot read issues, projects, or any
 * other data. So committing it is not leaking a secret — it is recording a public
 * identifier next to the code that needs it. (Contrast the server-side collector
 * DSN in the `team-analytics-sentry` Secret, which is HMAC-derived and revocable
 * precisely because a server-side credential is NOT public.)
 *
 * Why a literal map instead of deriving `hanzo-${product}`: the projects predate
 * this registry and do not derive cleanly — `site` lives in `hanzo-ai`, not
 * `hanzo-site`. An explicit map is honest about that; a derivation rule plus an
 * exception table is the same data with a trap in it.
 *
 * Projects are org-scoped and named `<org>-<app>`. To add one: create the project
 * (POST /v1/sentry/projects with X-Org-Id), then add its `dsn` here keyed by the
 * product name the app passes to `createAnalytics`.
 */

/** PRODUCT_PROJECT maps a `product` to its Sentry project id. The DSN's KEY is no
 *  longer a per-project secret — it is the ONE org publishable key (below), so a
 *  surface's errors ride the SAME key its events do. The id only names WHICH
 *  project the errors group under, and cloud auto-provisions that project on first
 *  keyed ingest, so a new id needs nothing minted. `site` lives in the `hanzo-ai`
 *  project — an explicit map, because the projects predate this and do not derive
 *  cleanly from the product name. */
export const PRODUCT_PROJECT: Readonly<Record<string, string>> = Object.freeze({
  console: '019fa40b-94ae-7f1d-8f7b-e92f123fad42', // console.hanzo.ai
  app: '019f9b1e-57eb-7171-9d92-72c0b85e4b4b', // hanzo.app
  site: '019f9b1e-5785-7359-ad0b-f75db8e58c99', // hanzo.ai (marketing; product `site`)
})

/** dsnForProduct builds the product's Sentry DSN — the ONE org publishable key at
 *  its project's envelope endpoint — or undefined when the product has no project
 *  yet, which leaves the error plane inert rather than posting into the wrong one.
 *  Same key as the event stream: cloud resolves it to the org and attributes the
 *  errors there. */
export function dsnForProduct(product: string | undefined): string | undefined {
  if (!product) return undefined
  const projectId = PRODUCT_PROJECT[product]
  if (!projectId) return undefined
  return `https://${HANZO_PUBLISHABLE_KEY}@api.hanzo.ai/v1/sentry/${projectId}`
}

/** The hanzo org's publishable ingest key. Like the DSNs above it is PUBLIC by
 *  construction: write-only — it attributes a write and mints no reading
 *  principal — so it ships in the bundle and is readable in devtools, exactly as
 *  hanzo.id already inlines it. It is the value KMS holds at `deploy/PUBLISHABLE_KEY`
 *  and every fleet Dockerfile passes as the `PUBLISHABLE_KEY` build-arg; baking it
 *  as the default is the SAME move `dsnForProduct` makes for errors — a hanzo
 *  surface on the hanzo cloud emits attributed with zero wiring, and no build can
 *  ship unkeyed (the failure that files anonymous traffic under `$public`, which
 *  drops every track/identify/group and answers 200). */
export const HANZO_PUBLISHABLE_KEY =
  'pk-live-c88649f1085fb6ad441d8a0072933a9b'

/** defaultPublishableKey resolves the baked hanzo key, but ONLY for the explicit
 *  hanzo cloud host (api.hanzo.ai) — the host the public, anonymous-traffic
 *  surfaces use. It is deliberately NOT applied to a same-origin `''` host: that
 *  is the shape a cookie/session app uses (it attributes signed-in users through
 *  the session, so it needs no anonymous key), AND it is the one host a
 *  white-label surface shares with hanzo, so defaulting it could attribute the
 *  wrong org. A custom host gets undefined. An explicit `ingestKey`, or an
 *  inlined NEXT_PUBLIC_PUBLISHABLE_KEY, still wins over this. */
export function defaultPublishableKey(host: string | undefined): string | undefined {
  return host === undefined || host === 'https://api.hanzo.ai'
    ? HANZO_PUBLISHABLE_KEY
    : undefined
}
