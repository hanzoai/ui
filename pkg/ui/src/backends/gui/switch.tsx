'use client'

/** Switch — 36×20 track, 16px thumb, `hitSlop` to the 44px touch floor. */
import { Switch as GuiSwitch } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

const TRACK_H = 20
const THUMB = 16
const HIT_SLOP = (44 - TRACK_H) / 2

export type SwitchProps = ComponentProps<typeof GuiSwitch>

const Switch = (props: SwitchProps) => (
  <GuiSwitch
    {...slot('switch')}
    width={36}
    height={TRACK_H}
    p={2}
    shrink={0}
    hitSlop={HIT_SLOP}
    {...props}
  >
    <GuiSwitch.Thumb
      {...slot('switch-thumb')}
      width={THUMB}
      height={THUMB}
    />
  </GuiSwitch>
)

export { Switch }
