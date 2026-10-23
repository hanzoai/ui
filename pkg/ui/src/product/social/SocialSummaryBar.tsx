'use client'

/**
 * SocialSummaryBar — the per-org social roll-up (posts / scheduled / published /
 * accounts) as a row of stat cells. Pure: the counts are injected. Extracted from
 * Hanzo Social (social.hanzo.ai).
 */
import { TABULAR } from '../figures'
import { Text, XStack, YStack } from '@hanzo/gui'
import { useI18n } from '@hanzo/i18n/react'
import type { SocialSummary } from './api'

export function SocialSummaryBar({ summary }: { summary: SocialSummary }) {
  const { t } = useI18n()
  const cells: { label: string; value: number }[] = [
    { label: t('Posts'), value: summary.posts },
    { label: t('Scheduled'), value: summary.scheduled },
    { label: t('Published'), value: summary.published },
    { label: t('Accounts'), value: summary.accounts },
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
          <Text fontSize="$1" color="$soft">
            {c.label}
          </Text>
          <Text fontSize="$6" fontWeight="500" {...TABULAR}>
            {c.value}
          </Text>
        </YStack>
      ))}
    </XStack>
  )
}
