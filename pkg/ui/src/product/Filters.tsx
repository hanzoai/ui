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
import type { ComponentProps, ReactNode } from 'react'
import { Button, Text, XStack } from '@hanzo/gui'
import { Search } from '@hanzogui/lucide-icons-2'

import { Input } from '../backends/gui/input'
import { InputGroup } from '../backends/gui/input-group'
import { useDensity } from '../backends/gui/density'
import type { FieldSize } from '../backends/gui/control'

import { textSize, useEmit } from './instrument'

/** One pill in a segmented control. */
export type Option<T extends string> = { label: string; value: T }

/** A compact segmented pill control — the ONE way filters/ranges/toggles render. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = '$2',
  name,
}: {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  size?: ComponentProps<typeof Button>['size']
  /** Names the filter in analytics (`status`, `range`); defaults to `Segmented`. */
  name?: string
}) {
  const track = useEmit()
  return (
    <XStack gap="$1" flexWrap="wrap" items="center">
      {options.map((o) => {
        const active = o.value === value
        return (
          <Button
            key={o.value}
            size={size}
            bg={active ? '$raised' : 'transparent'}
            borderWidth={1}
            borderColor={active ? '$bound' : '$borderColor'}
            aria-pressed={active}
            onPress={() => {
              track({ component: 'Segmented', action: 'filter', id: name, value: o.value })
              onChange(o.value)
            }}
          >
            <Text fontSize="$2" fontWeight={active ? '700' : '500'} color={active ? '$ink' : '$quiet'}>
              {o.label}
            </Text>
          </Button>
        )
      })}
    </XStack>
  )
}

/**
 * A search input with a leading magnifier, on the one field box: an
 * `InputGroup`, so the glyph sits in the row (lifting while the field has focus)
 * and `actions` sit beside the field rather than inside it — twenty-ui's
 * SearchInput (MIT, NOTICE). Regular density keeps the sunken ground it always
 * had; compact takes the group's own.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  name,
  size,
  actions,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** Names the search box in analytics; defaults to `SearchInput`. */
  name?: string
  /** The field box (control.ts `BOX`). Unset, the nearest `<Density>` decides. */
  size?: FieldSize
  /** Controls after the field, 8px from it: a filter toggle, a "new" button. */
  actions?: ReactNode
  autoFocus?: boolean
}) {
  const compact = useDensity() === 'compact'
  const track = useEmit()
  // The QUERY IS NEVER SENT — only how long it was. The shape of the behaviour
  // (did people search? how specifically?) without the content.
  const onChangeTracked = (v: string) => {
    track({ component: 'SearchInput', action: 'search', id: name, value: textSize(v) })
    onChange(v)
  }
  const field = (
    <InputGroup
      size={size}
      flex={1}
      minW={180}
      gap="$2"
      {...(compact ? null : { bg: '$sunken' })}
      start={<Search size={16} color="$ink" />}
    >
      <Input value={value} onChangeText={onChangeTracked} placeholder={placeholder} autoFocus={autoFocus} />
    </InputGroup>
  )
  if (!actions) return field
  return (
    <XStack flex={1} minW={180} width="100%" items="center" gap="$2">
      {field}
      <XStack shrink={0} items="center" gap="$2">
        {actions}
      </XStack>
    </XStack>
  )
}
