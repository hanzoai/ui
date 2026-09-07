'use client'

/**
 * Android — the Android robot, drawn as an icon.
 *
 * Four sizes on the icon ladder (16, 24, 32 and 48px) and one ink. `color`
 * fills the body, arms and antennae and defaults to `currentColor`, so the
 * mark takes the text color around it. The eyes take the opposite pole — white
 * on inherited ink, black on a named color — so they stay visible against
 * either fill.
 *
 * The frame is a gui stack rendered as a <span>: an icon is phrasing content,
 * so it sits inside a button or a line of text where a <div> is not allowed
 * (a parser closes a <p> at a <div>, and the hydrated tree then disagrees
 * with the markup). It takes every stack prop — a hover style, a press
 * handler, a class string. The frame owns the size and the drawing fills it,
 * so a `width` set on the frame carries the drawing with it. The frame also
 * carries the name, as `role="img"` and an `aria-label`, so the drawing inside
 * is hidden from the reader and there is one label, not two; beside a label
 * that already names the platform, pass `aria-hidden` and let the words carry
 * it. The drawing is a plain <svg>, since gui has no vector primitive of its
 * own.
 */
import { XStack, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'

import { sx } from '../../sx'

export type AndroidSize = 'sm' | 'default' | 'lg' | 'xl'

/** Edge of the icon per size, px. */
const EDGE: Record<AndroidSize, number> = { sm: 16, default: 24, lg: 32, xl: 48 }

const Frame = styled(XStack, {
  name: 'Android',
  render: 'span',
  display: 'inline-flex',
  items: 'center',
  justify: 'center',
  shrink: 0,

  variants: {
    size: {
      sm: { width: EDGE.sm, height: EDGE.sm },
      default: { width: EDGE.default, height: EDGE.default },
      lg: { width: EDGE.lg, height: EDGE.lg },
      xl: { width: EDGE.xl, height: EDGE.xl },
    },
  } as const,

  defaultVariants: { size: 'default' },
})

export type AndroidProps = Omit<ComponentProps<typeof Frame>, 'size' | 'color'> & {
  size?: AndroidSize | null
  /** Fill of the body, arms and antennae. Inherits the surrounding text by default. */
  color?: string
  className?: string
}

export function Android({
  className,
  size = 'default',
  color = 'currentColor',
  ...props
}: AndroidProps) {
  const resolved = size ?? 'default'
  const eye = color === 'currentColor' ? '#ffffff' : '#000000'
  return (
    <Frame
      data-slot="android"
      data-size={resolved}
      role="img"
      aria-label="Android"
      size={resolved}
      {...sx(className)}
      {...(props as ComponentProps<typeof Frame>)}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10z"
          fill={color}
        />
        <path
          d="M15.5 6.5C15.5 5.12 14.38 4 13 4h-2c-1.38 0-2.5 1.12-2.5 2.5S9.62 9 11 9h2c1.38 0 2.5-1.12 2.5-2.5z"
          fill={color}
        />
        <path d="M7.5 2.5L9 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16.5 2.5L15 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M4 10.5c0-.83.67-1.5 1.5-1.5S7 9.67 7 10.5v3c0 .83-.67 1.5-1.5 1.5S4 14.33 4 13.5v-3z"
          fill={color}
        />
        <path
          d="M17 10.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-3z"
          fill={color}
        />
        <circle cx="10" cy="6.5" r="0.5" fill={eye} />
        <circle cx="14" cy="6.5" r="0.5" fill={eye} />
      </svg>
    </Frame>
  )
}
