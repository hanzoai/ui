'use client'

/**
 * Footer — the foot of a marketing page: a place to ask, the doors, the legal line.
 *
 * It shares the header's edges: the same side gutter, so the wordmark and the
 * columns stand under the header's wordmark and nav with nothing between them
 * to shift. `gutter` is that one number; a site passes the value its header uses.
 *
 *   ask       a slot above the columns for the site's composer, so it lives
 *             where a page ends and never floats over one.
 *   columns   titled lists of links; a title may itself be a link.
 *   wordmark  a slot at the far end of the last row; the copyright and the
 *             legal line share that row's start.
 *   after     a slot under that row, inside the footer, for the site's own
 *             last line (its social links).
 *
 * It stands on the panel's ground ($panel), a step off the page's, so the page
 * visibly ends where the footer begins.
 *
 * Plain anchors. A link that leaves the site opens a new tab and is marked with
 * ↗ by the host's own data (`out`).
 */
import { Anchor, XStack, YStack } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { Line } from './type'
import { PrivacyChoicesIcon } from '../consent/icon'

export type FooterLink = { label: string; href: string; out?: boolean }
export type FooterColumn = { id: string; title: string; href?: string; out?: boolean; links: readonly FooterLink[] }

export type FooterProps = {
  columns: readonly FooterColumn[]
  ask?: ReactNode
  wordmark?: ReactNode
  copyright?: ReactNode
  legal?: readonly FooterLink[]
  /** The side gutter, shared with the header. */
  gutter?: string
  /** A last line inside the footer, under the legal row: the site's social links. */
  after?: ReactNode
}

const open = (out?: boolean) => (out ? { target: '_blank', rel: 'noreferrer' } : {})

/**
 * A legal link's box. @hanzo/design gives every link a 24px floor, taller than
 * the line, and a plain block anchor sets its words at the top of it, 3px above
 * the box's middle; the copyright beside them, and the consent sheet's link
 * (`#choices`, its words beside California's privacy options icon), sat on the
 * middle. Every link centres its words in the floor, so the row shares one
 * centre line.
 */
const LEGAL = { display: 'inline-flex', alignItems: 'center', gap: 6 } as const

const Door = ({ link }: { link: FooterLink }) => (
  <Anchor
    href={link.href}
    {...open(link.out)}
    color="$soft"
    fontSize="$2"
    lineHeight="$2"
    py={3}
    textDecorationLine="none"
    hoverStyle={{ color: '$ink' }}
  >
    {link.label}
    {link.out ? ' ↗' : ''}
  </Anchor>
)

const Footer = ({ columns, ask, wordmark, copyright, legal = [], gutter = 'clamp(20px, 4vw, 72px)', after }: FooterProps) => (
  <YStack
    {...slot('footer')}
    render="footer"
    width="100%"
    bg="$panel"
    borderTopWidth={1}
    borderColor="$edge"
    pt={48}
    pb={32}
    gap={40}
    style={{ paddingInline: gutter }}
  >
    {ask ? (
      <YStack width="100%" items="center">
        {ask}
      </YStack>
    ) : null}
    {/* A phone stacks the columns, each one a heading over its links two
        across, so no short column stands beside a long one; from 640px they
        sit side by side, each its own list. */}
    <XStack flexWrap="wrap" gap={28} $sm={{ gap: 40 }}>
      {columns.map((c) => (
        <YStack key={c.id} render="nav" aria-label={c.title} flexBasis="100%" flexGrow={1} minW={140} $sm={{ flexBasis: 150 }} gap={2}>
          {c.href ? (
            <Anchor
              href={c.href}
              {...open(c.out)}
              color="$ink"
              fontSize="$2"
              lineHeight="$2"
              fontWeight="600"
              pb={10}
              textDecorationLine="none"
            >
              {c.title}
              {c.out ? ' ↗' : ''}
            </Anchor>
          ) : (
            <Line size="sm" weight="600" pb={10}>
              {c.title}
            </Line>
          )}
          <YStack display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" columnGap={16} $sm={{ display: 'flex', flexDirection: 'column' }}>
            {c.links.map((l) => (
              <Door key={l.label} link={l} />
            ))}
          </YStack>
        </YStack>
      ))}
    </XStack>
    <XStack flexWrap="wrap" items="center" gap={20} rowGap={12}>
      {copyright ? (
        <Line size="sm" tone="dim">
          {copyright}
        </Line>
      ) : null}
      {/* Shrinks to the row, so its links wrap on a phone instead of standing past the window. */}
      <XStack render="nav" aria-label="Terms & Policies" flexWrap="wrap" gap={16} rowGap={8} shrink={1} minW={0}>
        {legal.map((l) => (
          <Anchor
            key={l.label}
            href={l.href}
            {...open(l.out)}
            color="$faint"
            fontSize="$2"
            lineHeight="$2"
            textDecorationLine="none"
            hoverStyle={{ color: '$ink' }}
            {...LEGAL}
          >
            {l.href.endsWith('#choices') ? <PrivacyChoicesIcon /> : null}
            {l.label}
          </Anchor>
        ))}
      </XStack>
      {wordmark ? (
        <XStack marginInlineStart="auto" items="center" shrink={1} minW={0} maxW="100%">
          {wordmark}
        </XStack>
      ) : null}
    </XStack>
    {after}
  </YStack>
)

export { Footer }
