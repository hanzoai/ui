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
 * A `<div>` is `display: block` and a Stack is flex, which agree for a column
 * of full-width children and disagree for inline content. Text belongs in a
 * Text, and this is for the boxes around it.
 */
import { forwardRef, type ReactNode } from 'react'
import { YStack } from '@hanzo/gui'
import { tw, type ClassValue } from './tw'

export type BoxProps = React.ComponentProps<typeof YStack> & {
  className?: ClassValue
  children?: ReactNode
}

export const Box = forwardRef<any, BoxProps>(function Box(
  { className, children, ...rest },
  ref,
) {
  const { props, rest: unread } = tw(className)
  // Explicit props win: a caller who states a value directly means it, and the
  // classes are what they are migrating away from.
  return (
    <YStack ref={ref} {...(props as object)} {...rest} className={unread || undefined}>
      {children}
    </YStack>
  )
})

export default Box
