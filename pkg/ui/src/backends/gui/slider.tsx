'use client'

/** Slider — 6px track, 16px thumb, `touch()` to the 44px floor on every target. */
import { Slider as GuiSlider } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'

const TRACK = 6
const THUMB = 16

export type SliderProps = ComponentProps<typeof GuiSlider>

const Slider = (props: SliderProps) => (
  <GuiSlider {...slot('slider')} width="100%" {...props}>
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
    />
  </GuiSlider>
)

export { Slider }
