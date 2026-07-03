// Menu — the ONE dropdown/overlay primitive the data views use (column sort menu,
// filter builder, select/relation pickers, view switcher). A thin, controlled
// wrapper over @hanzo/gui's proven Popover with the package's raw-hex palette
// (theme-config independent) and a scrolling content panel. Everything that pops
// over goes through here, so menus look and behave identically everywhere.
import type { ReactNode } from 'react'
import { Popover, ScrollView, XStack, YStack } from '@hanzo/gui'
import { tokens } from '../theme'

export interface MenuProps {
  /** The element that opens the menu (wrapped in a Popover.Trigger). */
  trigger: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: 'bottom-start' | 'bottom-end' | 'bottom' | 'top-start' | 'top-end'
  width?: number
  /** Max content height before the panel scrolls (default 320). */
  maxHeight?: number
  /** A fixed panel above the scrolling body (e.g. a search box). */
  header?: ReactNode
}

/** A controlled popover menu with the data palette. Trigger toggles; select closes. */
export function Menu({ trigger, children, open, onOpenChange, placement = 'bottom-start', width = 240, maxHeight = 320, header }: MenuProps) {
  return (
    <Popover placement={placement} open={open} onOpenChange={onOpenChange} allowFlip>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Content
        borderWidth={1}
        p={0}
        rounded={10}
        overflow="hidden"
        elevate
        width={width}
        style={{ backgroundColor: tokens.surfaceRaised, borderColor: tokens.border }}
      >
        {header ? (
          <YStack p={6} style={{ borderBottomWidth: 1, borderBottomColor: tokens.border }}>
            {header}
          </YStack>
        ) : null}
        <ScrollView style={{ maxHeight }}>
          <YStack p={4}>{children}</YStack>
        </ScrollView>
      </Popover.Content>
    </Popover>
  )
}

export interface MenuItemProps {
  children: ReactNode
  onPress?: () => void
  active?: boolean
  /** A leading glyph / control. */
  icon?: ReactNode
  /** A trailing glyph (e.g. a check). */
  trailing?: ReactNode
  tone?: 'default' | 'danger'
}

/** One selectable row in a Menu — hover-highlighted, with optional lead/trail slots. */
export function MenuItem({ children, onPress, active, icon, trailing, tone = 'default' }: MenuItemProps) {
  return (
    <YStack
      onPress={onPress}
      cursor="pointer"
      px={10}
      py={7}
      rounded={6}
      hoverStyle={{ bg: tokens.hover }}
      style={active ? { backgroundColor: tokens.hover } : undefined}
    >
      <XStack items="center" gap={8}>
        {icon ? <XStack items="center" justify="center">{icon}</XStack> : null}
        <YStack flex={1}>{children}</YStack>
        {trailing ?? null}
      </XStack>
    </YStack>
  )
}
