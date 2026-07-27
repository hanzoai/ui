'use client'

/**
 * SelectMenu — a compact, reusable dropdown select on @hanzo/gui Popover (the
 * console's proven dropdown idiom, same as OrgSwitcher/ScopeSwitcher). Renders a
 * labelled trigger ("All types", or the chosen option) and a popover list with a
 * check on the active option. Prop-driven + self-contained so it lifts into
 * `@hanzo/ui`. `value === null` is the "all"/unfiltered state.
 */
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Button, Popover, Text, XStack, YStack } from '@hanzo/gui'
import { ChevronDown, Check } from '@hanzogui/lucide-icons-2'

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
      <Popover.Content className="hz-paper hz-menu-in" bordered p="$1.5" minW={minWidth} bg="$color2" borderColor="$borderColor">
        <YStack gap="$0.5" minW={minWidth} maxH={320} overflow="scroll">
          <Row label={allLabel} active={value === null} onPress={() => pick(null)} />
          {options.map((o) => (
            <Row key={o.key} label={o.label} active={value === o.key} onPress={() => pick(o.key)} />
          ))}
        </YStack>
      </Popover.Content>
    </Popover>
  )
}

function Row({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <XStack
      items="center"
      gap="$2"
      px="$2.5"
      py="$1.5"
      rounded="$3"
      cursor="pointer"
      hoverStyle={{ bg: '$color4' }}
      bg={active ? '$color4' : 'transparent'}
      onPress={onPress}
    >
      <XStack width={14} items="center" justify="center">
        {active ? <Check size={13} /> : null}
      </XStack>
      <Text fontSize="$2" color="$color12" flex={1} numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  )
}
