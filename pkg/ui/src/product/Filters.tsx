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
import { Button, Text, ToggleGroup as GuiToggleGroup, XStack } from '@hanzo/gui'
import { Search } from '@hanzogui/lucide-icons-2'

import { Input } from '../backends/gui/input'
import { InputGroup } from '../backends/gui/input-group'
import { useDensity } from '../backends/gui/density'
import type { FieldSize } from '../backends/gui/control'

import { textSize, useEmit } from './instrument'

/** One pill in a segmented control. `icon` leads the label; an icon-only option needs `aria-label`. */
export type Option<T extends string> = {
  label: string
  value: T
  icon?: ReactNode
  /** Names an icon-only option for assistive technology. */
  'aria-label'?: string
  disabled?: boolean
}

/** The two heights of the track and the inset that holds its thumb off the edge. */
const TRACK = { md: { h: 32, p: 3, item: 24 }, sm: { h: 24, p: 1, item: 20 } } as const

/**
 * A compact segmented pill control — the ONE way filters/ranges/toggles render.
 *
 * `variant="track"` is one choice from a few as a pill track (the record kit's
 * SegmentedControl, MIT, NOTICE): the options on one panel-ground capsule, the
 * chosen one lifted onto the raised rung in full ink, the rest quiet. Radio
 * semantics, from gui's single ToggleGroup: one tab stop, the arrows move the
 * choice. `trackSize` md (32) or sm (24); `itemWidth` equal or content. The
 * default `row` is the row of separate bordered buttons it has always been.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = '$2',
  name,
  variant = 'row',
  trackSize = 'md',
  itemWidth = 'equal',
  disabled,
  'aria-label': ariaLabel,
}: {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  size?: ComponentProps<typeof Button>['size']
  /** Names the filter in analytics (`status`, `range`); defaults to `Segmented`. */
  name?: string
  variant?: 'row' | 'track'
  trackSize?: 'md' | 'sm'
  itemWidth?: 'equal' | 'content'
  disabled?: boolean
  /** Names the choice for assistive technology. */
  'aria-label'?: string
}) {
  const track = useEmit()
  const pick = (v: T) => {
    track({ component: 'Segmented', action: 'filter', id: name, value: v })
    onChange(v)
  }
  if (variant === 'track') {
    const box = TRACK[trackSize]
    // A radio group: the arrows move the CHOICE, not only the focus (gui's
    // roving focus moves the focus; this moves the value with it).
    const live = options.filter((o) => !o.disabled)
    const onKeyDown = (e: { key?: string; preventDefault?: () => void }) => {
      const by = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
      if (!by || disabled || live.length === 0) return
      const at = live.findIndex((o) => o.value === value)
      pick(live[(at + by + live.length) % live.length].value)
    }
    return (
      <GuiToggleGroup
        data-slot="segmented"
        {...({
          type: 'single',
          value,
          onValueChange: (next: string) => next && pick(next as T),
          disableDeactivation: true,
        } as ComponentProps<typeof GuiToggleGroup>)}
        role="radiogroup"
        aria-label={ariaLabel}
        orientation="horizontal"
        disabled={disabled}
        // No `unstyled` on the root: gui's ToggleGroup root does not consume it
        // and it reached the DOM as an attribute. Every style it would reset is
        // stated below.
        display="inline-flex"
        self="flex-start"
        flexDirection="row"
        items="center"
        gap="$0.5"
        height={box.h}
        // Under a finger design's base sheet lifts every button, a segment
        // included, to the 44px floor; the track grows with its items rather
        // than letting them hang out of it.
        $touchable={{ height: 'auto' as never }}
        p={box.p}
        rounded="$10"
        bg="$panel"
        borderWidth={1}
        borderColor="$borderColor"
        opacity={disabled ? 0.5 : 1}
        {...({ onKeyDown } as object)}
      >
        {options.map((o) => {
          const on = o.value === value
          const iconOnly = !!o.icon && !o.label
          return (
            <GuiToggleGroup.Item
              key={o.value}
              data-slot="segmented-item"
              value={o.value}
              role="radio"
              aria-checked={on}
              aria-label={o['aria-label']}
              disabled={disabled || o.disabled}
              data-state={on ? 'checked' : 'unchecked'}
              unstyled
              flexDirection="row"
              items="center"
              justify="center"
              gap="$1"
              height={box.item}
              minW={box.item}
              px={iconOnly ? 0 : '$2'}
              {...(itemWidth === 'equal' ? { flex: 1, flexBasis: 0 } : null)}
              rounded="$10"
              borderWidth={0}
              bg={on ? '$raised' : 'transparent'}
              cursor={o.disabled ? 'not-allowed' : 'pointer'}
              hoverStyle={{ bg: on ? '$raised' : '$hover' }}
            >
              {o.icon ?? null}
              {o.label ? (
                <Text fontSize="$2" fontWeight="500" color={on ? '$ink' : '$aside'} numberOfLines={1}>
                  {o.label}
                </Text>
              ) : null}
            </GuiToggleGroup.Item>
          )
        })}
      </GuiToggleGroup>
    )
  }
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
            onPress={() => pick(o.value)}
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
 * and `actions` sit beside the field rather than inside it — the record kit's
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
