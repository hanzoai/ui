// Client-side redaction for error text — a faithful port of the server's
// errortracking scrub (o11y pkg/modules/errortracking/implerrortracking/scrub.go),
// applied BEFORE anything leaves the browser. Two layers, default-secure:
//
//   - Secret shapes are ALWAYS redacted (sk-… keys, bearer/JWT tokens, DB DSNs,
//     PANs, cloud keys). There is no mode that ships a secret off-device.
//   - PII (email/IP) is scrubbed UNLESS capturePII is explicitly enabled.
//
// The server scrubs again — this is defense in depth, not a substitute — but the
// point is that a Hanzo browser never emits a raw secret/email/IP in the first
// place. Pure, no I/O.

const REDACTED = '[redacted]'
const EMAIL_MARK = '[email]'
const IP_MARK = '[ip]'

// Secret patterns mirror scrub.go's secretPatterns. Order matters (broad DSN/PAN
// rules run last). All are applied unconditionally.
const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN[ A-Z]*PRIVATE KEY-----[\s\S]*?-----END[ A-Z]*PRIVATE KEY-----/g,
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/g, // JWT
  /\bbearer\s+[A-Za-z0-9._~+/-]{12,}=*/gi, // bearer token
  /\b(?:sk|pk|rk)-[A-Za-z0-9]{2,}-?[A-Za-z0-9]{12,}/g, // openai-style
  /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{16,}/g, // stripe
  /\bhk-[A-Za-z0-9]{16,}/g, // hanzo key
  /\bAKIA[0-9A-Z]{16}\b/g, // aws access key id
  /\bASIA[0-9A-Z]{16}\b/g, // aws sts key id
  /\bAIza[0-9A-Za-z_-]{20,}/g, // google api key
  /\bgh[posru]_[A-Za-z0-9]{20,}/g, // github token
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/g, // slack token
  // Creds in a URL/DSN. The repetition is BOUNDED on purpose: the unbounded form
  // ([^\s:@/]+:[^\s@/]+@) backtracks quadratically on colon-rich text with no
  // terminating '@' — an HTML error page pasted into an error message took 4.9s
  // at 32KB and >60s at 128KB, freezing the main thread from inside captureError.
  // Real userinfo is far below these caps, so bounding costs nothing.
  /[a-zA-Z][a-zA-Z0-9+.-]{0,32}:\/\/[^\s:@/]{1,256}:[^\s@/]{1,256}@/g,
]

/** Candidate card numbers. Gated by Luhn below — the bare digit-run pattern is a
 *  false-positive cannon that redacts every millisecond epoch, order id and
 *  phone number it sees ("request 1753468800000 timed out" became
 *  "request [redacted]timed out"), which destroys the readability of the very
 *  error messages this client exists to deliver. */
const RE_PAN = /\b(?:\d[ -]?){13,19}\b/g

/** luhn reports whether a digit string satisfies the Luhn checksum. Every real
 *  card number does, so gating redaction on it removes the false positives
 *  WITHOUT introducing a false negative — the safe direction for a redactor. */
function luhn(digits: string): boolean {
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48
    if (alt) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    alt = !alt
  }
  return sum % 10 === 0
}

/** redactPAN removes digit runs that actually check out as card numbers. */
function redactPAN(s: string): string {
  return s.replace(RE_PAN, (m) => {
    const digits = m.replace(/[ -]/g, '')
    if (digits.length < 13 || digits.length > 19) return m
    return luhn(digits) ? REDACTED : m
  })
}

const RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const RE_IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
const RE_IPV6 = /\b(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{1,4}\b/g

/** redactSecrets removes known secret shapes. Always applied. */
export function redactSecrets(s: string): string {
  for (const re of SECRET_PATTERNS) s = s.replace(re, REDACTED)
  return redactPAN(s)
}

/** scrubPII masks emails and IPs. Applied unless PII capture is enabled. */
export function scrubPII(s: string): string {
  s = s.replace(RE_EMAIL, EMAIL_MARK)
  s = s.replace(RE_IPV6, IP_MARK)
  s = s.replace(RE_IPV4, IP_MARK)
  return s
}

/** Longest free-text field this module will scrub. Every pattern here is a regex
 *  run synchronously on the main thread, and the input is attacker-influenced —
 *  `throw new Error(await res.text())` against an HTML error page is a one-line
 *  way to hand us 128KB. Bounding the INPUT bounds the work regardless of which
 *  pattern is pathological. 8KB is far beyond any real error message. */
export const MAX_SCRUB_LEN = 8192

/** truncate caps a string at MAX_SCRUB_LEN, marking that it was cut so a reader
 *  never mistakes a truncated message for the whole one. */
export function truncate(s: string, max = MAX_SCRUB_LEN): string {
  return s.length > max ? s.slice(0, max) + '… [truncated]' : s
}

/** scrubText applies the redaction policy to a free-text field. Input is capped
 *  first: unbounded text is a denial-of-service surface, not just a size problem. */
export function scrubText(s: string | undefined, capturePII = false): string {
  if (!s) return s ?? ''
  s = truncate(s)
  s = redactSecrets(s)
  if (!capturePII) s = scrubPII(s)
  return s
}
