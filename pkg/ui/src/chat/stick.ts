/**
 * Stay-at-the-bottom, as a pure decision.
 *
 * A thread follows a streaming answer and stops the moment the reader scrolls
 * up, or every new token yanks them back down. A distance test against the end.
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
