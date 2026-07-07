'use client'

/**
 * Status pill — maps a resource/cluster status string to a tone, one place.
 *
 * Provisioned things (managed resources, clusters) report free-form lifecycle
 * strings; this normalizes them to green/yellow/red/neutral so every list reads
 * the same. Style props use the v5 shorthand set.
 */
import { Text } from '@hanzo/gui'

type Tone = 'green' | 'yellow' | 'red' | 'neutral'

const toneOf = (status: string): Tone => {
  const s = status.toLowerCase()
  // Platform health verdicts map straight to a tone (the apps inventory reports
  // green/yellow/red directly).
  if (s === 'green') return 'green'
  if (s === 'yellow') return 'yellow'
  if (s === 'red') return 'red'
  if (['ready', 'active', 'running', 'available', 'ok'].includes(s)) return 'green'
  if (['creating', 'provisioning', 'pending', 'updating', 'attaching'].includes(s)) return 'yellow'
  if (['error', 'failed', 'degraded', 'down'].includes(s)) return 'red'
  return 'neutral'
}

// `as const` keeps the literal token types (not widened to `string`) so they
// satisfy the GUI `bg`/`color` token unions.
const TONE_BG = {
  green: '$color5',
  yellow: '$color4',
  red: '$color4',
  neutral: '$color3',
} as const
const TONE_FG = {
  green: '$color12',
  yellow: '$color12',
  red: '$color12',
  neutral: '$color11',
} as const

export function StatusTag({ status }: { status?: string }) {
  const tone = toneOf(status ?? '')
  return (
    <Text fontSize="$1" px="$2" py="$1" rounded="$2" bg={TONE_BG[tone]} color={TONE_FG[tone]}>
      {status || 'unknown'}
    </Text>
  )
}
