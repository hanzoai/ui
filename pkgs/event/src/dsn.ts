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

/** PRODUCT_DSN maps a `product` to the DSN its errors are submitted to. */
export const PRODUCT_DSN: Readonly<Record<string, string>> = Object.freeze({
  // hanzo-console — console.hanzo.ai (also served embedded by the cloud binary)
  console:
    'https://1:0c8054dbde157f4f420c56b58660052b2ad782293c4de1d606ef8fbc46a0bf34@api.hanzo.ai/v1/sentry/019fa40b-94ae-7f1d-8f7b-e92f123fad42',
  // hanzo-app — hanzo.app
  app: 'https://1:b3e1173125568c80f91ef4b1fabbbd2d7e22341de02b33ce7e22ef4fc16a196e@api.hanzo.ai/v1/sentry/019f9b1e-57eb-7171-9d92-72c0b85e4b4b',
  // hanzo-ai — hanzo.ai (the marketing site; `site` is the product name it declares)
  site: 'https://1:d9cbfb844958bd7ef2a455600f00fbf237fbd71b75c1504f137773096d6aa53f@api.hanzo.ai/v1/sentry/019f9b1e-5785-7359-ad0b-f75db8e58c99',
})

/** dsnForProduct resolves the registered DSN for a product, or undefined when the
 *  product has no project yet — which leaves the error plane inert rather than
 *  guessing a destination and silently posting a surface's errors into the wrong
 *  project. */
export function dsnForProduct(product: string | undefined): string | undefined {
  if (!product) return undefined
  return PRODUCT_DSN[product]
}
