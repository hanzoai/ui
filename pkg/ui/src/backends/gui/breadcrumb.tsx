'use client'

/**
 * Breadcrumb — where you are, in a trail.
 *
 * A real `<nav>` around a real `<ol>`: the trail is ORDERED, and a screen
 * reader announces "list, 4 items" and reads the position. Built out of divs it
 * announces nothing, which is most of the point of a breadcrumb gone.
 *
 * The separators are `aria-hidden` and outside the items, because a slash is
 * punctuation, not a step — a reader that voices them says "home slash shop
 * slash bag" instead of counting.
 */
import * as React from 'react'

import { Box, type BoxProps } from '../../box'
import { cn } from '../../core/cn'

export const Breadcrumb = ({ className, ...props }: React.ComponentProps<typeof Box>) => (
  <Box tag="nav" aria-label="Breadcrumb" className={className} {...props} />
)

export const BreadcrumbList = ({ className, ...props }: React.ComponentProps<typeof Box>) => (
  <Box
    tag="ol"
    className={cn(
      'grid grid-flow-col auto-cols-max items-center gap-1.5 text-sm text-muted-foreground',
      className,
    )}
    {...props}
  />
)

export const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<typeof Box>) => (
  <Box
    tag="li"
    className={cn('grid grid-flow-col auto-cols-max items-center gap-1.5', className)}
    {...props}
  />
)

/**
 * A step in the trail.
 *
 * With no `href` it renders a span rather than an anchor: a step you cannot go
 * to is not a link, and an anchor without a target is one a keyboard stops on
 * for nothing.
 */
export const BreadcrumbLink = ({
  className,
  href,
  ...props
}: BoxProps<'a'> & { href?: string }) =>
  href ? (
    <Box tag="a" href={href} className={cn('hover:text-foreground', className)} {...props} />
  ) : (
    <Box tag="span" className={className} {...props} />
  )

/** The step you are ON — not a link, and it says so. */
export const BreadcrumbPage = ({ className, ...props }: BoxProps<'span'>) => (
  <Box
    tag="span"
    role="link"
    aria-disabled={true}
    aria-current="page"
    className={cn('text-foreground', className)}
    {...props}
  />
)

export const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Box>) => (
  <Box
    tag="li"
    role="presentation"
    aria-hidden="true"
    className={cn('text-muted-foreground', className)}
    {...props}
  >
    {children ?? '/'}
  </Box>
)

/** A trail too long to show whole. `…` is one character and reads as "more". */
export const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<typeof Box>) => (
  <Box
    tag="span"
    role="presentation"
    aria-hidden="true"
    className={cn('grid place-items-center', className)}
    {...props}
  >
    …
  </Box>
)
