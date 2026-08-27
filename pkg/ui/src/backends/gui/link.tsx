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
 */
import * as React from 'react'
import { cn } from '../../core/cn'
import type { LinkDef } from '../../types'
import { type ButtonSize, type ButtonVariant, buttonVariants } from './button'

/** Anything that takes an `href` and renders children. */
export type LinkComponent = React.ElementType

/**
 * The component every link renders through. `<Link value={NextLink}>` at the
 * root of a routed app; left alone it is a plain anchor.
 */
export const Link = /* @__PURE__ */ React.createContext<LinkComponent>('a')

export const useLink = (): LinkComponent => React.useContext(Link)

/** True when the href leaves the app, and so must not go through a router. */
const external = (href: string) => /^(https?:|mailto:|tel:)/.test(href)

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

export type LinkElementProps = React.PropsWithChildren<{
  def: LinkDef
  /** Fires alongside the navigation — e.g. to close the drawer it sits in. */
  onClick?: () => void
  /** Overrides `def`. */
  variant?: ButtonVariant | null
  /** Overrides `def`. */
  size?: ButtonSize | null
  /** Overrides `def`. */
  icon?: React.ReactNode
  /** Overrides `def`. */
  iconAfter?: boolean
  /**
   * Only classes that carry a rule — this renders a host anchor, so whatever
   * arrives here reaches the document verbatim. Layout goes in `style`.
   */
  className?: string
  style?: React.CSSProperties
  /**
   * `page` on the link to where you already are. It is how a screen reader
   * says "this one" in a navigation list — the colour that marks it visually
   * says nothing at all.
   */
  'aria-current'?: 'page' | 'true' | false
}>

/**
 * A link wearing a button's clothes, described by a {@link LinkDef}.
 *
 * Given children, they replace the whole label — `title`, `icon` and
 * `iconAfter` are then ignored, since the caller has said what to render.
 */
export const LinkElement = ({
  def,
  // No defaults on anything that also appears in `def` — a default here would
  // outrank the def it is supposed to fall back to.
  onClick,
  size,
  variant,
  icon,
  iconAfter,
  className,
  style,
  children,
  'aria-current': current,
}: LinkElementProps) => {
  const Comp = useLink()
  const { href, newTab, title } = def

  const nav: Record<string, unknown> = {}
  if (current) nav['aria-current'] = current
  // The scheme decides unless the def says otherwise. It can only be wrong in
  // one direction — a same-origin absolute url that is not really a departure —
  // so the derivation is the default and the field is the override.
  if (def.external ?? external(href)) {
    nav.rel = 'noreferrer noopener'
    // An external link opens in a new tab unless the def says otherwise.
    if (newTab ?? true) nav.target = '_blank'
  } else if (newTab) {
    nav.target = '_blank'
  }

  const label = () => {
    if (React.Children.count(children) > 0) return children
    // Props beat def fields beat defaults.
    const mark = icon ?? def.icon
    const after = iconAfter ?? def.iconAfter ?? false
    // `title` is optional: an icon-only link is a legal one.
    return (
      <>
        {mark && !after && <span style={{ paddingRight: 4 }}>{mark}</span>}
        {title && <span>{title}</span>}
        {mark && after && <span style={{ paddingLeft: 4 }}>{mark}</span>}
      </>
    )
  }

  return (
    <Comp
      href={href}
      className={cn(
        buttonVariants({
          variant: variant ?? def.variant ?? 'link',
          size: size ?? def.size ?? 'default',
        }),
        className,
      )}
      // A def with no href and no handler is a LABEL, not a link. Written as a
      // style rather than a utility class because this renders a bare `<a>` and
      // nothing in the shipped stylesheet defines `pointer-events-none` — the
      // class would have been three dead tokens and a clickable label.
      style={href.length > 0 || onClick ? style : { ...style, pointerEvents: 'none' }}
      {...(onClick ? { onClick } : {})}
      {...nav}
    >
      {label()}
    </Comp>
  )
}
