// Privacy gate. Two jobs, applied before anything is captured:
//   1. isPrivate — does this element sit in a subtree the app marked off-limits?
//   2. redactValue — turn a form field into a safe, structured summary that never
//      carries the raw typed value unless it is provably non-sensitive AND masking
//      is explicitly off.
// Privacy-first: the default withholds every input value.

import type { RedactedValue, RedactionPolicy } from './types'

const MAX_VALUE = 64

/** Field types whose value is never captured, regardless of masking. */
const SENSITIVE_TYPE = new Set(['password', 'hidden', 'email', 'tel'])

/** Field-identity patterns (name/id/autocomplete/placeholder) that mark a field
 *  sensitive even when its type is plain text. */
const SENSITIVE_RE =
  /pass|pwd|secret|token|otp|cvv|cvc|csc|cc-|card|ccnum|credit|ssn|social|routing|account|pin|auth|api[-_ ]?key|security|dob|birth/i

const PRIVATE_DEFAULT = 'data-hz-private'

function attr(el: Element, name: string): string | null {
  return el.getAttribute(name)
}

/** True when `el` or any ancestor opts out of capture. Honors the configured
 *  private attribute plus the `data-observe="off"` and `data-private`
 *  conventions. */
export function isPrivate(el: Element | null, policy: RedactionPolicy = {}): boolean {
  const flag = policy.privateAttribute ?? PRIVATE_DEFAULT
  let cur: Element | null = el
  while (cur && cur.nodeType === 1) {
    if (cur.hasAttribute(flag)) return true
    if (cur.getAttribute('data-observe') === 'off') return true
    if (cur.hasAttribute('data-private')) return true
    cur = cur.parentElement
  }
  return false
}

function fieldKey(el: Element): string {
  return [
    attr(el, 'name'),
    el.id || null,
    attr(el, 'autocomplete'),
    attr(el, 'placeholder'),
    attr(el, 'aria-label'),
  ]
    .filter(Boolean)
    .join(' ')
}

/** True when a field-identity string (name / id / autocomplete / kind) reads as
 *  sensitive under the built-in patterns or a policy's extra pattern. Exported so
 *  non-DOM bindings (native/Tamagui) apply the exact same policy. */
export function sensitiveKey(text: string, policy: RedactionPolicy = {}): boolean {
  if (SENSITIVE_RE.test(text)) return true
  if (policy.sensitive && policy.sensitive.test(text)) return true
  return false
}

function isSensitive(el: Element, type: string, policy: RedactionPolicy): boolean {
  if (SENSITIVE_TYPE.has(type)) return true
  return sensitiveKey(fieldKey(el), policy)
}

function clip(s: string): string {
  return s.length > MAX_VALUE ? s.slice(0, MAX_VALUE) + '…' : s
}

/** Summarize a form field's state without leaking its content. Returns undefined
 *  for non-field elements. */
export function redactValue(el: Element, policy: RedactionPolicy = {}): RedactedValue | undefined {
  const tag = el.tagName.toLowerCase()
  if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return undefined

  if (tag === 'select') {
    const s = el as HTMLSelectElement
    const opt = s.options[s.selectedIndex]
    return { redacted: false, kind: 'select', value: opt ? clip((opt.text || '').trim()) : undefined }
  }

  const type = (tag === 'textarea' ? 'textarea' : (attr(el, 'type') || 'text')).toLowerCase()

  if (type === 'checkbox' || type === 'radio') {
    return { redacted: false, kind: type, checked: (el as HTMLInputElement).checked }
  }

  const raw = (el as HTMLInputElement).value ?? ''
  const sensitive = isSensitive(el, type, policy)
  const mask = policy.maskInput !== false // default: mask

  if (sensitive) return { redacted: true, kind: type }
  if (mask) return { redacted: true, kind: type, length: raw.length }
  return { redacted: false, kind: type, value: clip(raw) }
}
