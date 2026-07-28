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
    // flexWrap lets the actions drop below the title on narrow screens; flex={1}
    // minW={0} lets the title column shrink so a long subtitle WRAPS instead of
    // running off the viewport (a flex child defaults to min-width:auto = content
    // width, which would overflow on mobile).
    <XStack justify="space-between" items="flex-start" gap="$3" flexWrap="wrap">
      <YStack gap="$1" flex={1} minW={200}>
        <Text fontSize="$7" fontWeight="500" letterSpacing={-0.4}>
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize="$3" color="$color11">
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {/* Actions take a FULL line below the title on phones (width 100%) and WRAP —
          so a header with many buttons (e.g. Tracker's Projects/Refresh/List/Board/
          New issue/Delete) never runs off-screen and clips the last controls. At $md+
          they collapse back to a right-aligned inline row beside the title. */}
      {actions ? (
        <XStack gap="$2" items="center" flexWrap="wrap" width="100%" $md={{ width: 'auto', justify: 'flex-end' }}>
          {actions}
        </XStack>
      ) : null}
    </XStack>
  )
}
