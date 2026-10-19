'use client'

/**
 * ChoiceCard — one option among a few, drawn as a card.
 *
 * A `role="radio"` with `aria-checked`, Enter and Space to pick, and a heavier
 * edge when picked, so the state is a shape and a name, not a colour. Put a few
 * inside a `ChoiceGroup` (`role="radiogroup"`, named). Where picking one should
 * simply go on to the next screen, use `<Card interactive>` instead: that is a
 * button, this is a setting.
 *
 * `indicator` puts a radio in the card's top-end corner, 8px in — twenty-ui's
 * radio card (MIT, NOTICE) — so the choice reads as a radio and not only as an
 * edge. Under `<Density value="compact">` the card takes that card's measure:
 * 8px radius, 16 by 12 padding, the panel ground and the hover rung.
 */
import { XStack, YStack, styled } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'
import { slot } from './slot'
import { useDensity } from './density'

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
    // After `selected`, so its ground and padding hold whatever the state.
    compact: {
      true: { rounded: '$3', py: '$4', px: '$3', bg: '$panel', hoverStyle: { bg: '$hover', borderColor: '$dim' } },
    },
  } as const,
})

/** The record radio drawn in the corner: a quiet ring, or the accent round its dot. */
function CornerMark({ selected }: { selected: boolean }) {
  return (
    <XStack
      {...slot('choice-mark')}
      position="absolute"
      t={8}
      r={8}
      width={16}
      height={16}
      rounded={9999}
      borderWidth={1}
      borderColor={selected ? 'var(--primary)' : '$aside'}
      bg={selected ? 'var(--primary)' : 'transparent'}
      items="center"
      justify="center"
      pointerEvents="none"
      aria-hidden
    >
      {selected ? <XStack width={6} height={6} rounded={9999} bg="var(--primary-foreground)" /> : null}
    </XStack>
  )
}

export type ChoiceCardProps = Omit<ComponentProps<typeof Frame>, 'children' | 'onPress' | 'compact'> & {
  selected: boolean
  onSelect: () => void
  /** A radio in the top-end corner, so the card reads as one option of a set. */
  indicator?: boolean
  children?: ReactNode
}

export function ChoiceCard({ selected, onSelect, indicator = false, children, ...props }: ChoiceCardProps) {
  const compact = useDensity() === 'compact'
  return (
    <Frame
      {...slot('choice')}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      selected={selected}
      {...(compact ? { compact: true } : null)}
      {...(indicator ? { position: 'relative', pr: 32 } : null)}
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
      {indicator ? <CornerMark selected={selected} /> : null}
    </Frame>
  )
}

export function RadioCircle({ selected }: { selected: boolean }) {
  return (
    <XStack
      {...slot('choice-indicator')}
      width={18}
      height={18}
      rounded={9999}
      borderWidth={2}
      borderColor={selected ? '$ink' : '$bound'}
      bg={selected ? '$ink' : 'transparent'}
      items="center"
      justify="center"
      shrink={0}
      pointerEvents="none"
    >
      {selected ? <XStack width={6} height={6} rounded={9999} bg="$background" /> : null}
    </XStack>
  )
}

export type ChoiceGroupProps = ComponentProps<typeof XStack> & { label: string }

export function ChoiceGroup({ label, ...props }: ChoiceGroupProps) {
  return <XStack {...slot('choice-group')} role="radiogroup" aria-label={label} gap="$4" width="100%" {...props} />
}
