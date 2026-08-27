'use client'

/**
 * NavItems — a list of {@link LinkDef}s as a navigation.
 *
 * It exists so that "which one am I on" is answered ONCE. Every site menu has
 * to compare the current path against each item's href, and every one that does
 * it by hand marks the active item with a colour and stops there — which tells
 * a sighted reader where they are and tells a screen reader nothing. Here the
 * comparison carries `aria-current="page"` with it, so the two cannot come
 * apart.
 */
import * as React from 'react'

import { Box } from '../../box'
import { cn, type ClassValue } from '../../core/cn'
import type { LinkDef } from '../../types'
import { LinkElement } from './link'

export type NavItemsProps = {
  items: LinkDef[]
  /**
   * The path you are on. The item whose href matches it is the current one.
   * Absent, nothing is current — which is right for a footer.
   */
  currentAs?: string
  /** The element holding the list. `nav` unless it is not a navigation. */
  as?: 'nav' | 'div' | 'ul'
  className?: ClassValue
  /**
   * A class for every item, or one worked out per item — a menu whose featured
   * entries read differently from its ordinary ones needs the second.
   */
  itemClx?: string | ((def: LinkDef) => string)
  /** Fires alongside the navigation — e.g. to close the menu it sits in. */
  onNavigate?: () => void
}

export const NavItems = ({
  items,
  currentAs,
  as = 'nav',
  className,
  itemClx,
  onNavigate,
}: NavItemsProps) => (
  <Box
    tag={as}
    // A landmark with no name is one a screen reader lists as "navigation",
    // indistinguishable from every other navigation on the page.
    aria-label={as === 'nav' ? 'Navigation' : undefined}
    className={cn('grid grid-flow-col auto-cols-max items-center', className)}
  >
    {items.map((def, i) => {
      const current = !!currentAs && def.href === currentAs
      return (
        <LinkElement
          key={def.href || i}
          def={def}
          onClick={onNavigate}
          aria-current={current ? 'page' : false}
          className={cn(typeof itemClx === 'function' ? itemClx(def) : itemClx)}
        />
      )
    })}
  </Box>
)
