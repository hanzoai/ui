'use client'

/**
 * Sidebar — conversation navigation for a chat surface.
 *
 * Composed of parts rather than fed a tree, because surfaces disagree about what
 * a conversation list contains: hanzo.chat groups into folders, the console
 * groups by project, hanzo.app shows a flat recents list. A `sections` prop
 * would have to model all three; parts let each surface arrange its own and
 * still get identical rows.
 *
 * Presentational: no routing, no fetching, no active-id resolution. `active` is
 * passed in, `onPress` is raised out.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Folder,
  PanelLeft,
  Search,
  SquarePen,
} from '@hanzogui/lucide-icons-2'
import { useState, type ReactNode } from 'react'

import { slot, tip } from '../backends/gui/slot'

const WIDTH = 264
const ROW = { px: '$2', py: '$1.5', rounded: '$3' } as const

export interface SidebarProps {
  children?: ReactNode
  /** Column width in px. */
  width?: number
}

export function Sidebar({ children, width = WIDTH }: SidebarProps) {
  return (
    <YStack
      {...slot('sidebar')}
      width={width}
      shrink={0}
      height="100%"
      gap="$1"
      p="$2"
      bg="$color2"
      borderRightWidth={1}
      borderColor="$borderColor"
    >
      {children}
    </YStack>
  )
}

export interface SidebarHeaderProps {
  /** Product name. Not the workspace or account — those belong in SidebarUser. */
  title: string
  onOpenSwitcher?: () => void
  onSearch?: () => void
  onCollapse?: () => void
}

export function SidebarHeader({
  title,
  onOpenSwitcher,
  onSearch,
  onCollapse,
}: SidebarHeaderProps) {
  return (
    <XStack {...slot('sidebar-header')} items="center" gap="$1" px="$1" py="$1.5">
      <XStack
        {...ROW}
        items="center"
        gap="$1"
        shrink={1}
        cursor={onOpenSwitcher ? 'pointer' : undefined}
        onPress={onOpenSwitcher}
        hoverStyle={onOpenSwitcher ? { bg: '$color4' } : undefined}
        pressStyle={onOpenSwitcher ? { bg: '$color5' } : undefined}
      >
        <SizableText size="$3" fontWeight="600" numberOfLines={1}>
          {title}
        </SizableText>
        {onOpenSwitcher ? <ChevronDown size={14} opacity={0.6} /> : null}
      </XStack>

      <XStack flex={1} />
      {onSearch ? (
        <SidebarIconButton label="Search conversations" onPress={onSearch}>
          <Search size={16} />
        </SidebarIconButton>
      ) : null}
      {onCollapse ? (
        <SidebarIconButton label="Collapse sidebar" onPress={onCollapse}>
          <PanelLeft size={16} />
        </SidebarIconButton>
      ) : null}
    </XStack>
  )
}

export interface SidebarIconButtonProps {
  /**
   * Required. Becomes the accessible name — an icon-only control without one is
   * unreadable to a screen reader, and these controls are the whole navigation.
   */
  label: string
  onPress?: () => void
  children?: ReactNode
}

export function SidebarIconButton({ label, onPress, children }: SidebarIconButtonProps) {
  return (
    <XStack
      width={28}
      height={28}
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

export interface SidebarNewChatProps {
  label?: string
  onPress?: () => void
}

export function SidebarNewChat({ label = 'New chat', onPress }: SidebarNewChatProps) {
  return (
    <XStack
      {...slot('sidebar-new-chat')}
      {...ROW}
      items="center"
      gap="$2"
      cursor="pointer"
      onPress={onPress}
      role="button"
      tabIndex={0}
      hoverStyle={{ bg: '$color4' }}
      pressStyle={{ bg: '$color5' }}
    >
      <SquarePen size={16} />
      <SizableText size="$2" fontWeight="500">
        {label}
      </SizableText>
    </XStack>
  )
}

/** SidebarScroll — the scrolling middle, so header and user chip stay pinned. */
export function SidebarScroll({ children }: { children?: ReactNode }) {
  return (
    <ScrollView {...slot('sidebar-scroll')} flex={1} showsVerticalScrollIndicator={false}>
      <YStack gap="$0.5">{children}</YStack>
    </ScrollView>
  )
}

export interface SidebarSectionProps {
  label?: string
  children?: ReactNode
}

export function SidebarSection({ label, children }: SidebarSectionProps) {
  return (
    <YStack {...slot('sidebar-section')} mt="$3" gap="$0.5">
      {label ? (
        <SizableText size="$1" px="$2" py="$1" color="$color10" fontWeight="500">
          {label}
        </SizableText>
      ) : null}
      {children}
    </YStack>
  )
}

export interface SidebarItemProps {
  children?: ReactNode
  active?: boolean
  onPress?: () => void
  icon?: ReactNode
}

/**
 * SidebarItem — one conversation.
 *
 * The title is clamped to a single line rather than wrapped: generated titles
 * run long, and a wrapping row makes the list's scan height irregular while the
 * first few words are what identify a conversation anyway.
 */
export function SidebarItem({ children, active = false, onPress, icon }: SidebarItemProps) {
  return (
    <XStack
      {...slot('sidebar-item')}
      {...ROW}
      items="center"
      gap="$2"
      cursor="pointer"
      onPress={onPress}
      role="button"
      tabIndex={0}
      aria-current={active ? 'page' : undefined}
      bg={active ? '$color4' : undefined}
      hoverStyle={{ bg: active ? '$color4' : '$color3' }}
      pressStyle={{ bg: '$color5' }}
    >
      {icon ? <YStack opacity={0.7}>{icon}</YStack> : null}
      <SizableText size="$2" numberOfLines={1} flex={1} color={active ? '$color' : '$color11'}>
        {children}
      </SizableText>
    </XStack>
  )
}

export interface SidebarFolderProps {
  name: string
  children?: ReactNode
  /** Uncontrolled initial state. Ignored when `open` is passed. */
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * SidebarFolder — a collapsible group.
 *
 * Uncontrolled by default and controlled the moment `open` is supplied, so the
 * common case needs no state while a surface that persists expansion can still
 * drive it.
 */
export function SidebarFolder({
  name,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
}: SidebarFolderProps) {
  const [own, setOwn] = useState(defaultOpen)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : own

  const toggle = () => {
    if (!controlled) setOwn((v) => !v)
    onOpenChange?.(!open)
  }

  return (
    <YStack {...slot('sidebar-folder')}>
      <XStack
        {...ROW}
        items="center"
        gap="$1.5"
        cursor="pointer"
        onPress={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        hoverStyle={{ bg: '$color3' }}
        pressStyle={{ bg: '$color5' }}
      >
        {open ? (
          <ChevronDown size={14} opacity={0.6} />
        ) : (
          <ChevronRight size={14} opacity={0.6} />
        )}
        <Folder size={16} opacity={0.7} />
        <SizableText size="$2" numberOfLines={1} flex={1} color="$color11">
          {name}
        </SizableText>
      </XStack>
      {open ? (
        <YStack pl="$4" gap="$0.5">
          {children}
        </YStack>
      ) : null}
    </YStack>
  )
}

export interface SidebarUserProps {
  name: string
  secondary?: string
  /** Avatar slot. Falls back to the first letter of `name`. */
  avatar?: ReactNode
  onPress?: () => void
  onHelp?: () => void
}

export function SidebarUser({ name, secondary, avatar, onPress, onHelp }: SidebarUserProps) {
  return (
    <XStack
      {...slot('sidebar-user')}
      items="center"
      gap="$1"
      mt="$1"
      pt="$2"
      borderTopWidth={1}
      borderColor="$borderColor"
    >
      <XStack
        {...ROW}
        items="center"
        gap="$2"
        flex={1}
        cursor="pointer"
        onPress={onPress}
        role="button"
        tabIndex={0}
        hoverStyle={{ bg: '$color3' }}
        pressStyle={{ bg: '$color5' }}
      >
        <XStack
          width={24}
          height={24}
          rounded={9999}
          items="center"
          justify="center"
          bg="$color5"
          overflow="hidden"
        >
          {avatar ?? (
            <SizableText size="$1" fontWeight="600">
              {name.charAt(0).toUpperCase()}
            </SizableText>
          )}
        </XStack>
        <YStack flex={1}>
          <SizableText size="$2" numberOfLines={1}>
            {name}
          </SizableText>
          {secondary ? (
            <SizableText size="$1" color="$color10" numberOfLines={1}>
              {secondary}
            </SizableText>
          ) : null}
        </YStack>
      </XStack>
      {onHelp ? (
        <SidebarIconButton label="Help" onPress={onHelp}>
          <CircleHelp size={16} />
        </SidebarIconButton>
      ) : null}
    </XStack>
  )
}
