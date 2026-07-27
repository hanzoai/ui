'use client'

/**
 * SocialSummaryBar — the per-org social roll-up (posts / scheduled / published /
 * accounts) as a row of stat cells. Pure: the counts are injected. Extracted from
 * Hanzo Social (social.hanzo.ai).
 */
import { Text, XStack, YStack } from '@hanzo/gui'

export type SocialSummary = {
  posts: number
  scheduled: number
  published: number
  accounts: number
}

export function SocialSummaryBar({ summary }: { summary: SocialSummary }) {
  const cells: { label: string; value: number }[] = [
    { label: 'Posts', value: summary.posts },
    { label: 'Scheduled', value: summary.scheduled },
    { label: 'Published', value: summary.published },
    { label: 'Accounts', value: summary.accounts },
  ]
  return (
    <XStack gap="$3" flexWrap="wrap">
      {cells.map((c) => (
        <YStack
          key={c.label}
          gap="$1"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$4"
          px="$4"
          py="$3"
          minW={140}
        >
          <Text fontSize="$1" color="$color10">
            {c.label}
          </Text>
          <Text fontSize="$6" fontWeight="500" className="hz-tnum">
            {c.value}
          </Text>
        </YStack>
      ))}
    </XStack>
  )
}
