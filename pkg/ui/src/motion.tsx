'use client'

/**
 * The two marks a host stamps by hand: a live dot that breathes and a typing
 * caret that blinks. Each is a gui View carrying `data-motion`, so its paint is
 * props and only the keyframe is in `styles/motion.css`.
 *
 *   <Pulse width={8} height={8} rounded={9999} bg="var(--primary)" />
 *   <Caret width={2} height="1em" />
 */
import { View } from '@hanzo/gui'
import type { ComponentProps } from 'react'

export type PulseProps = ComponentProps<typeof View>

/** Dims to half and back every two seconds. Opacity only: nothing reflows for a dot nobody is reading. */
export const Pulse = (props: PulseProps) => <View data-motion="pulse" {...props} />

export type CaretProps = ComponentProps<typeof View>

/** On, off, once a second, in the foreground ink unless told otherwise. */
export const Caret = (props: CaretProps) => (
  <View data-motion="blink" width={1} height={'1em' as never} bg="var(--foreground)" {...props} />
)
