/**
 * The composer's material, as values.
 *
 * The stylesheet is the implementation; these are the names a caller may hold —
 * the class it puts on the host, and the properties it may set to retune one.
 * Every knob is a custom property with the published value as its fallback, so
 * setting none is the same as setting all of them to what they already are, and
 * a person's appearance preference reaches them by the same route it reaches
 * every other ramp: one property on `:root`.
 */

/** The host. Wraps the surface's own panel; owns the ring, halo and controls. */
export const COMPOSER = 'hz-composer'

/** A circular control inside it — the plus, the mic, the send. */
export const ROUND = 'hz-round'

/**
 * Every property the stylesheet reads and a caller may set.
 *
 * Exported as a list because enumerating what is tunable is a question with one
 * answer, and a settings panel that hand-typed its own copy would answer it
 * twice. `--density` and `--text-base` are NOT here: they belong to
 * @hanzo/design and the composer only obeys them.
 */
export const KNOBS = [
  '--hz-spectrum',
  '--hz-composer-radius',
  '--hz-composer-band',
  '--hz-composer-halo',
  '--hz-composer-blur',
  '--hz-composer-rest',
  '--hz-composer-lift',
  '--hz-composer-glow',
  '--hz-composer-glow-lift',
  '--hz-composer-spin',
  '--hz-composer-control',
  '--hz-composer-edge',
] as const

export type Knob = (typeof KNOBS)[number]
