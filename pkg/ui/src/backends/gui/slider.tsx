
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
      <GuiSlider.Track {...slot('slider-track')} height={TRACK} bg="$edge" rounded="$10">
        {/* The FILL is not text. `$ink` is the foreground rung — a type
            colour — and spread across a full-width bar it reads as a lit slab
            rather than a value. Measured over the track (10% white on #0a0a0a,
            so rgb(34,34,34)): `$ink` is 12.63:1 where WCAG 1.4.11 asks 3:1
            for a non-text control. `$soft` is 6.93:1 — still more than double
            the requirement, and no longer the brightest thing on the page.
            The THUMB keeps the brighter rung: it is small and it is the grab
            target, so it should be the most legible part of the control. */}
        <GuiSlider.TrackActive {...slot('slider-range')} bg="$soft" />
      </GuiSlider.Track>
      <GuiSlider.Thumb
        {...slot('slider-thumb')}
        index={0}
        circular
        size={THUMB}
        // A FILLED knob, no ring. It used to be a dark knob ringed in `$ink`,
        // which is #fff on dark — the one border value the identity does not
        // allow. `$borderColor` is not the fix either: gui gives the thumb its own
        // `SliderThumb` sub-theme, where that token is white as well. A filled
        // knob needs no border, and `$ink` reads on both themes (white on
        // dark, near-black on light).
        bg="$ink"
        borderWidth={0}
        {...touch(THUMB)}
        {...name}
      />
    </GuiSlider>
  )
}

export { Slider }
