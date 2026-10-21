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
import type { ComponentProps, ReactNode } from 'react'

export type PulseProps = ComponentProps<typeof View>

/** Dims to half and back every two seconds. Opacity only: nothing reflows for a dot nobody is reading. */
export const Pulse = (props: PulseProps) => <View data-motion="pulse" {...props} />

export type CaretProps = ComponentProps<typeof View>

/** On, off, once a second, in the foreground ink unless told otherwise. */
export const Caret = (props: CaretProps) => (
  <View data-motion="blink" width={1} height={'1em' as never} bg="var(--foreground)" {...props} />
)

export type CrossfadeProps = Omit<ComponentProps<typeof View>, 'children'> & {
  /** Shown while `isActive`. */
  activeIcon: ReactNode
  /** Shown otherwise. */
  inactiveIcon: ReactNode
  isActive: boolean
}

/**
 * Two icons in one 14px place, swapped by a scale-and-fade: the pencil that
 * becomes an X, the heart that fills. The hidden one sits at 0 opacity and 85%
 * scale; both move over the fast duration. Reduced motion stops the move, not
 * the swap, by design's own rule. (the source kit's AnimatedIconCrossfade, MIT, see
 * NOTICE.)
 */
export const Crossfade = ({ activeIcon, inactiveIcon, isActive, ...props }: CrossfadeProps) => {
  const layer = (shown: boolean) =>
    ({
      position: 'absolute',
      t: 0,
      l: 0,
      r: 0,
      b: 0,
      items: 'center',
      justify: 'center',
      opacity: shown ? 1 : 0,
      scale: shown ? 1 : 0.85,
      'aria-hidden': !shown,
      style: { transition: 'opacity var(--duration-fast, 150ms) ease-in-out, transform var(--duration-fast, 150ms) ease-in-out' },
    }) as const
  return (
    <View data-slot="crossfade" data-active={isActive ? '' : undefined} position="relative" width={14} height={14} shrink={0} {...props}>
      <View {...layer(isActive)}>{activeIcon}</View>
      <View {...layer(!isActive)}>{inactiveIcon}</View>
    </View>
  )
}
