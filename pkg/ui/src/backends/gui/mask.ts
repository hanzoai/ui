/**
 * Masking, on both platforms.
 *
 * `secureTextEntry` is React Native's spelling and gui DROPS it on web — an
 * input carrying only that prop renders the secret in plain text, which is the
 * exact opposite of what the caller asked for. `type="password"` is the web
 * spelling and gui forwards it, being an unrecognised prop. Native ignores
 * `type` for the same reason. So masking needs BOTH names, and neither alone is
 * safe. `readOnly` is the same story: `editable={false}` is dropped on web.
 *
 * A prop object is a value, so this needs no DOM: `@hanzo/ui/product/pure`
 * exports it, and a consumer can assert that its own field really masks without
 * mounting one.
 */

/** The props that mask (or unmask) a field on web AND native. */
export const masked = (on: boolean) =>
  (on ? { secureTextEntry: true, type: 'password' } : { secureTextEntry: false, type: 'text' }) as object
