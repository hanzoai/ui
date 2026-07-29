/**
 * Stay-at-the-bottom, as a pure decision.
 *
 * A thread should follow a streaming answer, but it must stop following the
 * moment the reader scrolls up to re-read something — otherwise every new token
 * yanks them back down. The rule is a distance test against the bottom, and it
 * is the piece each surface had written slightly differently.
 */

/** How far from the bottom still counts as "at the bottom", in px. */
export const SLACK = 48

export interface Track {
  /** Scroll offset from the top. */
  offset: number
  /** Height of the visible viewport. */
  viewport: number
  /** Height of the full content. */
  content: number
}

/**
 * True while the viewport is within `slack` of the end — including the case
 * where the content is shorter than the viewport and there is nothing to scroll.
 */
export const pinned = ({ offset, viewport, content }: Track, slack = SLACK): boolean =>
  content - viewport - offset <= slack
