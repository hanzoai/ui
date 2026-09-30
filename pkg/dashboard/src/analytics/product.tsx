import { useState } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Loaded, RangeSwitch, TopList, useLoad } from './parts'
import type { FunnelStep, Range, Source, Step } from './source'

/** The sign-up journey, in @hanzo/events names (HIP-1190 §6.1). */
export const JOURNEY: Step[] = [
  { type: 'event', value: 'signup_viewed' },
  { type: 'event', value: 'signup_submitted' },
  { type: 'event', value: 'signup_completed' },
  { type: 'event', value: 'first_action' },
  { type: 'event', value: 'checkout_started' },
  { type: 'event', value: 'order_completed' },
]

function Funnel({ steps }: { steps: FunnelStep[] }) {
  const first = steps[0]?.visitors || 0
  return (
    <YStack gap="$2">
      {steps.map((s, i) => (
        <XStack key={s.value} gap="$3" items="center">
          <Text width={150} fontSize="$2" color="$color11" numberOfLines={1}>
            {i + 1}. {s.value}
          </Text>
          <YStack flex={1} height={12} bg="$color3" rounded="$2" overflow="hidden">
            <YStack height={12} width={`${first ? Math.max(1, (s.visitors / first) * 100) : 0}%`} bg="$color9" rounded="$2" />
          </YStack>
          <Text width={64} fontSize="$2" color="$color12" fontWeight="600" text="right">
            {s.visitors.toLocaleString()}
          </Text>
          <Text width={56} fontSize="$2" color="$color10" text="right">
            {i === 0 || !steps[i - 1].visitors ? '' : `${Math.round((s.visitors / steps[i - 1].visitors) * 100)}%`}
          </Text>
        </XStack>
      ))}
    </YStack>
  )
}

/**
 * Product analytics for one website: what people did (the named events) and how
 * far they got through the sign-up journey, one visitor followed across steps.
 */
export function ProductAnalytics({ source, website, steps = JOURNEY, initial = '7d' }: { source: Source; website: string; steps?: Step[]; initial?: Range }) {
  const [range, setRange] = useState<Range>(initial)
  const funnel = useLoad(() => source.funnel(website, steps, range), [source, website, range, steps])
  const events = useLoad(() => source.top(website, 'event', range, 20), [source, website, range])
  return (
    <YStack gap="$4" width="100%">
      <XStack justify="space-between" items="center" gap="$3" flexWrap="wrap">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          Product analytics
        </Text>
        <RangeSwitch range={range} onRange={setRange} />
      </XStack>
      <Loaded title="Sign-up journey" load={funnel} empty={(v) => !v.length || !v[0].visitors}>
        {(v) => <Funnel steps={v} />}
      </Loaded>
      <Loaded title="Events" load={events} empty={(v) => !v.length}>
        {(rows) => <TopList rows={rows} />}
      </Loaded>
    </YStack>
  )
}
