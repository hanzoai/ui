'use client'

/** Slider — 6px track, 16px thumb, `touch()` to the 44px floor on every target. */
import { Slider as GuiSlider } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'

const TRACK = 6
const THUMB = 16

/**
 * The name belongs where the ROLE is. gui puts `role="slider"` on the Thumb,
 * so a name spread onto the root lands on a plain container that no screen
 * reader announces — the control reads as an unlabelled slider. These are the
 * naming and description properties an ARIA slider must carry; everything else
 * (value, range, step, orientation, disabled) is the root's and stays there.
 */
const NAMES = ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-valuetext'] as const

type Name = (typeof NAMES)[number]

/** An ARIA naming property is a string by contract, so the split says so. */
type Names = Partial<Record<Name, string>>

/** Splits a caller's props into what the thumb must carry and what the root keeps. */
export const named = (props: Record<string, unknown>): { name: Names; rest: Record<string, unknown> } => {
  const name: Names = {}
  const rest: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(props)) {
    if ((NAMES as readonly string[]).includes(k)) name[k as Name] = v as string
    else rest[k] = v
  }
  return { name, rest }
}

export type SliderProps = ComponentProps<typeof GuiSlider>

const Slider = (props: SliderProps) => {
  const { name, rest } = named(props as Record<string, unknown>)
  return (
    <GuiSlider {...slot('slider')} width="100%" {...rest}>
      <GuiSlider.Track {...slot('slider-track')} height={TRACK} bg="$color4" rounded="$10">
        <GuiSlider.TrackActive {...slot('slider-range')} bg="$color12" />
      </GuiSlider.Track>
      <GuiSlider.Thumb
        {...slot('slider-thumb')}
        index={0}
        circular
        size={THUMB}
        // A FILLED knob, no ring. It used to be a dark knob ringed in `$color12`,
        // which is #fff on dark — the one border value the identity does not
        // allow. `$borderColor` is not the fix either: gui gives the thumb its own
        // `SliderThumb` sub-theme, where that token is white as well. A filled
        // knob needs no border, and `$color12` reads on both themes (white on
        // dark, near-black on light).
        bg="$color12"
        borderWidth={0}
        {...touch(THUMB)}
        {...name}
      />
    </GuiSlider>
  )
}

export { Slider }
