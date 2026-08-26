import { cn } from '../core/cn'
import { type ClassValue, tw } from '../tw'
import type { Dimensions } from '../types'
import type { Block } from './def'

/**
 * Class notation as gui style props.
 *
 * A gui component takes `className` and passes it STRAIGHT to the element, so
 * `<Card className="flex w-full">` renders `class="… flex w-full"` — four dead
 * tokens against a stylesheet that defines none of them, since there is no
 * Tailwind here to define them. Measured: every token survives to the DOM and
 * nothing styles it.
 *
 * `<Box>` already solves this for host elements by converting the string first.
 * This is the same conversion for the case Box cannot cover — a gui component
 * that must stay itself. The classes become style props, gui compiles them to
 * its own atomic rules, and no unqualified name reaches the document.
 *
 * So: `<Box className="…">` for an element, `{...sx('…')}` for a component.
 *
 * Anything `tw` does not read is handed back as `className`, exactly as Box
 * does with it — dropping it would be worse than leaking it, because a class
 * with a real rule behind it (`hz-prose`) is not something `tw` should be
 * expected to know about, and silently discarding it would unstyle the element
 * with nothing to show for it.
 */
export const sx = (...classes: ClassValue[]): Record<string, unknown> => {
  const { props, rest } = tw(cn(...classes))
  return rest ? { ...props, className: rest } : (props as Record<string, unknown>)
}

/**
 * What every renderer is handed: the block to draw, plus the two things only
 * the page above it knows.
 *
 * `agent` is the device class ('phone' | 'desktop'). It is a PROP rather than a
 * media query because these blocks render on a server that has to emit the
 * right markup first time — a phone layout that arrives as desktop markup and
 * corrects itself on hydration is a visible jump, and for the video blocks it
 * is a wasted download rather than a reflow.
 */
export interface BlockComponentProps {
  block: Block
  className?: string
  agent?: string
}

/**
 * Is `token` one of the hints in a specifier bag?
 *
 * A bag is space-separated and open — a site adds a hint by typing one, and an
 * unknown hint is ignored rather than failing a build. Undefined reads as
 * empty, so a block with no specifiers answers false rather than throwing.
 */
export const has = (specifiers: string | undefined, token: string): boolean =>
  !!specifiers && specifiers.split(/\s+/).includes(token)

/**
 * The largest box with `dim`'s aspect ratio that fits inside `within`.
 *
 * Which side binds is decided by comparing the two ratios, not by trying one
 * and clamping: a portrait image in a landscape box is bound by height, and the
 * reverse by width.
 */
export const fit = (dim: Dimensions, within: Dimensions): Dimensions => {
  const ratio = dim.w / dim.h
  return ratio > within.w / within.h
    ? { w: within.w, h: within.w / ratio }
    : { w: within.h * ratio, h: within.h }
}

/** The filename an image url ends in — the last-resort alt text. */
export const name = (src: string): string => src.split('/').filter(Boolean).pop() ?? src
