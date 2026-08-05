import { describe, it, expect } from 'vitest'
import { redactSecrets, scrubPII, scrubText, MAX_SCRUB_LEN } from './scrub'

describe('redactSecrets (always applied)', () => {
  it('redacts a hanzo key', () => {
    expect(redactSecrets('key=hk-ABCDEFGHIJKLMNOP1234 tail')).toContain('[redacted]')
    expect(redactSecrets('key=hk-ABCDEFGHIJKLMNOP1234 tail')).not.toContain('hk-ABCDEFGHIJKLMNOP1234')
  })
  it('redacts a JWT', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abcdefghij'
    expect(redactSecrets(`token ${jwt}`)).not.toContain(jwt)
  })
  it('redacts a bearer token', () => {
    expect(redactSecrets('Authorization: Bearer abcdef0123456789ABCDEF')).toContain('[redacted]')
  })
  it('redacts openai/stripe/aws/github/google/slack shapes', () => {
    expect(redactSecrets('sk-proj-ABCDEFGHIJKLMNOPQRST')).toContain('[redacted]')
    expect(redactSecrets('sk_live_ABCDEFGHIJKLMNOP1234')).toContain('[redacted]')
    expect(redactSecrets('AKIAABCDEFGHIJKLMNOP')).toContain('[redacted]')
    expect(redactSecrets('ghp_ABCDEFGHIJKLMNOPQRSTUVWX')).toContain('[redacted]')
    expect(redactSecrets('AIzaABCDEFGHIJKLMNOPQRSTUVWXYZ012345')).toContain('[redacted]')
    expect(redactSecrets('xoxb-1111-2222-abcdefghij')).toContain('[redacted]')
  })
  it('redacts credentials embedded in a URL/DSN', () => {
    expect(redactSecrets('postgres://user:s3cretpw@db.host:5432/x')).toContain('[redacted]')
    expect(redactSecrets('postgres://user:s3cretpw@db.host:5432/x')).not.toContain('s3cretpw')
  })
})

describe('scrubPII (default; opt-out via capturePII)', () => {
  it('masks emails and IPs', () => {
    expect(scrubPII('from alice@example.com at 192.168.1.7')).toBe('from [email] at [ip]')
  })
  it('scrubText masks by default and retains when capturePII=true', () => {
    expect(scrubText('alice@example.com', false)).toBe('[email]')
    expect(scrubText('alice@example.com', true)).toBe('alice@example.com')
  })
  it('scrubText still redacts secrets even when capturePII=true', () => {
    expect(scrubText('hk-ABCDEFGHIJKLMNOP1234', true)).toContain('[redacted]')
  })
  it('is total on empty/undefined', () => {
    expect(scrubText(undefined)).toBe('')
    expect(scrubText('')).toBe('')
  })
})

// ── denial of service ──────────────────────────────────────────────────────
//
// The scrubber runs SYNCHRONOUSLY on the main thread inside captureError, and its
// input is attacker-influenced: `throw new Error(await res.text())` against an
// HTML error page is a one-line way to hand it 128KB. The creds-in-URL pattern
// backtracked quadratically on colon-rich text with no terminating '@' — 4.9s at
// 32KB, >60s at 128KB. Both the input cap and the bounded pattern are load-bearing.

describe('input bounding', () => {
  it('caps input length and says so', () => {
    const out = scrubText('a'.repeat(MAX_SCRUB_LEN * 4))
    expect(out.length).toBeLessThan(MAX_SCRUB_LEN + 64)
    expect(out.endsWith('… [truncated]')).toBe(true)
  })

  it('scrubs pathological colon-rich input in bounded time', () => {
    // The exact shape that blew up: many colons, no '@' to terminate the match.
    const hostile = '<div class="a:b:c">'.repeat(8000) // ~150KB
    const t0 = Date.now()
    const out = scrubText(hostile)
    const ms = Date.now() - t0
    expect(out).toBeTruthy()
    // Was >60s unbounded. Generous ceiling so the test is not flaky on slow CI.
    expect(ms).toBeLessThan(1000)
  })

  it('still redacts real credentials in a URL', () => {
    expect(scrubText('postgres://user:hunter2@db.internal/app')).toContain('[redacted]')
    expect(scrubText('postgres://user:hunter2@db.internal/app')).not.toContain('hunter2')
  })
})

// ── PAN false positives ────────────────────────────────────────────────────
//
// The bare digit-run rule redacted every millisecond epoch and order id it saw,
// destroying the readability of the messages this client exists to deliver. It is
// now gated on Luhn, which every real card satisfies — so the false positives go
// away without introducing a false negative.

describe('card numbers', () => {
  it('redacts a real (Luhn-valid) card number', () => {
    expect(scrubText('card 4111111111111111 declined')).toContain('[redacted]')
    expect(scrubText('card 4111-1111-1111-1111 declined')).toContain('[redacted]')
  })

  it('leaves an epoch timestamp alone', () => {
    const out = scrubText('request 1753468800000 timed out')
    expect(out).toBe('request 1753468800000 timed out')
  })
})

describe('credential params in a URL', () => {
  // The client stamps url = window.location.href on EVERY event, so one visit to
  // an OAuth callback would otherwise put a live, still-redeemable authorization
  // code on the wire once per event.
  it('redacts an OAuth code and state, which have no matchable shape', () => {
    const out = scrubText('https://hanzo.id/callback?code=4%2F0AeanS0bQx7Lm&state=xyzzy123')
    expect(out).not.toContain('4%2F0AeanS0bQx7Lm')
    expect(out).not.toContain('xyzzy123')
    expect(out).toContain('code=')
    expect(out).toContain('https://hanzo.id/callback')
  })

  it('redacts reset / invite / session tokens too', () => {
    for (const q of ['reset_token=abc123def', 'invite=q7Wm2', 'session_id=s-9182', 'api_key=plain']) {
      const out = scrubText('https://hanzo.ai/x?' + q)
      expect(out.split('=')[1]).not.toMatch(/abc123def|q7Wm2|s-9182|plain/)
    }
  })

  it('leaves ordinary params alone', () => {
    const out = scrubText('https://hanzo.ai/pricing?plan=pro&utm_source=hn&page=2')
    expect(out).toContain('plan=pro')
    expect(out).toContain('utm_source=hn')
    expect(out).toContain('page=2')
  })
})
