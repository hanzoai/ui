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
      bg="$background"
      borderWidth={1}
      borderColor="$color12"
      {...touch(THUMB)}
    />
  </GuiSlider>
)

export { Slider }
