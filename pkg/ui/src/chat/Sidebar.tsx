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
 *
 * Every part spreads its RESIDUAL props onto its root, last, so a caller's value
 * wins over the default. That is the module contract for the rest of the chat
 * surface and these nine were the exception: each destructured a fixed set and
 * dropped everything else on the floor, so a surface that wanted one more pixel
 * of padding had to wrap the row in a div and reach through it with `!important`.
 * A component that cannot be adjusted gets forked instead, which is how one
 * sidebar becomes four.
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
import { useI18n } from '@hanzo/i18n/react'
import { useState, type ComponentProps, type ReactNode } from 'react'

import { RING } from '../backends/gui/press'
import { slot, tip } from '../backends/gui/slot'
import { mirror } from '../backends/gui/dir'

/** The props of the primitive each part is built on, minus what the part names. */
type Row = Omit<ComponentProps<typeof XStack>, 'children'>
type Col = Omit<ComponentProps<typeof YStack>, 'children'>
type Scroll = Omit<ComponentProps<typeof ScrollView>, 'children'>

const WIDTH = 264
const ROW = { px: '$2', py: '$1.5', rounded: '$3' } as const

export interface SidebarProps extends Col {
  children?: ReactNode
  /** Column width in px. */
  width?: number
}

export function Sidebar({ children, width = WIDTH, ...rest }: SidebarProps) {
  return (
    <YStack
      {...slot('sidebar')}
      width={width}
      // A sidebar is a fixed column — `shrink: 0` is the point, and it stays.
      // But fixed is not the same as unbounded: with no ceiling it drew its full
      // 264px inside a 232px cell and pushed the whole document sideways, at one
      // breakpoint only. A width says how wide it WANTS to be; the ceiling says
      // it may not take more than it was given.
      maxW="100%"
      shrink={0}
      height="100%"
      gap="$1"
      p="$2"
      bg="$panel"
      borderInlineEndWidth={1}
      borderColor="$borderColor"
      {...rest}
    >
      {children}
    </YStack>
  )
}

export interface SidebarHeaderProps extends Row {
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
  ...rest
}: SidebarHeaderProps) {
  const { t } = useI18n()
  return (
    <XStack {...slot('sidebar-header')} items="center" gap="$1" px="$1" py="$1.5" {...rest}>
      {onOpenSwitcher ? (
        <XStack
          render={<button type="button" />}
          {...ROW}
          items="center"
          gap="$1"
          minW={0}
          shrink={1}
          borderWidth={0}
          bg="transparent"
          cursor="pointer"
          onClick={onOpenSwitcher}
          hoverStyle={{ bg: '$edge' }}
          pressStyle={{ bg: '$raised' }}
          focusVisibleStyle={RING}
        >
          <SizableText size="$3" fontWeight="600" numberOfLines={1} text="start">
            {title}
          </SizableText>
          <ChevronDown size={14} opacity={0.6} aria-hidden />
        </XStack>
      ) : (
        <XStack {...ROW} items="center" gap="$1" minW={0} shrink={1}>
          <SizableText size="$3" fontWeight="600" numberOfLines={1}>
            {title}
          </SizableText>
        </XStack>
      )}

      <XStack flex={1} />
      {onSearch ? (
        <SidebarIconButton label={t('Search conversations')} onPress={onSearch}>
          <Search size={16} />
        </SidebarIconButton>
      ) : null}
      {onCollapse ? (
        <SidebarIconButton label={t('Collapse sidebar')} onPress={onCollapse}>
          <PanelLeft {...mirror} size={16} />
        </SidebarIconButton>
      ) : null}
    </XStack>
  )
}

export interface SidebarIconButtonProps extends Row {
  /**
   * Required. Becomes the accessible name — an icon-only control without one is
   * unreadable to a screen reader, and these controls are the whole navigation.
   */
  label: string
  onPress?: () => void
  children?: ReactNode
}

export function SidebarIconButton({ label, onPress, onClick, children, ...rest }: SidebarIconButtonProps) {
  return (
    <XStack
      render={<button type="button" />}
      width={28}
      height={28}
      items="center"
      justify="center"
      rounded="$3"
      borderWidth={0}
      bg="transparent"
      cursor="pointer"
      opacity={0.7}
      onClick={
        onPress || onClick
          ? (e) => {
              onClick?.(e)
              onPress?.()
            }
          : undefined
      }
      aria-label={label}
      {...tip(label)}
      hoverStyle={{ bg: '$edge', opacity: 1 }}
      pressStyle={{ bg: '$raised' }}
      focusVisibleStyle={RING}
      {...rest}
    >
      {children}
    </XStack>
  )
}

export interface SidebarNewChatProps extends Row {
  /** Absent, "New chat" in the reader's language. */
  label?: string
  onPress?: () => void
}

export function SidebarNewChat({ label, onPress, onClick, ...rest }: SidebarNewChatProps) {
  const { t } = useI18n()
  return (
    <XStack
      render={<button type="button" />}
      {...slot('sidebar-new-chat')}
      {...ROW}
      width="100%"
      items="center"
      gap="$2"
      borderWidth={0}
      bg="transparent"
      cursor="pointer"
      onClick={
        onPress || onClick
          ? (e) => {
              onClick?.(e)
              onPress?.()
            }
          : undefined
      }
      hoverStyle={{ bg: '$edge' }}
      pressStyle={{ bg: '$raised' }}
      focusVisibleStyle={RING}
      {...rest}
    >
      <SquarePen size={16} aria-hidden />
      <SizableText size="$2" fontWeight="500" text="start">
        {label ?? t('New chat')}
      </SizableText>
    </XStack>
  )
}

/** SidebarScroll — the scrolling middle, so header and user chip stay pinned. */
export interface SidebarScrollProps extends Scroll {
  children?: ReactNode
}

export function SidebarScroll({ children, ...rest }: SidebarScrollProps) {
  return (
    <ScrollView
      {...slot('sidebar-scroll')}
      flex={1}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      <YStack gap="$0.5">{children}</YStack>
    </ScrollView>
  )
}

export interface SidebarSectionProps extends Col {
  label?: string
  children?: ReactNode
}

export function SidebarSection({ label, children, ...rest }: SidebarSectionProps) {
  return (
    <YStack {...slot('sidebar-section')} mt="$3" gap="$0.5" {...rest}>
      {label ? (
        <SizableText size="$1" px="$2" py="$1" color="$soft" fontWeight="500">
          {label}
        </SizableText>
      ) : null}
      {children}
    </YStack>
  )
}

export interface SidebarItemProps extends Row {
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
export function SidebarItem({ children, active = false, onPress, onClick, icon, ...rest }: SidebarItemProps) {
  return (
    <XStack
      render={<button type="button" />}
      {...slot('sidebar-item')}
      {...ROW}
      width="100%"
      items="center"
      gap="$2"
      borderWidth={0}
      cursor="pointer"
      onClick={
        onPress || onClick
          ? (e) => {
              onClick?.(e)
              onPress?.()
            }
          : undefined
      }
      aria-current={active ? 'page' : undefined}
      bg={active ? '$edge' : 'transparent'}
      hoverStyle={{ bg: active ? '$edge' : '$hover' }}
      pressStyle={{ bg: '$raised' }}
      focusVisibleStyle={RING}
      {...rest}
    >
      {icon ? <YStack opacity={0.7}>{icon}</YStack> : null}
      <SizableText
        size="$2"
        numberOfLines={1}
        flex={1}
        minW={0}
        maxW="100%"
        overflow="hidden"
        text="start"
        color={active ? '$color' : '$quiet'}
        $platform-web={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
      >
        {children}
      </SizableText>
    </XStack>
  )
}

export interface SidebarFolderProps extends Col {
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
  ...rest
}: SidebarFolderProps) {
  const [own, setOwn] = useState(defaultOpen)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : own

  const toggle = () => {
    if (!controlled) setOwn((v) => !v)
    onOpenChange?.(!open)
  }

  return (
    <YStack {...slot('sidebar-folder')} {...rest}>
      <XStack
        render={<button type="button" />}
        {...ROW}
        width="100%"
        items="center"
        gap="$1.5"
        borderWidth={0}
        bg="transparent"
        cursor="pointer"
        onClick={toggle}
        aria-expanded={open}
        hoverStyle={{ bg: '$hover' }}
        pressStyle={{ bg: '$raised' }}
        focusVisibleStyle={RING}
      >
        {open ? (
          <ChevronDown size={14} opacity={0.6} aria-hidden />
        ) : (
          <ChevronRight {...mirror} size={14} opacity={0.6} aria-hidden />
        )}
        <Folder size={16} opacity={0.7} aria-hidden />
        <SizableText size="$2" numberOfLines={1} flex={1} minW={0} text="start" color="$quiet">
          {name}
        </SizableText>
      </XStack>
      {open ? (
        <YStack paddingInlineStart="$4" gap="$0.5">
          {children}
        </YStack>
      ) : null}
    </YStack>
  )
}

export interface SidebarUserProps extends Row {
  name: string
  secondary?: string
  /** Avatar slot. Falls back to the first letter of `name`. */
  avatar?: ReactNode
  onPress?: () => void
  onHelp?: () => void
}

export function SidebarUser({ name, secondary, avatar, onPress, onHelp, ...rest }: SidebarUserProps) {
  const { t } = useI18n()
  return (
    <XStack
      {...slot('sidebar-user')}
      items="center"
      gap="$1"
      mt="$1"
      pt="$2"
      borderTopWidth={1}
      borderColor="$borderColor"
      {...rest}
    >
      <XStack
        render={<button type="button" />}
        {...ROW}
        items="center"
        gap="$2"
        flex={1}
        minW={0}
        borderWidth={0}
        bg="transparent"
        cursor="pointer"
        onClick={onPress}
        hoverStyle={{ bg: '$hover' }}
        pressStyle={{ bg: '$raised' }}
        focusVisibleStyle={RING}
      >
        <XStack
          width={24}
          height={24}
          rounded={9999}
          items="center"
          justify="center"
          bg="$raised"
          overflow="hidden"
          shrink={0}
        >
          {avatar ?? (
            <SizableText size="$1" fontWeight="600">
              {name.charAt(0).toUpperCase()}
            </SizableText>
          )}
        </XStack>
        <YStack flex={1} minW={0} items="flex-start">
          <SizableText size="$2" numberOfLines={1} text="start">
            {name}
          </SizableText>
          {secondary ? (
            <SizableText size="$1" color="$soft" numberOfLines={1} text="start">
              {secondary}
            </SizableText>
          ) : null}
        </YStack>
      </XStack>
      {onHelp ? (
        <SidebarIconButton label={t('Help')} onPress={onHelp}>
          <CircleHelp size={16} />
        </SidebarIconButton>
      ) : null}
    </XStack>
  )
}
