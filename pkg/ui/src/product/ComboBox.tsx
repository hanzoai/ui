'use client'

/**
 * ComboBox — a typeable select: a text input the user can type any value into,
 * PLUS a popover of LIVE options (filtered by what's typed) they can pick from.
 * The value is always exactly the input text, so a custom id is inherently
 * supported — selecting an option just fills the input. This is the ONE way the
 * console offers "pick from a live list OR type your own" (the model field, the
 * tool field). Prop-driven + self-contained (options/loading/error injected by the
 * caller), so it is orthogonal to the data source and lifts into `@hanzo/ui`.
 *
 * Idiom: the same @hanzo/gui Popover shell as OrgSwitcher/SelectMenu (bordered,
 * elevate, `$color2`). Options render in a portal above the DetailPane SlideOver.
 */
import { useMemo, useState } from 'react'
import { Button, Input, Popover, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { Check, ChevronDown, RefreshCw } from '@hanzogui/lucide-icons-2'

import { filterOptions, type ComboOption } from './combobox/filter'

export type { ComboOption } from './combobox/filter'

export function ComboBox({
  value,
  onChange,
  options,
  loading = false,
  error = null,
  onRetry,
  placeholder,
  disabled,
  emptyText = 'No matches — press to use what you typed.',
  minWidth = 240,
}: {
  value: string
  onChange: (v: string) => void
  /** The live option list. Filtered against the typed text. */
  options: ComboOption[]
  /** True while the caller is loading the option list (shows a spinner row). */
  loading?: boolean
  /** A human message when the option list failed to load (list still typeable). */
  error?: string | null
  /** Retry the option load (shown next to the error). */
  onRetry?: () => void
  placeholder?: string
  disabled?: boolean
  /** Row shown when the filter matches nothing (the typed value is still usable). */
  emptyText?: string
  minWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => filterOptions(options, value), [options, value])

  const pick = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom-start" allowFlip>
      <XStack items="center" gap="$2" minW={minWidth}>
        <Input
          flex={1}
          value={value}
          onChangeText={(v) => {
            onChange(v)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          autoCapitalize="none"
        />
        <Popover.Trigger asChild>
          <Button
            size="$2"
            chromeless
            disabled={disabled}
            icon={<ChevronDown size={16} opacity={0.7} />}
            onPress={() => setOpen((o) => !o)}
            aria-label="Show options"
          />
        </Popover.Trigger>
      </XStack>

      <Popover.Content className="hz-paper hz-menu-in" bordered p="$1.5" minW={minWidth} bg="$color2" borderColor="$borderColor">
        <YStack gap="$0.5" minW={minWidth} maxH={300} overflow="scroll">
          {loading ? (
            <XStack items="center" gap="$2" px="$2.5" py="$2">
              <Spinner size="small" color="$color11" />
              <Text fontSize="$2" color="$color10">
                Loading options…
              </Text>
            </XStack>
          ) : error ? (
            <XStack items="center" gap="$2" px="$2.5" py="$2">
              <Text fontSize="$2" color="$color10" flex={1} numberOfLines={2}>
                {error}
              </Text>
              {onRetry ? (
                <Button size="$1" chromeless icon={<RefreshCw size={12} />} onPress={onRetry} aria-label="Retry" />
              ) : null}
            </XStack>
          ) : filtered.length === 0 ? (
            <Text fontSize="$2" color="$color10" px="$2.5" py="$2">
              {emptyText}
            </Text>
          ) : (
            filtered.map((o) => (
              <Row key={o.value} option={o} active={o.value === value} onPress={() => pick(o.value)} />
            ))
          )}
        </YStack>
      </Popover.Content>
    </Popover>
  )
}

function Row({ option, active, onPress }: { option: ComboOption; active: boolean; onPress: () => void }) {
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
      <YStack flex={1} minW={0}>
        <Text fontSize="$2" color="$color12" numberOfLines={1}>
          {option.label ?? option.value}
        </Text>
        {option.hint ? (
          <Text fontSize="$1" color="$color10" numberOfLines={1}>
            {option.hint}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  )
}
