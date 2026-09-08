'use client'

/**
 * Kbd — a keyboard key rendered as text, for documenting a shortcut inline
 * with a sentence, inside a `Button`, or inside a `Tooltip`.
 *
 * `KbdGroup` sets several keys side by side (`Ctrl` `B`) with a small gap and
 * no separator glyph — the spacing alone reads as a chord.
 */
import { SizableText, XStack, styled } from '@hanzo/gui'
import * as React from 'react'
import { ink } from './ink'

const HEIGHT = 20

const KbdFrame = styled(XStack, {
  name: 'Kbd',
  render: 'kbd',
  display: 'inline-flex',
  pointerEvents: 'none',
  style: { userSelect: 'none' },
  items: 'center',
  justify: 'center',
  gap: '$1',
  height: HEIGHT,
  minW: HEIGHT,
  px: '$1',
  rounded: '$1',
  bg: '$hover',
})

const KbdText = styled(SizableText, {
  name: 'KbdText',
  size: '$1',
  fontWeight: '500',
  color: '$quiet',
})

export type KbdProps = React.ComponentProps<'kbd'>

/** One keyboard key, e.g. `<Kbd>Ctrl</Kbd>`. */
export function Kbd({ children, ...props }: KbdProps) {
  return (
    <KbdFrame data-slot="kbd" {...(props as React.ComponentProps<typeof KbdFrame>)}>
      {ink(children, KbdText)}
    </KbdFrame>
  )
}

export type KbdGroupProps = React.ComponentProps<'kbd'>

/** A chord: several `Kbd` keys laid out together, e.g. `Ctrl` + `B`. */
export function KbdGroup({ children, ...props }: KbdGroupProps) {
  return (
    <XStack
      data-slot="kbd-group"
      render="kbd"
      display="inline-flex"
      items="center"
      gap="$1"
      {...(props as React.ComponentProps<typeof XStack>)}
    >
      {children}
    </XStack>
  )
}
