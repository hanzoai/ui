/**
 * The two decisions a composer makes, as pure functions.
 *
 * Every Hanzo chat surface had re-implemented both inline, and they had drifted:
 * one sent on a bare Enter while composing an IME candidate (committing a
 * half-typed word), another let a whitespace-only draft through. Keeping them
 * here means the rules are asserted once, without a DOM.
 */

/** Modifier state, in the shape web and native events agree on. */
export interface Mods {
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
  /** True while an IME candidate window is open. */
  isComposing?: boolean
}

/**
 * Enter sends. Shift+Enter — and any other modifier — writes a newline instead,
 * so a multi-line draft is always reachable from the keyboard. A key pressed
 * while an IME is composing belongs to the IME, never to the composer.
 */
export const sends = (key: string, mods: Mods = {}): boolean =>
  key === 'Enter' &&
  !mods.isComposing &&
  !mods.shiftKey &&
  !mods.altKey &&
  !mods.metaKey &&
  !mods.ctrlKey

/**
 * Whether a draft may be sent: there has to be something other than whitespace,
 * the surface must not already be waiting on a turn, and the field must be live.
 */
export const ready = (value: string, busy = false, disabled = false): boolean =>
  !busy && !disabled && value.trim().length > 0
