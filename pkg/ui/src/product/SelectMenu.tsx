'use client'

/**
 * SelectMenu — a compact, reusable dropdown select on @hanzo/gui Popover. Renders a
 * labelled trigger ("All types", or the chosen option) and a menu list with a check on
 * the active option. Prop-driven + self-contained. `value === null` is the
 * "all"/unfiltered state.
 *
 * Uses the ONE shared menu spec (MenuPanel + MenuItemView) so it is pixel-identical to
 * DropdownMenu/ContextMenu, and the SAME portal-theme fix (PortalTheme) so it renders
 * correctly through the portal under a nested `<Theme>`, light or dark.
 */
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Button, Popover, Text } from '@hanzo/gui'
import { ChevronDown } from '@hanzogui/lucide-icons-2'
import { MenuItemView, MenuPanel } from './menu/items'
import { PortalTheme, useThemeName } from './menu/portal-theme'
import { menuKeyDown } from './menu/roving'

export type SelectOption<T extends string> = { key: T; label: string }

export function SelectMenu<T extends string>({
  options,
  value,
  onChange,
  allLabel = 'All',
  icon,
  minWidth = 130,
}: {
  options: SelectOption<T>[]
  value: T | null
  onChange: (v: T | null) => void
  /** Label shown (and first menu row) for the unfiltered `null` state. */
  allLabel?: string
  /** Optional leading icon in the trigger. */
  icon?: ReactElement
  minWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const themeName = useThemeName()
  const active = value === null ? null : options.find((o) => o.key === value) ?? null
  const triggerLabel = active ? active.label : allLabel

  const pick = (v: T | null) => {
    onChange(v)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom-start">
      <Popover.Trigger asChild>
        <Button
          size="$2"
          minW={minWidth}
          justify="space-between"
          borderWidth={1}
          borderColor="$borderColor"
          bg={value !== null ? '$color5' : 'transparent'}
          icon={icon}
          iconAfter={<ChevronDown size={14} opacity={0.6} />}
        >
          <Text fontSize="$2" color="$color12" numberOfLines={1} flex={1}>
            {triggerLabel}
          </Text>
        </Button>
      </Popover.Trigger>
      <Popover.Content backgroundColor="transparent" borderWidth={0} padding={0} elevation={0}>
        <PortalTheme name={themeName}>
          <MenuPanel minWidth={minWidth} maxHeight={320} onKeyDown={(e) => menuKeyDown(e, () => setOpen(false))}>
            <MenuItemView label={allLabel} selected={value === null} onSelect={() => pick(null)} />
            {options.map((o) => (
              <MenuItemView key={o.key} label={o.label} selected={value === o.key} onSelect={() => pick(o.key)} />
            ))}
          </MenuPanel>
        </PortalTheme>
      </Popover.Content>
    </Popover>
  )
}
