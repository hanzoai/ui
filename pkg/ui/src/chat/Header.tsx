'use client'

/**
 * Header — the conversation title bar.
 *
 * Title on the left, `children` as the action slot on the right. The actions are
 * a slot rather than a fixed set because what belongs there is per-surface:
 * hanzo.chat shares and opens a details rail, the console shows the owning
 * project, hanzo.app shows neither.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Ellipsis, PanelRight, Share2 } from '@hanzogui/lucide-icons-2'
import type { ReactNode } from 'react'

import { slot, tip } from '../backends/gui/slot'

export interface HeaderProps {
  title: string
  /** Overflow menu next to the title. Omit to hide it. */
  onOpenMenu?: () => void
  /** Action slot, rendered at the end of the row. */
  children?: ReactNode
}

export function Header({ title, onOpenMenu, children }: HeaderProps) {
  return (
    <XStack
      {...slot('chat-header')}
      width="100%"
      height={48}
      shrink={0}
      items="center"
      gap="$2"
      px="$3"
      borderBottomWidth={1}
      borderColor="$borderColor"
      bg="$background"
    >
      <XStack items="center" gap="$1" shrink={1}>
        {/*
          Clamped to one line. Titles are generated and can be arbitrarily long;
          a wrapping title would change the header's height mid-conversation.
        */}
        <SizableText size="$2" fontWeight="500" numberOfLines={1}>
          {title}
        </SizableText>
        {onOpenMenu ? (
          <HeaderButton label="Conversation options" onPress={onOpenMenu}>
            <Ellipsis size={16} />
          </HeaderButton>
        ) : null}
      </XStack>

      <XStack flex={1} />
      {children}
    </XStack>
  )
}

export interface HeaderButtonProps {
  /** Required — the accessible name for an icon-only control. */
  label: string
  onPress?: () => void
  children?: ReactNode
}

export function HeaderButton({ label, onPress, children }: HeaderButtonProps) {
  return (
    <XStack
      width={32}
      height={32}
      items="center"
      justify="center"
      rounded="$3"
      cursor="pointer"
      opacity={0.7}
      onPress={onPress}
      role="button"
      tabIndex={0}
      aria-label={label}
      {...tip(label)}
      hoverStyle={{ bg: '$color4', opacity: 1 }}
      pressStyle={{ bg: '$color5' }}
    >
      {children}
    </XStack>
  )
}

export interface ShareButtonProps {
  label?: string
  onPress?: () => void
}

/**
 * ShareButton — carries a word, unlike its neighbours.
 *
 * Sharing sends the conversation somewhere else and is not quietly undoable, so
 * it reads as a label rather than a glyph. Everything reversible in this bar is
 * an icon; this deliberately is not.
 */
export function ShareButton({ label = 'Share', onPress }: ShareButtonProps) {
  return (
    <XStack
      {...slot('chat-share')}
      items="center"
      gap="$1.5"
      px="$2.5"
      py="$1.5"
      rounded="$3"
      cursor="pointer"
      opacity={0.8}
      onPress={onPress}
      role="button"
      tabIndex={0}
      hoverStyle={{ bg: '$color4', opacity: 1 }}
      pressStyle={{ bg: '$color5' }}
    >
      <Share2 size={14} />
      <SizableText size="$1" fontWeight="500">
        {label}
      </SizableText>
    </XStack>
  )
}

export interface AsideToggleProps {
  label?: string
  onPress?: () => void
}

export function AsideToggle({ label = 'Toggle details panel', onPress }: AsideToggleProps) {
  return (
    <HeaderButton label={label} onPress={onPress}>
      <PanelRight size={16} />
    </HeaderButton>
  )
}

export interface AsideProps {
  children?: ReactNode
  width?: number
}

/**
 * Aside — the right rail (sources, artifacts, run details).
 *
 * Its own column, not an overlay: an overlay would sit on top of the prose the
 * reader is comparing it against, which is the one thing a citation panel must
 * not do. Surfaces hide it at narrow widths by not rendering it.
 */
export function Aside({ children, width = 320 }: AsideProps) {
  return (
    <YStack
      {...slot('chat-aside')}
      width={width}
      shrink={0}
      height="100%"
      p="$3"
      gap="$3"
      borderLeftWidth={1}
      borderColor="$borderColor"
    >
      {children}
    </YStack>
  )
}
