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
 *
 * Drawn on gui props, after the source kit's Breadcrumb (MIT, NOTICE): a 32px trail
 * in 13px quiet ink, steps 4px apart around a "/" held in an 8px slot, the page
 * you are on in full ink and the one step that may shrink, with an ellipsis.
 * It used to compose utility class strings (`gap-1.5 text-sm text-muted-foreground`),
 * which this package's own house rule forbids.
 */
import { Text, XStack } from '@hanzo/gui'
import type { ComponentProps } from 'react'

import { ink } from './ink'
import { slot } from './slot'

type Row = ComponentProps<typeof XStack>
type Words = ComponentProps<typeof Text>

export const Breadcrumb = (props: Row) => (
  <XStack {...slot('breadcrumb')} render="nav" aria-label="Breadcrumb" minH={32} items="center" overflow="hidden" minW={0} {...props} />
)

export const BreadcrumbList = ({ children, ...props }: Row) => (
  <XStack {...slot('breadcrumb-list')} render="ol" items="center" gap="$1" m={0} p={0} minW={0} style={{ listStyle: 'none' }} {...props}>
    {children}
  </XStack>
)

export const BreadcrumbItem = ({ children, ...props }: Row) => (
  <XStack {...slot('breadcrumb-item')} render="li" items="center" gap="$1" shrink={0} minW={0} {...props}>
    {ink(children, Text as never, { fontSize: '$2', color: '$hint' })}
  </XStack>
)

/**
 * A step in the trail.
 *
 * With no `href` it renders a span rather than an anchor: a step you cannot go
 * to is not a link, and an anchor without a target is one a keyboard stops on
 * for nothing.
 */
export const BreadcrumbLink = ({ href, children, ...props }: Words & { href?: string }) =>
  href ? (
    <Text
      {...slot('breadcrumb-link')}
      render="a"
      {...({ href } as object)}
      fontSize="$2"
      color="$hint"
      textDecorationLine="none"
      hoverStyle={{ color: '$ink' }}
      {...props}
    >
      {children}
    </Text>
  ) : (
    <Text {...slot('breadcrumb-link')} fontSize="$2" color="$hint" {...props}>
      {children}
    </Text>
  )

/** The step you are ON — not a link, and it says so. The one step that shrinks. */
export const BreadcrumbPage = ({ children, ...props }: Words) => (
  <Text
    {...slot('breadcrumb-page')}
    role="link"
    aria-disabled
    aria-current="page"
    fontSize="$2"
    color="$ink"
    numberOfLines={1}
    shrink={1}
    minW={0}
    {...props}
  >
    {children}
  </Text>
)

export const BreadcrumbSeparator = ({ children, ...props }: Row) => (
  <XStack {...slot('breadcrumb-separator')} render="li" role="presentation" aria-hidden width={8} justify="center" shrink={0} {...props}>
    {ink(children ?? '/', Text as never, { fontSize: '$2', color: '$hint' })}
  </XStack>
)

/** A trail too long to show whole. `…` is one character and reads as "more". */
export const BreadcrumbEllipsis = (props: Row) => (
  <XStack {...slot('breadcrumb-ellipsis')} role="presentation" aria-hidden items="center" justify="center" {...props}>
    <Text fontSize="$2" color="$hint">
      …
    </Text>
  </XStack>
)
