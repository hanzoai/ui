'use client'

/**
 * Pagination — a trail of page links, framed as a navigation landmark.
 *
 * `Pagination` is a `<nav aria-label="pagination">` around `PaginationContent`,
 * a real `<ul>` so a screen reader counts the pages the way it counts a list.
 * `PaginationLink` wears the same `Button` frame every other control on the
 * page wears — ghost for a page you can go to, outline for the one you are
 * on — so the current page reads as pressed rather than as a colour choice.
 * `PaginationPrevious`/`PaginationNext` are that link with an icon and a
 * label; `PaginationEllipsis` is a decorative gap, `aria-hidden`, with its own
 * "More pages" line for whoever is not looking at it.
 */
import * as React from 'react'
import { VisuallyHidden, XStack, styled } from '@hanzo/gui'
import { ChevronLeft, ChevronRight, MoreHorizontal } from '@hanzogui/lucide-icons-2'

import { Button, type ButtonSize } from './button'
import { slot } from './slot'

const ICON = 16

const Nav = styled(XStack, {
  name: 'Pagination',
  render: 'nav',
  width: '100%',
  justify: 'center',
})

export type PaginationProps = React.ComponentProps<typeof Nav>

export const Pagination = (props: PaginationProps) => (
  <Nav {...slot('pagination')} role="navigation" aria-label="pagination" {...props} />
)

const List = styled(XStack, {
  name: 'PaginationContent',
  render: 'ul',
  flexDirection: 'row',
  items: 'center',
  gap: '$1',
})

export type PaginationContentProps = React.ComponentProps<typeof List>

export const PaginationContent = (props: PaginationContentProps) => (
  <List {...slot('pagination-content')} {...props} />
)

const Item = styled(XStack, {
  name: 'PaginationItem',
  render: 'li',
})

export type PaginationItemProps = React.ComponentProps<typeof Item>

export const PaginationItem = (props: PaginationItemProps) => (
  <Item {...slot('pagination-item')} {...props} />
)

export type PaginationLinkProps = {
  isActive?: boolean
  size?: ButtonSize
  href?: string
} & Omit<React.ComponentProps<typeof Button>, 'variant' | 'size' | 'asChild'>

/** One page number, or any other stop in the trail. Renders as an anchor. */
export const PaginationLink = ({
  isActive,
  size = 'icon',
  href,
  children,
  ...props
}: PaginationLinkProps) => (
  <Button
    asChild
    {...slot('pagination-link')}
    data-active={isActive || undefined}
    aria-current={isActive ? 'page' : undefined}
    variant={isActive ? 'outline' : 'ghost'}
    size={size}
    {...props}
  >
    <a href={href}>{children}</a>
  </Button>
)

export type PaginationPreviousProps = Omit<PaginationLinkProps, 'size' | 'children'>

export const PaginationPrevious = (props: PaginationPreviousProps) => (
  <PaginationLink aria-label="Go to previous page" size="default" gap="$1" pl="$2.5" {...props}>
    <ChevronLeft size={ICON} />
    Previous
  </PaginationLink>
)

export type PaginationNextProps = Omit<PaginationLinkProps, 'size' | 'children'>

export const PaginationNext = (props: PaginationNextProps) => (
  <PaginationLink aria-label="Go to next page" size="default" gap="$1" pr="$2.5" {...props}>
    Next
    <ChevronRight size={ICON} />
  </PaginationLink>
)

const Ellipsis = styled(XStack, {
  name: 'PaginationEllipsis',
  render: 'span',
  height: 36,
  width: 36,
  items: 'center',
  justify: 'center',
})

export type PaginationEllipsisProps = React.ComponentProps<typeof Ellipsis>

/** A gap too long to enumerate. Decorative — the count still comes from the list. */
export const PaginationEllipsis = (props: PaginationEllipsisProps) => (
  <Ellipsis {...slot('pagination-ellipsis')} aria-hidden {...props}>
    <MoreHorizontal size={ICON} />
    <VisuallyHidden>More pages</VisuallyHidden>
  </Ellipsis>
)
