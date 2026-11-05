'use client'

/**
 * UsageMeter — one row per class of model: its name, a bar of the percent used
 * in its state's colour, and when it resets. Shares only; no amount or count is
 * ever drawn. A class with a short window carries it as a second, slimmer bar.
 */
import { Text, XStack, YStack } from '@hanzo/gui'
import { phrase } from '@hanzo/i18n'
import { useI18n } from '@hanzo/i18n/react'
import { Progress } from '../backends/gui/progress'
import { slot } from '../backends/gui/slot'
import { CLASSES, classesLabel, when, type ClassLimit, type LimitClass, type LimitState, type LimitWindow, type Limits } from './limits'

/** The status rung each state paints its bar in. */
export const STATE_COLOR = { ok: '$good', near: '$yellow10', limited: '$bad' } as const satisfies Record<LimitState, string>

/** What a class row says under its bar about who pays now. */
function caption(c: ClassLimit): string {
  if (c.paying === 'credits') return phrase('Paying from credits')
  if (c.state === 'limited' && (c.paying === 'none' || c.paying === 'free')) return phrase('Paused')
  if (c.state === 'near') return phrase('Almost used')
  return ''
}

function Session({ label, w, now }: { label: string; w: LimitWindow; now?: number }) {
  const resets = when(w.resets_at, now)
  const { t } = useI18n()
  return (
    <XStack items="center" gap="$2" minW={0} data-state={w.state} {...slot('usage-meter-window')}>
      <Text fontSize="$1" color="$soft" shrink={0}>
        {t('Session')}
      </Text>
      <Progress
        value={w.percent}
        height={4}
        flex={1}
        minW={0}
        indicatorColor={STATE_COLOR[w.state]}
        aria-label={t('{label} session: {percent}% used', { label, percent: w.percent })}
      />
      <Text fontSize="$1" color="$soft" shrink={0} fontVariant={['tabular-nums']}>
        {w.percent}%{resets ? ` · ${t('Resets {until}', { until: resets })}` : ''}
      </Text>
    </XStack>
  )
}

export interface UsageMeterProps {
  limits: Limits
  /** Which classes to draw, in order; those the limits do not name are skipped. */
  classes?: readonly LimitClass[]
  /** `sm` for a composer's foot, `md` for a page. */
  size?: 'sm' | 'md'
  /** The clock resets are read against; tests pin it. */
  now?: number
}

export function UsageMeter({ limits, classes = CLASSES, size = 'md', now }: UsageMeterProps) {
  const rows = classes.flatMap((c) => {
    const k = limits.classes[c]
    return k ? [{ c, k }] : []
  })
  const { t } = useI18n()
  if (!rows.length) return null
  const sm = size === 'sm'
  return (
    <YStack gap={sm ? '$2.5' : '$5'} width="100%" minW={0} {...slot('usage-meter')}>
      {rows.map(({ c, k }) => {
        const label = classesLabel([c], t)
        const resets = when(k.resets_at, now)
        const note = caption(k)
        return (
          <YStack key={c} gap={sm ? '$1.5' : '$2'} minW={0} data-class={c} data-state={k.state} {...slot('usage-meter-row')}>
            <XStack justify="space-between" items="baseline" gap="$3" minW={0}>
              <Text fontSize={sm ? '$2' : '$3'} color="$ink" fontWeight="500" numberOfLines={1}>
                {label}
              </Text>
              <Text fontSize={sm ? '$2' : '$3'} color="$ink" fontVariant={['tabular-nums']} shrink={0}>
                {t('{percent}% used', { percent: k.percent })}
              </Text>
            </XStack>
            <Progress
              value={k.percent}
              height={sm ? 4 : 8}
              minW={0}
              indicatorColor={STATE_COLOR[k.state]}
              aria-label={t('{label}: {percent}% used', { label, percent: k.percent })}
            />
            {resets || note ? (
              <XStack justify="space-between" gap="$3" flexWrap="wrap" minW={0}>
                <Text fontSize={sm ? '$1' : '$2'} color="$soft">
                  {resets ? t('Resets {until}', { until: resets }) : ''}
                </Text>
                {note ? (
                  <Text fontSize={sm ? '$1' : '$2'} color={k.state === 'limited' ? '$bad' : '$soft'}>
                    {t(note)}
                  </Text>
                ) : null}
              </XStack>
            ) : null}
            {k.window ? <Session label={label} w={k.window} now={now} /> : null}
          </YStack>
        )
      })}
    </YStack>
  )
}
