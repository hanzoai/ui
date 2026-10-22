'use client'

/**
 * Kbd — a keyboard key rendered as text, for documenting a shortcut inline
 * with a sentence, inside a `Button`, or inside a `Tooltip`.
 *
 * `KbdGroup` sets several keys side by side (`Ctrl` `B`) with a small gap and
 * no separator glyph — the spacing alone reads as a chord.
 *
 * `variant="cap"` is a keycap that stands on its own lower edge: 18px tall, a
 * 1px strong edge on the panel ground, 4px radius and the keycap underline —
 * the key `Shortcut` draws in a command menu or a help sheet (the record kit's
 * Shortcut keys, MIT, see NOTICE). The default stays the flat chip.
 */
import { SizableText, XStack, styled } from '@hanzo/gui'
import * as React from 'react'
import { ink } from './ink'
import { ltr } from './dir'

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

/** The keycap: what `variant="cap"` puts in place of the flat chip. */
const CAP = {
  height: 18,
  minW: 16,
  px: '$0.5',
  bg: '$panel',
  borderWidth: 1,
  borderColor: '$rim',
  rounded: '$xs',
  style: { userSelect: 'none', boxShadow: 'var(--shadow-underline, 0 1px 0 0 var(--border-strong))' },
} as const

export type KbdProps = React.ComponentProps<'kbd'> & {
  /** `cap` is a keycap with an edge and an underline; the default is the flat chip. */
  variant?: 'default' | 'cap'
}

/** One keyboard key, e.g. `<Kbd>Ctrl</Kbd>`. */
export function Kbd({ children, variant = 'default', ...props }: KbdProps) {
  return (
    <KbdFrame
      data-slot="kbd"
      {...ltr}
      {...(variant === 'cap' ? { 'data-variant': 'cap', ...CAP } : null)}
      {...(props as React.ComponentProps<typeof KbdFrame>)}
    >
      {/* A keycap's legend is the secondary rank (the source kit's keys), the flat
          chip's stays the ramp's quiet rung it always was. */}
      {ink(children, KbdText, variant === 'cap' ? { color: '$aside' } : {})}
    </KbdFrame>
  )
}

export type KbdGroupProps = React.ComponentProps<'kbd'>

/** A chord: several `Kbd` keys laid out together, e.g. `Ctrl` + `B`. */
export function KbdGroup({ children, ...props }: KbdGroupProps) {
  return (
    <XStack
      data-slot="kbd-group"
      {...ltr}
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
