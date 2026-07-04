'use client'

/**
 * Landing UI atoms — the shared card / action-row / delta-chip language, in a
 * dark-card idiom. Strictly @hanzo/gui v5 shorthands.
 */
import type { ComponentProps, ReactNode } from 'react'
import { Card, Text, XStack, YStack } from '@hanzo/gui'
import { TrendingDown, TrendingUp } from '@hanzogui/lucide-icons-2'

/** Open an external URL in a new tab (SSR-guarded). */
export function openExternal(href: string): void {
  if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener')
}

/** A titled dark card — the ONE section container across the landing. */
export function LandingCard({
  title,
  subtitle,
  actions,
  children,
  p = '$4',
  ...rest
}: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  p?: ComponentProps<typeof Card>['p']
} & Omit<ComponentProps<typeof Card>, 'children' | 'title'>) {
  return (
    <Card borderWidth={1} borderColor="$borderColor" bg="$color2" rounded="$5" p={p} gap="$3.5" {...rest}>
      {title || actions ? (
        <XStack justify="space-between" items="center" gap="$3" flexWrap="wrap">
          <YStack gap="$0.5" flex={1} minW={120}>
            {title ? (
              <Text fontSize="$5" fontWeight="800" color="$color12">
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text fontSize="$2" color="$color10">
                {subtitle}
              </Text>
            ) : null}
          </YStack>
          {actions ? (
            <XStack gap="$2" items="center">
              {actions}
            </XStack>
          ) : null}
        </XStack>
      ) : null}
      {children}
    </Card>
  )
}

/** One tappable action row (icon + label + optional sub-line). */
export function ActionRow({
  icon,
  label,
  sub,
  onPress,
}: {
  icon?: ReactNode
  label: string
  sub?: string
  onPress: () => void
}) {
  return (
    <XStack items="center" gap="$3" py="$2" px="$2" rounded="$3" cursor="pointer" hoverStyle={{ bg: '$color3' }} onPress={onPress}>
      <YStack width={30} height={30} items="center" justify="center" rounded="$3" bg="$color3">
        {icon}
      </YStack>
      <YStack flex={1} minW={0} gap="$0.5">
        <Text fontSize="$3" color="$color12" numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text fontSize="$1" color="$color10" numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </YStack>
      <Text fontSize="$4" color="$color9">
        ›
      </Text>
    </XStack>
  )
}

/** An ↑/↓ delta chip. Up→green, down→red, null→muted em-dash. Direction only (honest). */
export function DeltaChip({ pct }: { pct: number | null }) {
  if (pct == null || !Number.isFinite(pct)) {
    return (
      <Text fontSize="$1" color="$color10">
        —
      </Text>
    )
  }
  const rounded = Math.round(pct)
  const up = rounded >= 0
  const color = up ? '#23c562' : '#ff5d8f'
  const Icon = up ? TrendingUp : TrendingDown
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return (
    <XStack items="center" gap="$1">
      <Icon size={13} color={color} />
      <Text fontSize="$1" fontWeight="700" style={{ color }}>
        {sign}
        {Math.abs(rounded)}%
      </Text>
    </XStack>
  )
}
