'use client'

/**
 * SelectMenu — a compact, reusable dropdown select. Renders a labelled trigger ("All
 * types", or the chosen option) and a menu list with a check on the active option.
 * Prop-driven + self-contained. `value === null` is the "all"/unfiltered state.
 *
 * A thin DropdownMenu (the ONE menu mechanism) so it is pixel-identical to every other
 * menu and rides the same portal-theme-safe Portal path — no gui Popover, no Sheet
 * re-root, works on gui-native hosts.
 */
import type { ReactElement } from 'react'
import { Button, Text } from '@hanzo/gui'
import { ChevronDown } from '@hanzogui/lucide-icons-2'
import { DropdownMenu } from './menu/DropdownMenu'
import type { MenuItemSpec } from './menu/items'

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
  const active = value === null ? null : options.find((o) => o.key === value) ?? null
  const triggerLabel = active ? active.label : allLabel

  const items: MenuItemSpec[] = [
    { key: '__all__', label: allLabel, selected: value === null, onSelect: () => onChange(null) },
    ...options.map((o) => ({ key: o.key, label: o.label, selected: value === o.key, onSelect: () => onChange(o.key) })),
  ]

  return (
    <DropdownMenu
      minWidth={Math.max(minWidth, 160)}
      trigger={
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
      }
      items={items}
    />
  )
}
