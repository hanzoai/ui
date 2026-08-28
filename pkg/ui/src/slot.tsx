/**
 * `Slot` — render your props onto the child you were given.
 *
 *   <Slot className="btn" onClick={f}><a href="/x">go</a></Slot>
 *   -> <a href="/x" class="btn" onclick={f}>go</a>
 *
 * The mechanism behind `asChild`: a component that wants to BE its child rather
 * than wrap it. A wrapper is the wrong answer whenever the child carries the
 * semantics — an anchor inside a button is invalid markup, and a second element
 * around a list item breaks the list.
 *
 * `Button` does not use this: its gui Frame bakes `render: <button>`, and gui's
 * own `render` prop is what merges there, carrying the compiled style props onto
 * the child's tag. This is for a plain React component with no Frame under it,
 * which is most of them.
 *
 * Merging rules, in the order a caller expects:
 *
 *   className   both, slot first, so the child's own class wins the cascade
 *   style       both, child last, for the same reason
 *   handlers    both run, slot first — neither side silently loses its listener
 *   ref         both, because either side may need the node
 *   everything else  the CHILD wins; it is the more specific statement
 */
import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'

import { cn } from './core/cn'

export type SlotProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
  ref?: Ref<unknown>
  [key: string]: unknown
}

/** Call both, in order. Used for every `on*` the two sides both define. */
const both =
  (mine: unknown, theirs: unknown) =>
  (...args: unknown[]) => {
    ;(mine as ((...a: unknown[]) => void) | undefined)?.(...args)
    ;(theirs as ((...a: unknown[]) => void) | undefined)?.(...args)
  }

export function Slot({ children, ...mine }: SlotProps) {
  // Exactly one child, or there is nothing to be.
  //
  // `Children.only` THROWS on none, and none is a state a caller reaches without
  // being wrong: `asChild` on something whose child is still loading, or behind
  // a condition. Counting first turns that into a render of nothing instead of
  // an error boundary. More than one is a genuine mistake and still throws.
  const kids = Children.toArray(children)
  if (kids.length === 0) return null
  const child = Children.only(kids[0] as ReactElement)
  if (!isValidElement(child)) return child ?? null

  const theirs = child.props as Record<string, unknown>
  const merged: Record<string, unknown> = { ...mine, ...theirs }

  for (const key in mine) {
    const a = mine[key]
    const b = theirs[key]
    if (/^on[A-Z]/.test(key) && typeof a === 'function' && typeof b === 'function') {
      merged[key] = both(a, b)
    } else if (key === 'className') {
      merged[key] = cn(a as string, b as string)
    } else if (key === 'style') {
      merged[key] = { ...(a as object), ...(b as object) }
    } else if (key === 'ref' && a && b) {
      merged[key] = (node: unknown) => {
        for (const r of [a, b]) {
          if (typeof r === 'function') (r as (n: unknown) => void)(node)
          else if (r && typeof r === 'object') (r as { current: unknown }).current = node
        }
      }
    }
  }

  return cloneElement(child, merged)
}

export default Slot
