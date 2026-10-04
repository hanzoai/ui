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
 *   wordmark  a slot; the legal line sits beside it.
 *
 * Plain anchors. A link that leaves the site opens a new tab and is marked with
 * ↗ by the host's own data (`out`).
 */
import { Anchor, XStack, YStack } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { Line } from './type'

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
}

const open = (out?: boolean) => (out ? { target: '_blank', rel: 'noreferrer' } : {})

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

const Footer = ({ columns, ask, wordmark, copyright, legal = [], gutter = 'clamp(20px, 4vw, 72px)' }: FooterProps) => (
  <YStack
    {...slot('footer')}
    render="footer"
    width="100%"
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
    <XStack flexWrap="wrap" gap={28} $sm={{ gap: 40 }}>
      {columns.map((c) => (
        <YStack key={c.id} render="nav" aria-label={c.title} flexBasis="40%" flexGrow={1} minW={140} $sm={{ flexBasis: 150 }} gap={2}>
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
          {c.links.map((l) => (
            <Door key={l.label} link={l} />
          ))}
        </YStack>
      ))}
    </XStack>
    <XStack flexWrap="wrap" items="center" gap={20} rowGap={8}>
      {wordmark}
      {copyright ? (
        <Line size="sm" tone="dim">
          {copyright}
        </Line>
      ) : null}
      <XStack render="nav" aria-label="Terms & Policies" flexWrap="wrap" gap={16} rowGap={8} ml={0} width="100%" $sm={{ ml: 'auto', width: 'auto' }}>
        {legal.map((l) => (
          <Anchor key={l.label} href={l.href} {...open(l.out)} color="$faint" fontSize="$2" lineHeight="$2" textDecorationLine="none" hoverStyle={{ color: '$ink' }}>
            {l.label}
          </Anchor>
        ))}
      </XStack>
    </XStack>
  </YStack>
)

export { Footer }
