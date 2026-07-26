/**
 * The flattened enumeration of EVERY address the ecosystem shell exposes, each
 * tagged with the surface it came from. `destinations.ts` names the canonical
 * shared links; this module walks the whole spec — origins, destinations, the
 * family, the menu, the footer, every site header, and the launcher — and yields
 * one absolute URL per link.
 *
 * Site-relative header nav (`/features`) resolves against its own property, so a
 * checker never has to re-derive which site a path belongs to. This is the ONE
 * enumeration a link check runs over (`src/addresses.live.test.ts`, or any
 * consumer's CI), so a fabricated path cannot hide behind a host-only assertion.
 *
 * Pure data, React-free.
 */
import { ORIGIN, DESTINATIONS } from "./destinations"
import { PRODUCTS } from "./family"
import { MEET_HANZO_MENU } from "./menu"
import { FOOTER } from "./footer"
import { HEADERS } from "./header"
import { SURFACES } from "./surfaces"

/** One address the spec claims, and where in the spec it is claimed. */
export interface Address {
  /** The surface that carries it, e.g. `"footer.resources"` or `"header.hanzo.bot.nav"`. */
  where: string
  /** The absolute URL — site-relative nav is resolved against its own property. */
  href: string
}

/**
 * Every address the shell exposes, in spec order. Duplicates are kept: the same
 * URL claimed from two surfaces is two claims.
 */
export const addresses = (): Address[] => {
  const out: Address[] = []
  const add = (where: string, href: string) => out.push({ where, href })

  for (const [k, v] of Object.entries(ORIGIN)) add(`origin.${k}`, v)
  for (const [k, v] of Object.entries(DESTINATIONS)) add(`destinations.${k}`, v)
  for (const p of PRODUCTS) {
    add(`family.${p.id}`, p.url)
    add(`family.${p.id}.action`, p.action.href)
  }
  add("menu.allProducts", MEET_HANZO_MENU.allProducts.href)
  for (const l of MEET_HANZO_MENU.utilities) add(`menu.utilities.${l.id}`, l.href)
  for (const l of MEET_HANZO_MENU.installs) add(`menu.installs.${l.id}`, l.href)
  for (const col of FOOTER.columns) for (const l of col.links) add(`footer.${col.id}.${l.id}`, l.href)
  for (const l of FOOTER.legal.links) add(`footer.legal.${l.id}`, l.href)
  for (const h of Object.values(HEADERS)) {
    const site = `https://${h.site}`
    const absolute = (href: string) => (href.startsWith("http") ? href : `${site}${href}`)
    for (const n of h.localNav) add(`header.${h.site}.nav.${n.id}`, absolute(n.href))
    add(`header.${h.site}.action`, absolute(h.action.href))
  }
  for (const s of SURFACES) add(`surfaces.${s.id}`, s.href)

  return out
}
