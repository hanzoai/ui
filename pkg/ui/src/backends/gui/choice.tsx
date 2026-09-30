'use client'

/**
 * Choice — one option among a few, drawn as a card.
 *
 * A `role="radio"` with `aria-checked`, Enter and Space to pick, and a heavier
 * edge when picked, so the state is a shape and a name, not a colour. Put a few
 * inside a `ChoiceGroup` (`role="radiogroup"`, named). Where picking one should
 * simply go on to the next screen, use `<Card interactive>` instead: that is a
 * button, this is a setting.
 */
import { XStack, YStack, styled } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'
import { slot } from './slot'

const Frame = styled(YStack, {
  name: 'Choice',
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$5',
  p: '$4',
  gap: '$1',
  cursor: 'pointer',
  hoverStyle: { borderColor: '$dim' },
  focusVisibleStyle: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' },
  variants: {
    selected: {
      true: { borderColor: '$ink', bg: '$panel' },
    },
  } as const,
})

export type ChoiceProps = Omit<ComponentProps<typeof Frame>, 'children' | 'onPress'> & {
  selected: boolean
  onSelect: () => void
  children?: ReactNode
}

export function Choice({ selected, onSelect, children, ...props }: ChoiceProps) {
  return (
    <Frame
      {...slot('choice')}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      selected={selected}
      onPress={onSelect}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onKeyDown={(e: any) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      {...props}
    >
      {children}
    </Frame>
  )
}

export type ChoiceGroupProps = ComponentProps<typeof XStack> & { label: string }

export function ChoiceGroup({ label, ...props }: ChoiceGroupProps) {
  return <XStack {...slot('choice-group')} role="radiogroup" aria-label={label} gap="$4" width="100%" {...props} />
}
