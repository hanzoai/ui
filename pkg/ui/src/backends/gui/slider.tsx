'use client'

/** Slider — 6px track, 16px thumb, `hitSlop` to the 44px touch floor. */
import { Slider as GuiSlider } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

const TRACK = 6
const THUMB = 16
const HIT_SLOP = (44 - THUMB) / 2

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
      bg="$background"
      borderWidth={1}
      borderColor="$color12"
      hitSlop={HIT_SLOP}
    />
  </GuiSlider>
)

export { Slider }
