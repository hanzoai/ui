'use client'

/**
 * Status pill — one status string, one pill, everywhere.
 *
 * What a status MEANS is `tone` in `./tone`: a pure lookup a billing surface can
 * assert against without mounting anything. This draws it. The pill has no hue
 * to spend — the four tones are rungs of the grey ladder — so `stopped` is set
 * apart by an EDGE, and every tone carries a border (transparent on three of
 * them) so turning one on shifts no layout in a table of fifty rows.
 */
import { Text } from '@hanzo/gui'

import { TONE, tone } from './tone'

export type StatusTagProps = {
  status?: string
  /** Override the tone when the caller knows better than the vocabulary does. */
  tone?: keyof typeof TONE
}

export function StatusTag({ status, tone: override }: StatusTagProps) {
  const t = TONE[override ?? tone(status ?? '')]
  return (
    <Text
      fontSize="$1"
      px="$2"
      py="$1"
      rounded="$2"
      borderWidth={1}
      borderColor={t.borderColor}
      bg={t.bg}
      color={t.color}
    >
      {status || 'unknown'}
    </Text>
  )
}
