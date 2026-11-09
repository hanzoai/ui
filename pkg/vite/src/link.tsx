/**
 * A link to another page: an anchor. Every page is a file, so following one is
 * a load, and nothing here needs the client; it renders the same from a server
 * component or a client one.
 */
import type { AnchorHTMLAttributes, Ref } from 'react'

export type Href =
  | string
  | URL
  | { pathname?: string; query?: Record<string, string | number | boolean | readonly string[] | undefined>; hash?: string }

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: Href
  ref?: Ref<HTMLAnchorElement>
  /** Accepted for the call sites that state them; a load needs neither. */
  prefetch?: boolean | null
  replace?: boolean
  scroll?: boolean
}

export function href(to: Href): string {
  if (typeof to === 'string') return to
  if (to instanceof URL) return to.toString()
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(to.query ?? {})) {
    if (v === undefined) continue
    for (const one of Array.isArray(v) ? v : [v]) query.append(k, String(one))
  }
  const q = query.toString()
  const hash = to.hash ? (to.hash.startsWith('#') ? to.hash : `#${to.hash}`) : ''
  return `${to.pathname ?? ''}${q ? `?${q}` : ''}${hash}`
}

export default function Link({ href: to, prefetch, replace, scroll, ...rest }: LinkProps) {
  void prefetch
  void replace
  void scroll
  return <a href={href(to)} {...rest} />
}
