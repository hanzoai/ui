// What a turn said.
//
// A completion's content is a string OR a list of parts — text beside an image
// — so a component fed by the wire has to accept both, and everything that
// wants the words has to flatten the second case. Six surfaces wrote that
// flattener; this is the one.
//
// No imports, deliberately: a surface passing `body` to <Chat> needs it before
// it can hand a turn to a markdown parser, and a spec needs it with no gui.

/**
 * A part of a turn.
 *
 * Structural, and it names `@hanzo/ai` nowhere — this package is fetch-free and
 * depends on the SDK for nothing. Describing the shape here is what lets the
 * two compose exactly while neither imports the other. `type` is open because
 * the wire's is: today's set is text and images, and a part this does not know
 * simply carries no text.
 */
export interface Part {
  type: string
  text?: string
}

/** What a turn carries: a string, the wire's parts, or nothing yet. */
export type Said = string | Part[] | undefined

/**
 * The text of a turn, with the non-text parts left out.
 *
 * An image part contributes nothing rather than a placeholder: a caller that
 * wants to draw the attachment reads the parts itself, and one that wants the
 * prose wants the prose. Joined with no separator, because the wire splits a
 * sentence across parts and a space would land inside a word.
 */
export function words(said: Said): string {
  if (typeof said === 'string') return said
  if (!said) return ''
  return said.map((p) => p.text ?? '').join('')
}
