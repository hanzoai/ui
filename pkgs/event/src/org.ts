/**
 * Which org owns a host's telemetry.
 *
 * A surface should not have to LEARN its key. It already knows the domain it is
 * served from, and a domain belongs to exactly one brand, so the key is derivable
 * and asking a surface to carry one is asking it to restate something already
 * true. This module answers `orgOf(location.hostname)` and hands back that org's
 * publishable key, which is what lets a static export report correctly while
 * configuring nothing.
 *
 * This is the SAME question `hanzo.id` answers at runtime for the identity hosts
 * (`pkgs/shared/src/ingest.ts`): one image serves every brand, so the key cannot
 * be a property of the build. It was, and the bill is on record — Lux's, Zoo's,
 * Osage's and Pars' visitors were all filed in HANZO's project, because one
 * build-time key was inlined for every brand. That is the white-label boundary
 * crossed in the direction that shows up latest. The marketing sites carry the
 * identical defect in its other form: each commits its OWN key literal, so the
 * fleet holds N copies of a value with one source, and a site added tomorrow
 * reports nothing until somebody remembers to paste one in.
 *
 * A `pk-` is PUBLISHABLE: it authorizes a write into one org and mints no reading
 * principal. It is readable in devtools on every deployed page that sends an
 * event, so stating it here exposes nothing that serving the page did not. What
 * it does buy is that correct attribution becomes the DEFAULT rather than
 * something each surface opts into.
 *
 * Keyed by ORG, never by host: a brand's facts repeat on every alias it owns
 * (`lux.id`, `id.lux.network`), and a key stated per host would have to be
 * repeated too — so the day someone adds an alias and forgets the key, that host
 * silently stops reporting. Stated once per org, a new alias inherits its brand's
 * key by naming its brand's domain, which is all an alias ever says.
 */

/** One publishable key per org. */
export type Keyring = Readonly<Record<string, string>>

/**
 * Each org's registrable domains. A host matches a domain when it IS that domain
 * or a subdomain of it, so `explore.lux.network` needs no entry of its own.
 *
 * An org absent from this table resolves to undefined, and that is deliberate:
 * `osage`, `pars` and `bootnode` have no project of their own yet, and reporting
 * NOTHING is the honest answer. Filing them under a brand that is not theirs is
 * the defect this module exists to prevent — it is silent, it reads as working,
 * and it is only visible later in someone else's warehouse.
 */
export const ORG_DOMAIN: Readonly<Record<string, readonly string[]>> = Object.freeze({
  hanzo: Object.freeze(['hanzo.ai', 'hanzo.app', 'hanzo.chat', 'hanzo.id', 'hanzo.bot', 'hanzo.sh']),
  lux: Object.freeze([
    'lux.network',
    'lux.exchange',
    'lux.market',
    'lux.finance',
    'lux.financial',
    'lux.credit',
    'lux.fund',
    'lux.id',
  ]),
  zoo: Object.freeze(['zoo.ngo', 'zoo.network', 'zoolabs.id']),
})

/**
 * Each org's publishable key — the same values `universe`'s `SPA_INGEST_KEYRING`
 * serves to the identity hosts, which are each brand's own insights team token.
 * Add an org here the day its project exists, never before.
 */
export const ORG_KEY: Keyring = Object.freeze({
  hanzo: 'pk-rM_CdaF2MQckGCrla113SrR1oH4zvqN8xh2I95Z9tY8',
  lux: 'pk-gUZp6ZVfhJzSwK-rb4oLbVkpCnMBx5uSCpxf_5yEhQk',
  zoo: 'pk-3TKpKnERV9AQSsBUERWkZejC1O1mUxc1jRzsP3MPbs4',
})

/** `pk-` is publishable; `sk-` is not, and there is no third thing. Checked at the
 *  one point a key becomes something a page will send, so a mistyped entry fails
 *  closed rather than putting a secret in every visitor's tab. */
const PUBLISHABLE = 'pk-'

/** Strip the port and case a hostname the way a domain compares. */
const normalize = (host: string): string =>
  host.trim().toLowerCase().replace(/\.$/, '').split(':')[0] ?? ''

/**
 * The org that owns a host, or undefined when no brand claims it.
 *
 * Longest match wins, so a brand owning both a domain and a subdomain of another
 * brand's cannot be decided by table order. Pure and total.
 */
export function orgOf(host: string): string | undefined {
  const h = normalize(host)
  if (!h) return undefined
  let best: string | undefined
  let bestLen = 0
  for (const [org, domains] of Object.entries(ORG_DOMAIN)) {
    for (const d of domains) {
      if ((h === d || h.endsWith(`.${d}`)) && d.length > bestLen) {
        best = org
        bestLen = d.length
      }
    }
  }
  return best
}

/**
 * The publishable key for a host, or undefined when there is not exactly one to
 * give.
 *
 * Deliberately WITHOUT a fallback: returning Hanzo's key for an unrecognised host
 * is precisely the defect described above. Undefined is the honest answer and the
 * caller reports nothing.
 *
 * `keyring` is a parameter so the identity runtime — which receives its keyring
 * from `/config.json` because one image serves every brand — resolves through
 * this SAME function rather than a second copy of it.
 */
export function keyFor(host: string, keyring: Keyring = ORG_KEY): string | undefined {
  const org = orgOf(host)
  if (!org) return undefined
  const key = keyring[org]
  if (typeof key !== 'string') return undefined
  const trimmed = key.trim()
  return trimmed.startsWith(PUBLISHABLE) ? trimmed : undefined
}

/** The key for the page this code is running on; undefined off a browser. */
export function keyForPage(keyring: Keyring = ORG_KEY): string | undefined {
  if (typeof location === 'undefined') return undefined
  return keyFor(location.hostname, keyring)
}
