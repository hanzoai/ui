'use client'

/**
 * SelectMenu — a compact, reusable dropdown select. Renders a labelled trigger ("All
 * types", or the chosen option) and a menu list with a check on the active option.
 * Prop-driven + self-contained. `value === null` is the "all"/unfiltered state.
 *
 * `required` turns the same control into a "pick exactly one of N": the null row is
 * dropped and the value is never nullable. That is the SAME control, not a second
 * one — a required field picker and a filter differ only in whether "none" is an
 * option, so it stays one component rather than growing a fourth select.
 *
 * A thin DropdownMenu (the ONE menu mechanism) so it is pixel-identical to every other
 * menu and rides the same portal-theme-safe Portal path — no gui Popover, no Sheet
 * re-root, works on gui-native hosts.
 */
import type { ReactElement } from 'react'
import { Button, Text } from '@hanzo/gui'
import { ChevronDown } from '@hanzogui/lucide-icons-2'
import { DropdownMenu } from '../backends/gui/dropdown-menu'
import type { MenuItemSpec } from './menu/items'

export type SelectOption<T extends string> = { key: T; label: string }

export function SelectMenu<T extends string>({
  options,
  value,
  onChange,
  allLabel = 'All',
  icon,
  minWidth = 130,
  required,
  minHeight,
  disabled,
  ariaLabel,
}: {
  options: SelectOption<T>[]
  value: T | null
  onChange: (v: T | null) => void
  /** Label shown (and first menu row) for the unfiltered `null` state. */
  allLabel?: string
  /** Optional leading icon in the trigger. */
  icon?: ReactElement
  minWidth?: number
  /** Exactly one of `options` is always chosen — no "all"/none row. */
  required?: boolean
  /** Trigger height floor — pass the 44px tap floor on a phone. */
  minHeight?: number
  disabled?: boolean
  /** Accessible name for an unlabelled trigger. */
  ariaLabel?: string
}) {
  const active = value === null ? null : options.find((o) => o.key === value) ?? null
  const triggerLabel = active ? active.label : allLabel

  const items: MenuItemSpec[] = [
    ...(required
      ? []
      : [{ key: '__all__', label: allLabel, selected: value === null, onSelect: () => onChange(null) }]),
    ...options.map((o) => ({ key: o.key, label: o.label, selected: value === o.key, onSelect: () => onChange(o.key) })),
  ]

  return (
    <DropdownMenu
      minWidth={Math.max(minWidth, 160)}
      trigger={
        <Button
          size={minHeight && minHeight >= 40 ? '$4' : '$2'}
          minW={minWidth}
          minH={minHeight}
          disabled={disabled}
          aria-label={ariaLabel}
          justify="space-between"
          borderWidth={1}
          borderColor="$borderColor"
          bg={!required && value !== null ? '$raised' : 'transparent'}
          icon={icon}
          iconAfter={<ChevronDown size={14} opacity={0.6} />}
        >
          <Text fontSize="$2" color="$ink" numberOfLines={1} flex={1}>
            {triggerLabel}
          </Text>
        </Button>
      }
      items={items}
    />
  )
}
