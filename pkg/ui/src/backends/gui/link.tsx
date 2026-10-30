'use client'

/**
 * Links.
 *
 * This package imports no framework — `next` is an optional peer and nothing in
 * `src` reaches for it. But an internal link in a routed app has to go through
 * that router, or every in-app navigation becomes a full page load. Both facts
 * hold at once by letting the HOST name the component once:
 *
 *   import Next from 'next/link'
 *   <Link value={Next}>{app}</Link>
 *
 * Everything below reads that value, so one line at the root fixes routing for
 * every link the library renders. Unset, it is `'a'` — correct output, just
 * without client-side navigation, which is also the right answer for a Vite or
 * Tauri host that has no router to offer.
 *
 * The 5.x originals imported `next/link` directly, which is why they could only
 * ever live in a `primitives/next/` folder that a non-Next host could not touch.
 *
 * This module imports nothing that draws: every marketing control reads the
 * context, so whatever it imports rides every page of every host. The link that
 * wears a button's clothes, which needs the Button, is ./link-element.
 */
import * as React from 'react'

/** Anything that takes an `href` and renders children. */
export type LinkComponent = React.ElementType

/**
 * The component every link renders through. `<Link value={NextLink}>` at the
 * root of a routed app; left alone it is a plain anchor.
 */
export const Link = /* @__PURE__ */ React.createContext<LinkComponent>('a')

export const useLink = (): LinkComponent => React.useContext(Link)

/** True when the href leaves the app, and so must not go through a router. */
export const external = (href: string) => /^(https?:|mailto:|tel:)/.test(href)

/**
 * A link in authored content — the `a` an .mdx file produces.
 *
 * Internal hrefs go through the host's link so navigation stays client-side;
 * anything external opens in a new tab, with `rel` set because `target=_blank`
 * without it hands the opened page a live reference back to this one.
 */
export const MDXLink = ({
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const Comp = useLink()
  if (href && href.startsWith('/')) {
    return (
      <Comp href={href} {...rest}>
        {children}
      </Comp>
    )
  }
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
      {children}
    </a>
  )
}
