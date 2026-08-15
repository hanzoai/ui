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
  // Explicit props win: a caller who states a value directly means it, and the
  // classes are what they are migrating away from.
  return (
    <YStack
      ref={ref}
      display="block"
      aria-hidden={hidden === undefined ? undefined : hidden !== 'false' && hidden !== false}
      {...(props as object)}
      {...rest}
      className={unread || undefined}
    >
      {children}
    </YStack>
  )
})

export default Box
