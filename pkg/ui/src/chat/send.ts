/**
 * The two decisions a composer makes, as pure functions — asserted once,
 * without a DOM.
 */

/** Modifier state, in the shape web and native events agree on. */
export interface Mods {
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
  /** `KeyboardEvent.isComposing` — true while an IME candidate window is open. */
  isComposing?: boolean
  /** Legacy `KeyboardEvent.keyCode`. Read only to recognise Safari's IME. */
  keyCode?: number
}

/** The keyCode every browser reports for a keystroke an IME has claimed. */
const IME = 229

/**
 * Whether the IME owns this keystroke, from all three signals browsers use.
 *
 * `isComposing` alone is not enough: Safari does not set it reliably on the
 * keydown that accepts a candidate, reporting `Process` or only the legacy
 * `keyCode` of 229.
 */
const claimed = (key: string, mods: Mods): boolean =>
  mods.isComposing === true || key === 'Process' || mods.keyCode === IME

/**
 * Enter sends. Shift+Enter writes a newline, so a multi-line draft is always
 * reachable from the keyboard. Cmd/Ctrl+Enter always sends — it is the force-send
 * every surface already taught its users, and it holds even with Shift down.
 * A keystroke the IME has claimed belongs to the IME, never to the composer.
 *
 * Hand it `e.nativeEvent`, never `e`: React's synthetic event carries neither
 * `isComposing` nor `keyCode`, so `e` type-checks and silently drops two of the
 * three IME signals.
 *
 *     onKeyDown={(e) => { if (sends(e.key, e.nativeEvent)) { … } }}
 */
export const sends = (key: string, mods: Mods = {}): boolean => {
  if (key !== 'Enter' || claimed(key, mods)) return false
  if (mods.metaKey === true || mods.ctrlKey === true) return true
  return mods.shiftKey !== true && mods.altKey !== true
}

/**
 * Whether a draft may be sent: there has to be something other than whitespace,
 * the surface must not already be waiting on a turn, and the field must be live.
 */
export const ready = (value: string, busy = false, disabled = false): boolean =>
  !busy && !disabled && value.trim().length > 0
