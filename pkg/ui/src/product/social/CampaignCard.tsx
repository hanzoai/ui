'use client'

/**
 * CampaignCard — one marketing campaign (name, channel, lifecycle, budget/spend
 * bar). Pure: all data via props. Reuses the shared StatusTag for the lifecycle
 * pill (one status vocabulary). Extracted from Hanzo Social.
 */
import { Card, Text, XStack, YStack } from '@hanzo/gui'
import { StatusTag } from '../StatusTag'

export type Campaign = {
  id: string
  name: string
  channel: string
  status: string
  objective?: string
  /** minor units (cents) */
  budget: number
  spend: number
}

const money = (cents: number) => `$${Math.round((cents || 0) / 100).toLocaleString()}`

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const pct =
    campaign.budget > 0 ? Math.min(100, (campaign.spend / campaign.budget) * 100) : 0
  return (
    <Card p="$4" gap="$3" borderWidth={1} borderColor="$borderColor" width="100%">
      <XStack items="flex-start" justify="space-between" gap="$2">
        <YStack gap="$1">
          <Text fontSize="$4" fontWeight="700">
            {campaign.name}
          </Text>
          <Text fontSize="$2" color="$quiet">
            {campaign.channel}
          </Text>
        </YStack>
        <StatusTag status={campaign.status} />
      </XStack>

      {campaign.objective ? (
        <Text fontSize="$2" color="$quiet">
          {campaign.objective}
        </Text>
      ) : null}

      <YStack gap="$1.5">
        <XStack justify="space-between">
          <Text fontSize="$1" color="$quiet">
            {money(campaign.spend)} spent
          </Text>
          <Text fontSize="$1" color="$quiet">
            {money(campaign.budget)} budget
          </Text>
        </XStack>
        <YStack height={6} rounded="$2" bg="$hover" overflow="hidden">
          <YStack height={6} rounded="$2" bg="$faint" width={`${pct}%` as never} />
        </YStack>
      </YStack>
    </Card>
  )
}
