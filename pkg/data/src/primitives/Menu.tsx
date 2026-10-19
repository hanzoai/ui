'use client'

// Menu — a controlled floating panel with a scrolling body and an optional fixed
// header (a search box), and MenuItem, one pressable row in it. @hanzo/ui's
// Popover is the surface (its ground, edge, radius and density), the rows take
// the record kit's row geometry: 32px, a 4px corner inside the 8px panel, the
// hover rung. Field pickers use @hanzo/ui's DropdownMenu instead; this stays for
// free-form panels (a filter builder) and for callers of this API.
import type { ReactNode } from 'react'
import { ScrollView, Text, XStack, YStack } from '@hanzo/gui'
import { Popover, PopoverContent, PopoverTrigger } from '@hanzo/ui'

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

/** A controlled popover menu. Trigger toggles; select closes. */
export function Menu({ trigger, children, open, onOpenChange, placement = 'bottom-start', width = 240, maxHeight = 320, header }: MenuProps) {
  return (
    <Popover placement={placement} open={open} onOpenChange={onOpenChange} allowFlip>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent size="sm" p={0} gap={0} width={width} overflow="hidden">
        {header ? (
          <YStack p="$1" borderBottomWidth={1} borderColor="$borderColor">
            {header}
          </YStack>
        ) : null}
        <ScrollView style={{ maxHeight }}>
          <YStack p="$1" gap={2}>
            {children}
          </YStack>
        </ScrollView>
      </PopoverContent>
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
    <XStack
      {...({ role: 'menuitem', tabIndex: 0 } as object)}
      onPress={onPress}
      onKeyDown={(e: { key?: string; preventDefault?: () => void }) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault?.()
        onPress?.()
      }}
      cursor="pointer"
      items="center"
      gap="$2"
      minH={32}
      px="$2"
      rounded="$xs"
      bg={active ? '$hover' : 'transparent'}
      hoverStyle={{ bg: tone === 'danger' ? ('var(--state-error-bg)' as never) : '$hover' }}
      focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
    >
      {icon ? (
        <XStack items="center" justify="center" shrink={0}>
          {icon}
        </XStack>
      ) : null}
      <YStack flex={1} minW={0}>
        {typeof children === 'string' ? (
          <Text fontSize="$2" color={tone === 'danger' ? '$bad' : '$aside'} numberOfLines={1}>
            {children}
          </Text>
        ) : (
          children
        )}
      </YStack>
      {trailing ?? null}
    </XStack>
  )
}
