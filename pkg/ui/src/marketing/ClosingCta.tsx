'use client'

/**
 * ClosingCta — the last thing on a page: one headline, one way in, one way to
 * read more. The way in is "Try Hanzo" to sign-in, payment second: `/login`, or
 * `/login?next=<checkout>` when the page names a plan (`next`).
 *
 * `onCta` hears both links, named `try_hanzo` and `read_docs`.
 */
import { XStack, YStack } from '@hanzo/gui'

import { slot } from '../backends/gui/slot'
import { Cta } from './Cta'
import { Line } from './type'

const TIGHT = { letterSpacing: '-0.012em', textWrap: 'balance' } as const

export type ClosingCtaProps = {
  title?: string
  /** The checkout this page sells, as a path: sign-in first, then this. */
  next?: string
  primary?: { label: string; href: string }
  secondary?: { label: string; href: string } | null
  onCta?: (cta: 'try_hanzo' | 'read_docs') => void
}

const ClosingCta = ({
  title = 'Build what’s next.',
  next,
  primary = { label: 'Try Hanzo', href: next ? `/login?next=${encodeURIComponent(next)}` : '/login' },
  secondary = { label: 'Read the docs', href: 'https://docs.hanzo.ai' },
  onCta,
}: ClosingCtaProps) => (
  <YStack
    {...slot('closing-cta')}
    render="section"
    aria-label="Try Hanzo"
    width="100%"
    maxW={1240}
    mx="auto"
    items="center"
    gap="$6"
    px="$6"
    py={96}
    $md={{ py: 56 }}
  >
    <Line render="h2" m={0} align="center" fontSize="$11" lineHeight="$11" fontWeight={500} $md={{ fontSize: '$9', lineHeight: '$9' }} style={TIGHT}>
      {title}
    </Line>
    <XStack flexWrap="wrap" justify="center" gap="$4">
      <Cta href={primary.href} onPress={() => onCta?.('try_hanzo')}>
        {primary.label}
      </Cta>
      {secondary ? (
        <Cta quiet href={secondary.href} onPress={() => onCta?.('read_docs')}>
          {secondary.label}
        </Cta>
      ) : null}
    </XStack>
  </YStack>
)

export { ClosingCta }
