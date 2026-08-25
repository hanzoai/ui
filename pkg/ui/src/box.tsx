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
 *
 * `tag` renders the element Box is standing in for, and it is what makes the
 * migration reach past `<div>`. Divs are about a third of what carries a
 * className in these apps; the rest are `p`, `span`, `li`, `h2`, `section`, `a`.
 * Converting those to a div-only Box would read as a rename and would in fact
 * strip the document of its headings, lists and paragraphs — every one of them a
 * thing a screen reader navigates by.
 *
 * It goes through `asChild` because gui does NOT honour a `tag` prop: asked for
 * one it renders its own element anyway AND passes `tag` through to the DOM,
 * where it is an invalid attribute. `asChild` is the supported way to say "style
 * this element instead of yours", so the semantics come from the element and the
 * styling still comes from gui — one substrate, not a second styling path for
 * everything that is not a div.
 */
import { createElement, forwardRef, type ReactNode } from 'react'
import { YStack } from '@hanzo/gui'
import { tw, type ClassValue } from './tw'

/** Properties a frame ignores and a DOM element passes to its children. */
const TEXT_PROPS = ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing',
  'textTransform', 'fontFamily', 'fontStyle', 'textAlign', 'color',
  'textDecorationLine', 'whiteSpace',
  // `tabular-nums` is the one class on a checkout that MUST survive: it is what
  // makes a column of figures line up. tw converts it to fontVariantNumeric,
  // which a frame drops like the rest of these, and the loss shows as a money
  // column going ragged — a 25px total measuring 27px, which no test asserting
  // on text would notice.
  'fontVariantNumeric'] as const

export type BoxProps = Omit<React.ComponentProps<typeof YStack>, 'aria-hidden'> & {
  className?: ClassValue
  children?: ReactNode
  /**
   * The element to render. Omitted, Box is the `<div>` it has always been.
   */
  tag?: keyof React.JSX.IntrinsicElements
  /**
   * ARIA states are strings in markup and gui types this one as a boolean, so
   * both spellings are taken and normalised. Rejecting `"true"` would make a
   * correct attribute a type error.
   */
  'aria-hidden'?: boolean | 'true' | 'false'
}

export const Box = forwardRef<any, BoxProps>(function Box(
  { className, children, 'aria-hidden': hidden, tag, ...rest },
  ref,
) {
  const { props, rest: unread } = tw(className)
  // A View pins `min-height: 0`; a div's is `auto`, and auto is what gives a
  // flex or grid child its automatic minimum size. Pinned, a converted child of
  // a row of indefinite height measured 0px and its content vanished.
  if (!('minHeight' in props)) props.minHeight = 'auto'
  // The same fact on the other axis. A View pins `min-width: 0`, a div's is
  // auto, and auto is what stops a flex child shrinking below its content.
  if (!('minWidth' in props)) props.minWidth = 'auto'
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
  const style = Object.keys(text).length
    ? { ...text, ...(rest as any).style }
    : (rest as any).style
  // Explicit props win: a caller who states a value directly means it, and the
  // classes are what they are migrating away from.
  const frame = (
    <YStack
      ref={tag ? undefined : ref}
      asChild={tag ? true : undefined}
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
      className={tag ? undefined : unread || undefined}
      style={tag ? undefined : style}
    >
      {/* Under `asChild` gui styles THIS element and renders no frame of its own,
          so the class it could not read and the text styles a frame would drop
          both belong here — on the element that survives. */}
      {tag
        ? createElement(tag, { ref, className: unread || undefined, style }, children)
        : children}
    </YStack>
  )

  return frame
})

export default Box
