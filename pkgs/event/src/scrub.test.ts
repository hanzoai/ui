import { describe, it, expect } from 'vitest'
import { redactSecrets, scrubPII, scrubText } from './scrub'

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
