/**
 * Class notation as an inline style — for a component that is neither ours nor
 * an element.
 *
 * There are three kinds of thing you can put class notation on, and each needs
 * its own answer:
 *
 *   <Box className="grid gap-4">          an element        — Box converts
 *   <Card {...sx('grid gap-4')}>          a gui component   — sx converts
 *   <Link style={css('gap-2')}>           someone else's    — this
 *
 * The third is `next/link`, `next/image`, a lucide icon: components that accept
 * a `style` and hand every other prop straight to the element. `sx` is wrong for
 * them — its output is gui's prop vocabulary, and a component that does not
 * speak it forwards `fontSize` to the DOM as an attribute. `className` is wrong
 * too: it arrives intact and means nothing, which is the defect this replaces.
 *
 * `tw` already speaks CSS — `h-4 w-4 ml-2` is `{height:16,width:16,marginLeft:8}`
 * — so this is that, with the one part an inline style cannot hold removed.
 *
 * A CONDITION DOES NOT SURVIVE. `md:grid-cols-2` is a media query and
 * `hover:bg-black` is a pseudo-class; a `style` attribute holds neither. `tw`
 * returns both as a nested group — `$md`, `hoverStyle`, `groupHoverStyle` — so
 * the rule is simply that an inline style is FLAT: a value that is itself a
 * group is dropped, never flattened. Flattening would paint the large-screen
 * rule on a phone and the hover state at rest, and silently wrong is worse than
 * visibly absent. Anything conditional belongs on a `Box`.
 */
import type { CSSProperties } from 'react'

import { cn } from './core/cn'
import { type ClassValue, tw } from './tw'

const group = (v: unknown) => typeof v === 'object' && v !== null

export const css = (...classes: ClassValue[]): CSSProperties => {
  const { props } = tw(cn(...classes))
  const out: Record<string, unknown> = {}
  for (const key in props) if (!group(props[key])) out[key] = props[key]
  return out as CSSProperties
}

export default css
