'use client'

/**
 * LimitedBanner — the reader's usage is paused or refused: the server's message,
 * the ways past it (Upgrade, Add prepaid credit) and, where the host has one, a
 * quiet "See usage" to its usage settings. One line where it fits. Neutral
 * chrome; the dot is the one status colour.
 */
import type { ReactNode } from 'react'
import { Text, View, XStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import { Button } from '../backends/gui/button'
import { slot } from '../backends/gui/slot'
import { touch } from '../backends/gui/gesture'
import { navigable, type LimitAction } from './limits'

export interface LimitedBannerProps {
  message: string
  actions?: readonly LimitAction[]
  /**
   * Takes an action. Without one only the pages (Upgrade, Add prepaid credit)
   * are offered, and the browser goes to their URL: Continue with credits and a
   * model switch need the host.
   */
  onAction?: (action: LimitAction) => void
  /** Opens the host's usage settings; draws "See usage" when given. */
  onUsage?: () => void
  onClose?: () => void
}

const go = (a: LimitAction) => {
  if (a.url && typeof window !== 'undefined') window.location.assign(a.url)
}

/**
 * The server's actions in the order it sent them: the first is the one filled
 * control, the rest quiet. Only pages are offered when the host takes no action.
 */
export function LimitActions({
  actions,
  onAction,
  children,
}: {
  actions: readonly LimitAction[]
  onAction?: (action: LimitAction) => void
  children?: ReactNode
}) {
  const shown = onAction ? actions : actions.filter(navigable)
  if (!shown.length && !children) return null
  return (
    <XStack gap="$2" shrink={0} flexWrap="wrap" items="center">
      {shown.map((a, i) => (
        <Button
          key={`${a.kind}:${a.url ?? a.model ?? i}`}
          size="sm"
          variant={i === 0 ? 'primary' : 'default'}
          data-kind={a.kind}
          onPress={() => (onAction ?? go)(a)}
        >
          {a.label}
        </Button>
      ))}
      {children}
    </XStack>
  )
}

export function LimitedBanner({ message, actions = [], onAction, onUsage, onClose }: LimitedBannerProps) {
  return (
    <XStack
      role="status"
      aria-live="polite"
      {...slot('limited-banner')}
      width="100%"
      items="center"
      flexWrap="wrap"
      gap="$2"
      px="$3"
      py="$2.5"
      rounded="$4"
      borderWidth={1}
      borderColor="$edge"
      bg="$panel"
    >
      <XStack flex={1} minW={200} items="center" gap="$2">
        <View width={8} height={8} rounded={4} bg="$bad" shrink={0} aria-hidden />
        <Text fontSize="$1" color="$ink" {...slot('limited-banner-message')}>
          {message}
        </Text>
      </XStack>
      <LimitActions actions={actions} onAction={onAction}>
        {onUsage ? (
          <Button size="sm" variant="link" px="$1.5" data-kind="usage" onPress={onUsage}>
            See usage
          </Button>
        ) : null}
      </LimitActions>
      {onClose ? (
        <Button variant="ghost" size="icon" minH={24} minW={24} {...touch(24)} aria-label="Dismiss" onPress={onClose}>
          <X size={14} />
        </Button>
      ) : null}
    </XStack>
  )
}
