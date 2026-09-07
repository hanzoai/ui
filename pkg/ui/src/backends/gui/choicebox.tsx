'use client'

/**
 * Choicebox — a list of full-width cards, one of which (or several, under
 * `multiple`) is the chosen answer. Each card carries a label, an optional
 * description and a circular indicator that fills in when the card is picked.
 *
 * Built directly on `@hanzo/gui`'s `ToggleGroup`, the same group primitive
 * `./toggle-group` wraps for the segmented control: the selection is driven
 * through `value`/`onValueChange` exactly as that file drives it, so rove
 * focus, keyboard selection and the group's own click handling all come from
 * gui rather than being reimplemented here. The frame names the roles a
 * choice group needs and `ToggleGroup` leaves to the caller —
 * `radiogroup`/`radio` for a single answer, `group` with `role="checkbox"` per
 * card for several. A single answer never clears itself
 * (`disableDeactivation`), because an exclusive choice that can go empty is a
 * different control.
 */
import {
  ToggleGroup as GuiToggleGroup,
  SizableText,
  YStack,
  useControllableState,
} from '@hanzo/gui'
import { Check } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'
import { ink } from './ink'
import { slot } from './slot'

export type ChoiceboxOption = {
  value: string
  label: ReactNode
  description?: ReactNode
}

const DOT = 20

export type ChoiceboxProps = Omit<
  ComponentProps<typeof GuiToggleGroup>,
  'type' | 'value' | 'defaultValue' | 'onValueChange' | 'onChange' | 'children'
> & {
  options: ChoiceboxOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  multiple?: boolean
}

/** `"a,b"` <-> `["a", "b"]` — the wire shape stays the single joined string the
 *  original API returned; only the group's own bookkeeping is an array. */
const toList = (value: string | undefined) => (value ? value.split(',').filter(Boolean) : [])

function Choicebox({
  options,
  value,
  defaultValue,
  onChange,
  multiple = false,
  ...props
}: ChoiceboxProps) {
  const [selected, setSelected] = useControllableState<string[]>({
    prop: value !== undefined ? toList(value) : undefined,
    defaultProp: toList(defaultValue),
    onChange: (next) => onChange?.(next.join(',')),
  })
  const picked = selected ?? []

  return (
    <GuiToggleGroup
      {...slot('choicebox')}
      // One cast, for the same reason `./toggle-group` casts it: `type`
      // narrows gui's `value`/`onValueChange` union, and this function's own
      // parameters cannot re-narrow it once destructured.
      {...({
        type: multiple ? 'multiple' : 'single',
        value: multiple ? picked : (picked[0] ?? ''),
        onValueChange: multiple
          ? (next: string[]) => setSelected(next)
          : (next: string) => setSelected(next ? [next] : []),
        disableDeactivation: !multiple,
      } as ComponentProps<typeof GuiToggleGroup>)}
      role={multiple ? 'group' : 'radiogroup'}
      orientation="vertical"
      flexDirection="column"
      gap="$2"
      {...(props as object)}
    >
      {options.map((option) => {
        const on = picked.includes(option.value)
        return (
          <GuiToggleGroup.Item
            key={option.value}
            {...slot('choicebox-item')}
            value={option.value}
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={on}
            data-state={on ? 'checked' : 'unchecked'}
            unstyled
            flexDirection="row"
            items="flex-start"
            gap="$3"
            width="100%"
            rounded="$4"
            borderWidth={2}
            borderColor={on ? '$ink' : '$borderColor'}
            backgroundColor={on ? '$raised' : 'transparent'}
            px="$4"
            py="$3.5"
            cursor="pointer"
            hoverStyle={{ backgroundColor: on ? '$raised' : '$hover' }}
          >
            <YStack
              {...slot('choicebox-indicator')}
              width={DOT}
              height={DOT}
              shrink={0}
              mt={2}
              rounded={1000}
              borderWidth={2}
              borderColor={on ? '$ink' : '$bound'}
              bg={on ? '$ink' : 'transparent'}
              items="center"
              justify="center"
            >
              {on && <Check size={DOT - 8} color="white" />}
            </YStack>
            <YStack flex={1} gap="$1">
              {ink(option.label, SizableText, { size: '$3', fontWeight: '600' })}
              {option.description
                ? ink(option.description, SizableText, { size: '$2', color: '$quiet' })
                : null}
            </YStack>
          </GuiToggleGroup.Item>
        )
      })}
    </GuiToggleGroup>
  )
}

export { Choicebox }
