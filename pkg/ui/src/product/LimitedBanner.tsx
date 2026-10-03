'use client'

/**
 * LimitedBanner — the reader's usage is paused or refused: the server's message,
 * the ways past it (Upgrade, Add prepaid credit) and, where the host has one, a
 * quiet "See usage" to its usage settings. One line where it fits. Neutral
 * chrome; the dot is the one status colour.
 */
import { Text, View, XStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import { Button } from '../backends/gui/button'
import { slot } from '../backends/gui/slot'
import { touch } from '../backends/gui/gesture'
import type { LimitAction } from './limits'

export interface LimitedBannerProps {
  message: string
  actions?: readonly LimitAction[]
  /** Takes an action; by default the page goes to its URL. */
  onAction?: (action: LimitAction) => void
  /** Opens the host's usage settings; draws "See usage" when given. */
  onUsage?: () => void
  onClose?: () => void
}

const go = (a: LimitAction) => {
  if (typeof window !== 'undefined') window.location.assign(a.url)
}

export function LimitedBanner({ message, actions = [], onAction = go, onUsage, onClose }: LimitedBannerProps) {
  return (
    <XStack
      role="status"
      aria-live="polite"
      {...slot('limited-banner')}
      width="100%"
      items="center"
      flexWrap="wrap"
      gap="$3"
      px="$3"
      py="$2.5"
      rounded="$4"
      borderWidth={1}
      borderColor="$edge"
      bg="$panel"
    >
      <XStack flex={1} minW={200} items="center" gap="$2.5">
        <View width={8} height={8} rounded={4} bg="$bad" shrink={0} aria-hidden />
        <Text fontSize="$2" color="$ink" {...slot('limited-banner-message')}>
          {message}
        </Text>
      </XStack>
      {actions.length || onUsage ? (
        <XStack gap="$2" shrink={0} flexWrap="wrap" items="center">
          {actions.map((a) => (
            <Button
              key={`${a.kind}:${a.url}`}
              size="sm"
              variant={a.kind === 'upgrade' ? 'default' : 'outline'}
              data-kind={a.kind}
              onPress={() => onAction(a)}
            >
              {a.label}
            </Button>
          ))}
          {onUsage ? (
            <Button size="sm" variant="ghost" data-kind="usage" onPress={onUsage}>
              See usage
            </Button>
          ) : null}
        </XStack>
      ) : null}
      {onClose ? (
        <Button variant="ghost" size="icon" minH={24} minW={24} {...touch(24)} aria-label="Dismiss" onPress={onClose}>
          <X size={14} />
        </Button>
      ) : null}
    </XStack>
  )
}
