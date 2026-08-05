// The privacy gate, expressed in rrweb's vocabulary.
//
// There is exactly ONE redaction policy at Hanzo — @hanzo/observe's
// `RedactionPolicy`, with `isPrivate()` for subtree exclusion and
// `sensitiveKey()` for field identity. This module does not invent a second,
// weaker one; it TRANSLATES that policy onto rrweb's three hooks:
//
//   blockSelector     — the subtree never enters the recording at all
//   maskTextSelector  — the subtree's text is captured as asterisks
//   maskInputFn       — the per-field decision, taken on the live element
//
// The selector hooks are strings, so they can only carry the attribute
// conventions that are valid CSS. `maskInputFn` gets the ELEMENT, so it is where
// `isPrivate()` and `sensitiveKey()` actually run — a caller who sets a custom
// `policy.privateAttribute` is honored there whether or not the name happens to
// be selector-safe.
//
// rrweb calls `maskTextFn`/`maskInputFn` ONLY for nodes it has already decided to
// mask, so neither is a place to *widen* capture: `maskTextFn` always masks, and
// `maskInputFn` is reached for every input type because we opt every type into
// `maskInputOptions`.

import { redactSecrets } from '@hanzo/event'
import { isPrivate, sensitiveKey } from '@hanzo/observe'
import type { RedactionPolicy } from '@hanzo/observe'
import type { eventWithTime, recordOptions } from 'rrweb'

/** The private attribute @hanzo/observe's `isPrivate()` defaults to. */
const PRIVATE_DEFAULT = 'data-hz-private'

/** The two conventions `isPrivate()` honors in ADDITION to the configured
 *  attribute. Kept in the same order it walks them. */
const ALWAYS_PRIVATE = ['[data-observe="off"]', '[data-private]']

/** Input types whose value is never captured, whatever the masking mode says.
 *  Mirrors @hanzo/observe's SENSITIVE_TYPE. */
const SECURE_TYPES = new Set(['password', 'hidden', 'email', 'tel'])

/** Credential- and payment-shaped fields are BLOCKED, not masked: they never
 *  reach the serializer, so there is no value to get the masking decision wrong
 *  about. Autocomplete is the standard the browser itself uses to find them. */
export const CREDENTIAL_SELECTOR = [
  'input[type="password"]',
  'input[autocomplete="current-password"]',
  'input[autocomplete="new-password"]',
  'input[autocomplete="one-time-code"]',
  'input[autocomplete^="cc-"]',
].join(',')

/** A fixed-width mask. Sensitive fields withhold even their LENGTH — the same
 *  line @hanzo/observe draws when it returns `{redacted:true}` with no `length`.
 *  A 4-digit CVV and a 16-digit PAN must not be told apart by counting stars. */
const FIXED = '********'

/** A CSS attribute name we can safely interpolate into a selector. */
const IDENT = /^[A-Za-z_][A-Za-z0-9_-]*$/

/** The selector form of the policy's subtree exclusion. Mirrors `isPrivate()`
 *  exactly: the configured attribute (default `data-hz-private`) PLUS the two
 *  fixed conventions. A custom attribute that is not a valid CSS identifier is
 *  dropped from the selector — `maskInputFn` still honors it via `isPrivate()`. */
export function privateSelector(policy: RedactionPolicy = {}, extra?: string): string {
  const flag = policy.privateAttribute ?? PRIVATE_DEFAULT
  const parts = [...ALWAYS_PRIVATE]
  if (IDENT.test(flag)) parts.unshift(`[${flag}]`)
  if (extra) parts.push(extra)
  return parts.join(',')
}

/** The field-identity string `sensitiveKey()` is asked about. Composed from the
 *  same attributes @hanzo/observe composes from, which is also what
 *  @hanzo/observe-native does for its non-DOM binding — one policy, one key. */
export function fieldIdentity(el: Element): string {
  return [
    el.getAttribute('name'),
    el.id || null,
    el.getAttribute('autocomplete'),
    el.getAttribute('placeholder'),
    el.getAttribute('aria-label'),
  ]
    .filter(Boolean)
    .join(' ')
}

function inputType(el: Element): string {
  const tag = el.tagName.toLowerCase()
  if (tag === 'textarea') return 'textarea'
  return (el.getAttribute('type') || 'text').toLowerCase()
}

/** The per-field decision. Returns what rrweb will record in place of the typed
 *  value.
 *
 *  Order is the policy: a private subtree and a sensitive identity both withhold
 *  the length; ordinary masking keeps the length (so playback still shows a field
 *  being filled) but no character; and the raw value survives ONLY when the app
 *  explicitly turned masking off AND the field is provably none of the above. */
export function maskInput(text: string, el: Element, policy: RedactionPolicy = {}): string {
  if (isPrivate(el, policy)) return FIXED
  if (SECURE_TYPES.has(inputType(el))) return FIXED
  if (sensitiveKey(fieldIdentity(el), policy)) return FIXED
  if (policy.maskInput !== false) return '*'.repeat(text.length)
  // The one path where a raw value leaves the device, so it is also the one place
  // the CONTENT gets a look. Field identity is a guess about what a box is for; a
  // card number pasted into a search box is a card number either way, and
  // `redactSecrets` is already the house judge of that.
  return redactSecrets(text)
}

/** Mask visible text. rrweb only calls this for nodes it already decided to mask,
 *  so it always masks; matching rrweb's own default keeps whitespace, and with it
 *  the layout, intact. */
export function maskText(text: string): string {
  return text.replace(/\S/g, '*')
}

/** Every input type opted into masking, so `maskInput` above is consulted for all
 *  of them rather than only the ones rrweb masks by default. */
const ALL_INPUTS = {
  color: true,
  date: true,
  'datetime-local': true,
  email: true,
  month: true,
  number: true,
  range: true,
  search: true,
  tel: true,
  text: true,
  time: true,
  url: true,
  week: true,
  textarea: true,
  select: true,
  password: true,
} as const

/** Translate a policy (plus the app's own selectors) into rrweb record options.
 *  `extra` is the caller's rrweb escape hatch and is applied UNDER these, so it
 *  can tune sampling but cannot widen the gate. */
export function recorderOptions(
  policy: RedactionPolicy = {},
  opts: {
    blockSelector?: string
    maskTextSelector?: string
    extra?: Partial<recordOptions<eventWithTime>>
  } = {},
): recordOptions<eventWithTime> {
  const priv = privateSelector(policy)
  return {
    ...opts.extra,
    // Credential-shaped fields never enter the DOM at all, on top of whatever
    // the app marked private.
    blockSelector: [priv, CREDENTIAL_SELECTOR, opts.blockSelector].filter(Boolean).join(','),
    maskTextSelector: [priv, opts.maskTextSelector].filter(Boolean).join(','),
    maskAllInputs: policy.maskInput !== false,
    maskInputOptions: { ...ALL_INPUTS },
    maskInputFn: (text: string, el: HTMLElement) => maskInput(text, el, policy),
    maskTextFn: (text: string) => maskText(text),
    // Pixel capture is off. A canvas or an inlined image is user content in the
    // one form no text rule can mask.
    recordCanvas: false,
    inlineImages: false,
  }
}
