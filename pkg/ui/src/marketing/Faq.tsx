'use client'

/**
 * Faq — the questions, each a <Disclosure>: closed to the eye, open to the
 * document. A crawler, a reader with scripts off and a print stylesheet all get
 * every answer; the row opens with no script at all.
 *
 * The heading is the section's own <h2>; `onOpen` hears each question as it is
 * opened, never as it is closed.
 */
import { YStack } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { Disclosure } from '../backends/gui/disclosure'
import { slot } from '../backends/gui/slot'
import { Line } from './type'

const TIGHT = { letterSpacing: '-0.012em', textWrap: 'balance' } as const

export type FaqItem = { q: string; a: ReactNode }

export type FaqProps = {
  items: readonly FaqItem[]
  heading?: string
  onOpen?: (question: string) => void
}

const Faq = ({ items, heading = 'Questions', onOpen }: FaqProps) => (
  <YStack {...slot('faq')} render="section" width="100%" maxW={680} mx="auto" gap="$6" px="$6">
    <Line render="h2" align="center" fontSize="$9" lineHeight="$9" fontWeight={500} $md={{ fontSize: '$11', lineHeight: '$11' }} style={TIGHT}>
      {heading}
    </Line>
    <YStack borderTopWidth={1} borderColor="$edge">
      {items.map((item) => (
        <Disclosure key={item.q} summary={item.q} onOpenChange={(open) => open && onOpen?.(item.q)}>
          <Line render="div" tone="muted" lineHeight="$5">
            {item.a}
          </Line>
        </Disclosure>
      ))}
    </YStack>
  </YStack>
)

export { Faq }
