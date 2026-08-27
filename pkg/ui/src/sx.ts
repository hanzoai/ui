/**
 * Class notation as gui style props — the counterpart to `<Box>`.
 *
 * A gui component takes `className` and hands it STRAIGHT to the element it
 * renders, so `<Card className="grid gap-4">` emits `class="… grid gap-4"`:
 * two tokens against a stylesheet that defines neither, because there is no
 * Tailwind here to define them. Measured — every token survives to the DOM and
 * nothing styles it.
 *
 * `<Box>` solves this for a host element by converting the string before it
 * renders. This is the same conversion for the case Box cannot cover: a
 * component that has to stay itself.
 *
 *   <Box className="grid gap-4">…</Box>        an element
 *   <Card {...sx('grid gap-4')}>…</Card>       a component
 *
 * Anything `tw` does not read comes back as `className`, exactly as Box hands
 * it back. Dropping it would be worse than leaking it: a class with a real rule
 * behind it — `hz-prose`, or one of the app's own — is not something `tw` should
 * be expected to know, and discarding it would unstyle the element with nothing
 * to show for it.
 */
import { cn } from './core/cn'
import { type ClassValue, tw } from './tw'

export const sx = (...classes: ClassValue[]): Record<string, unknown> => {
  const { props, rest } = tw(cn(...classes))
  return rest ? { ...props, className: rest } : (props as Record<string, unknown>)
}
