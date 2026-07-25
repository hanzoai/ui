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
  /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@/g, // creds in a URL/DSN
  /\b(?:\d[ -]?){13,19}\b/g, // PAN-like digit run
]

const RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const RE_IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
const RE_IPV6 = /\b(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{1,4}\b/g

/** redactSecrets removes known secret shapes. Always applied. */
export function redactSecrets(s: string): string {
  for (const re of SECRET_PATTERNS) s = s.replace(re, REDACTED)
  return s
}

/** scrubPII masks emails and IPs. Applied unless PII capture is enabled. */
export function scrubPII(s: string): string {
  s = s.replace(RE_EMAIL, EMAIL_MARK)
  s = s.replace(RE_IPV6, IP_MARK)
  s = s.replace(RE_IPV4, IP_MARK)
  return s
}

/** scrubText applies the redaction policy to a free-text field. */
export function scrubText(s: string | undefined, capturePII = false): string {
  if (!s) return s ?? ''
  s = redactSecrets(s)
  if (!capturePII) s = scrubPII(s)
  return s
}
