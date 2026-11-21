'use client'

import { createElement, isValidElement, type ReactElement } from 'react'

import { useLink } from '../backends/gui/link'

/**
 * Where a marketing control's element comes from.
 *
 * An explicit `render` wins. Otherwise an internal `href` to a page goes
 * through the app's router link — @hanzo/ui's link context, `<Link value={NextLink}>` once
 * at the root — so navigation stays client-side; any other address is a plain
 * anchor, and no address is the role's own element.
 *
 * The router link is made HERE, in the client component, and never handed in
 * from a page. A server page that passes `render={<NextLink …/>}` sends an
 * element through the RSC payload, which may arrive as a lazy reference
 * rather than an element; gui then renders that reference as a component and
 * the prerender dies on "Element type is invalid … got: object".
 */
export const useHost = <R>(render: R | undefined, href: string | undefined, own: string): R | string | ReactElement => {
  const Link = useLink()
  if (render !== undefined) return render
  if (href === undefined) return own
  return Link !== 'a' && route(href) ? createElement(Link, { href }) : 'a'
}

/** An address the app's router can open: a path on this site that names a
 *  page. A path that ends in a file extension — `/skill.md`, `/feed.xml` — is a
 *  file the server hands back as it is, so it stays an anchor; a version in a
 *  page's name (`/models/…/claude-opus-5.5`) is not an extension. */
const route = (href: string) => href.startsWith('/') && !href.startsWith('//') && !/\.[a-z][a-z0-9]{1,4}$/i.test(href.split(/[?#]/)[0])

/** A control's host as a React key. A control whose address moves from an anchor to a
 *  route (a page that learns where it runs once it hydrates) changes its element: the
 *  key remounts it, where reusing the fiber would run the router link's hooks inside
 *  the anchor's and fail on the count. */
export const hostKey = (host: unknown) => (typeof host === 'string' ? host : 'link')

/** Whether a host is an address: an `href`, an anchor, or an element carrying
 *  one. A control that is a link answers the pointer; a card that is a link
 *  rests in the link ink the document gives every `<a>`. */
export const address = (host: unknown, href: string | undefined) =>
  href !== undefined || host === 'a' || (isValidElement(host) && (host.props as { href?: unknown }).href !== undefined)
