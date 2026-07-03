'use client'

import type { ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'

/** Section title + optional subtitle and right-aligned actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <XStack justify="space-between" items="flex-start" gap="$4">
      <YStack gap="$1">
        <Text fontSize="$7" fontWeight="800">
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize="$3" color="$color11">
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {actions ? <XStack gap="$2">{actions}</XStack> : null}
    </XStack>
  )
}
