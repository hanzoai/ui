'use client'

/**
 * Spinner — an arc in motion, sized in pixels and inked from the text around it.
 *
 * The motion is react-native-web's `ActivityIndicator`, which gui's Spinner
 * wraps: it draws a 0.2-alpha track under a dashed arc and injects its own
 * rotation keyframes at runtime. So this package ships no keyframe and no
 * utility class for it, and a consumer that mounts none of our stylesheets
 * still gets a spinner that spins.
 *
 * Two things the gui primitive types that a call site cannot use. `size` is
 * `'small' | 'large'` — an enum where every caller has a pixel box to fill, and
 * the DOM element underneath takes a number and applies it as width and height.
 * And `color` defaults to `#1976D2`, a blue belonging to no theme here; the arc
 * is an SVG `stroke`, so `currentColor` inherits the ink of whatever it sits in
 * — a button's label, a panel's text — with no per-call plumbing.
 *
 * `aria-hidden`, because a spinner is never the message: the thing that is
 * loading says so in text beside it.
 *
 * `variant="dot"` is the record kit's loader (twenty-ui's Loader, MIT — NOTICE):
 * a 24×12 pill outline with an 8px dot that travels across it and squashes as
 * it lands, 0.8s a loop (`data-motion="hop"` in styles/motion.css, stopped under
 * reduced motion). It is the quieter one, for a status pill, a button that is
 * busy or a list fetching more; the arc stays the default everywhere else. Both
 * take the surrounding ink unless given a colour.
 */
import { Spinner as GuiSpinner, View, XStack } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

export type SpinnerProps = Omit<ComponentProps<typeof GuiSpinner>, 'size' | 'color'> & {
  /** Edge of the arc, px. The dot's pill is always 24×12. */
  size?: number
  /** Ink. Inherits the surrounding text by default. */
  color?: string
  /** `arc` (default) or the travelling `dot`. */
  variant?: 'arc' | 'dot'
}

const Spinner = ({ size = 16, color = 'currentColor', variant = 'arc', ...props }: SpinnerProps) =>
  variant === 'dot' ? (
    <XStack
      {...slot('spinner')}
      data-variant="dot"
      aria-hidden
      width={24}
      height={12}
      shrink={0}
      rounded="$10"
      borderWidth={1}
      borderColor={color as never}
      overflow="hidden"
      items="center"
      justify="center"
      {...(props as object)}
    >
      <View data-motion="hop" width={8} height={8} rounded="$10" bg={color as never} />
    </XStack>
  ) : (
  <GuiSpinner
    {...slot('spinner')}
    aria-hidden
    // The enum is upstream's TYPE; a number is what the element reads.
    size={size as unknown as 'small'}
    color={color}
    {...props}
  />
  )

export { Spinner }
