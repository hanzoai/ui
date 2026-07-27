'use client'

/**
 * List-filter atoms — the ONE segmented pill control and the ONE search box every
 * table surface filters with.
 *
 * These were first written for the Inference endpoints dashboard; promoted here so a
 * sibling product (Infrastructure, …) never reaches into `inference/` for shell chrome
 * — the same separation-of-concerns move `ui/Metric.tsx` made out of `gpus/`.
 * `inference/parts.tsx` re-exports them, so there is exactly one definition.
 */
import type { ComponentProps } from 'react'
import { Button, Input, Text, XStack } from '@hanzo/gui'
import { Search } from '@hanzogui/lucide-icons-2'

/** One pill in a segmented control. */
export type Option<T extends string> = { label: string; value: T }

/** A compact segmented pill control — the ONE way filters/ranges/toggles render. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = '$2',
}: {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  size?: ComponentProps<typeof Button>['size']
}) {
  return (
    <XStack gap="$1" flexWrap="wrap" items="center">
      {options.map((o) => {
        const active = o.value === value
        return (
          <Button
            key={o.value}
            size={size}
            bg={active ? '$color5' : 'transparent'}
            borderWidth={1}
            borderColor={active ? '$color7' : '$borderColor'}
            aria-pressed={active}
            onPress={() => onChange(o.value)}
          >
            <Text fontSize="$2" fontWeight={active ? '700' : '500'} color={active ? '$color12' : '$color11'}>
              {o.label}
            </Text>
          </Button>
        )
      })}
    </XStack>
  )
}

/** A search input with a leading magnifier. */
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <XStack flex={1} minW={180} items="center" gap="$2" px="$3" borderWidth={1} borderColor="$borderColor" rounded="$4" bg="$color1">
      <Search size={15} color="$color10" />
      <Input flex={1} value={value} onChangeText={onChange} placeholder={placeholder} borderWidth={0} bg="transparent" px="$0" fontSize="$3" />
    </XStack>
  )
}
