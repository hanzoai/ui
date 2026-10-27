'use client'

/**
 * ClosingCta — the last thing on a page: one headline, one way in, one way to
 * read more. The way in is "Try Hanzo" to sign-in, payment second: `/login`, or
 * `/login?next=<checkout>` when the page names a plan (`next`).
 *
 * `onCta` hears both links, named `try_hanzo` and `read_docs`.
 */
import { XStack, YStack } from '@hanzo/gui'
import { useI18n } from '@hanzo/i18n/react'

import { slot } from '../backends/gui/slot'
import { Cta } from './Cta'
import { Line } from './type'

const TIGHT = { letterSpacing: '-0.012em', textWrap: 'balance' } as const

/** The host's words are drawn as given; what it leaves out is said in the reader's language. */
export type ClosingCtaProps = {
  title?: string
  /** The checkout this page sells, as a path: sign-in first, then this. */
  next?: string
  primary?: { label: string; href: string }
  secondary?: { label: string; href: string } | null
  onCta?: (cta: 'try_hanzo' | 'read_docs') => void
}

const ClosingCta = ({ title, next, primary, secondary, onCta }: ClosingCtaProps) => {
  const { t } = useI18n()
  const way = primary ?? { label: t('Try Hanzo'), href: next ? `/login?next=${encodeURIComponent(next)}` : '/login' }
  const more = secondary === undefined ? { label: t('Read the docs'), href: 'https://docs.hanzo.ai' } : secondary
  return (
  <YStack
    {...slot('closing-cta')}
    render="section"
    aria-label={t('Try Hanzo')}
    width="100%"
    maxW={1240}
    mx="auto"
    items="center"
    gap="$6"
    px="$6"
    py={56}
    $md={{ py: 96 }}
  >
    <Line render="h2" m={0} align="center" fontSize="$9" lineHeight="$9" fontWeight={500} $md={{ fontSize: '$11', lineHeight: '$11' }} style={TIGHT}>
      {title ?? t('Build what’s next.')}
    </Line>
    <XStack flexWrap="wrap" justify="center" gap="$4">
      <Cta href={way.href} onPress={() => onCta?.('try_hanzo')}>
        {way.label}
      </Cta>
      {more ? (
        <Cta quiet href={more.href} onPress={() => onCta?.('read_docs')}>
          {more.label}
        </Cta>
      ) : null}
    </XStack>
  </YStack>
  )
}

export { ClosingCta }
