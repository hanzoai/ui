'use client'

/** Switch — 36×20 track, 16px thumb, `touch()` to the 44px floor everywhere. */
import { Switch as GuiSwitch } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'

const TRACK_H = 20
const THUMB = 16

export type SwitchProps = ComponentProps<typeof GuiSwitch>

const Switch = (props: SwitchProps) => (
  <GuiSwitch
    {...slot('switch')}
    width={36}
    height={TRACK_H}
    p={2}
    shrink={0}
    {...touch(TRACK_H, 44, 'y')}
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
