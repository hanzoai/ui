'use client'

/**
 * Box — an element that reads utility classes as gui style props.
 *
 * It exists to make the migration off a utility engine a rename rather than a
 * rewrite: `<div className="flex items-center gap-4">` becomes `<Box …>` with
 * the same classes, and the classes now mean what they meant through gui
 * instead of through a stylesheet the engine generated.
 *
 * What `tw` does not recognise stays a class name on the element, so a page
 * part-way through the move renders the same either way — the converted classes
 * come from gui, the rest from whatever still serves them.
 *
 * A `<div>` is `display: block`; a gui Stack is flex-column. Those disagree, so
 * Box states the div's default and lets a class override it — a `flex` class
 * says flex, and silence says block. Taking the Stack's default instead turned
 * 77 of 225 elements on one page into flex containers that were never asked to
 * be: an inline run became a column, a heading's width collapsed to its text,
 * and a page grew 8% taller.
 */
import { forwardRef, type ReactNode } from 'react'
import { YStack } from '@hanzo/gui'
import { tw, type ClassValue } from './tw'

/** Properties a frame ignores and a DOM element passes to its children. */
const TEXT_PROPS = ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing',
  'textTransform', 'fontFamily', 'fontStyle', 'textAlign', 'color',
  'textDecorationLine', 'whiteSpace'] as const

export type BoxProps = Omit<React.ComponentProps<typeof YStack>, 'aria-hidden'> & {
  className?: ClassValue
  children?: ReactNode
  /**
   * ARIA states are strings in markup and gui types this one as a boolean, so
   * both spellings are taken and normalised. Rejecting `"true"` would make a
   * correct attribute a type error.
   */
  'aria-hidden'?: boolean | 'true' | 'false'
}

export const Box = forwardRef<any, BoxProps>(function Box(
  { className, children, 'aria-hidden': hidden, ...rest },
  ref,
) {
  const { props, rest: unread } = tw(className)
  // gui drops a text property set on a frame — `fontSize` is not a frame style
  // prop, so it silently rendered at the inherited size and a page carrying
  // `text-xs` on a box came out three pixels larger everywhere. A div DOES pass
  // these to its children, so they ride as a plain style, which is what the
  // browser inherits from.
  const text: Record<string, unknown> = {}
  for (const k of TEXT_PROPS) if (k in props) { text[k] = props[k]; delete props[k] }
  // A div's line-height comes from the cascade; gui's Stack stamps its own, so
  // a converted box grew a few pixels per line of text. Stated only when no
  // class said otherwise, so `leading-relaxed` still wins.
  if (!('lineHeight' in text)) text.lineHeight = 'inherit'
  // Explicit props win: a caller who states a value directly means it, and the
  // classes are what they are migrating away from.
  return (
    <YStack
      ref={ref}
      display="block"
      // A View does not shrink; a div does. Left at the View's default, every
      // converted flex child held its full basis and overflowed its row instead
      // of sharing it — two half-width columns came out 608px each in a 1216px
      // row with a 32px gap, where the divs they replaced sat at 592.
      // `shrink`, not `flexShrink`: gui types the shorthand and compiles both to
      // the same `_shrink-1`, and the DOM spelling is the one it does not carry.
      shrink={1}
      aria-hidden={hidden === undefined ? undefined : hidden !== 'false' && hidden !== false}
      {...(props as object)}
      {...rest}
      className={unread || undefined}
      style={Object.keys(text).length ? { ...text, ...(rest as any).style } : (rest as any).style}
    >
      {children}
    </YStack>
  )
})

export default Box
