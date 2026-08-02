import { describe, expect, it, afterEach } from 'vitest'
import { uuidv7, uuidv7Time } from './uid'
import { eventId } from './sentry'

/** The event plane's admission gate, transcribed from the session rollup's own SQL:
 *  `bitAnd(bitShiftRight(toUInt128(accurateCastOrNull(id,'UUID')), 76), 15) = 7`.
 *  An id that fails this is dropped by the materialized view without an error. */
const versionNibble = (id: string): bigint => (BigInt('0x' + id.replace(/-/g, '')) >> 76n) & 15n

/** The session start the rollup partitions and orders on:
 *  `fromUnixTimestamp(intDiv(toUInt64(bitShiftRight(session_id_v7, 80)), 1000))`. */
const embeddedMs = (id: string): bigint => BigInt('0x' + id.replace(/-/g, '')) >> 80n

/** RFC 9562 variant: the two high bits of octet 8 are 0b10. */
const variantBits = (id: string): bigint => (BigInt('0x' + id.replace(/-/g, '')) >> 62n) & 3n

const SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('uuidv7', () => {
  const realCrypto = globalThis.crypto
  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true })
  })

  it('passes the plane admission gate that v4 fails', () => {
    for (let i = 0; i < 200; i++) expect(versionNibble(uuidv7())).toBe(7n)
    // The gate is real: crypto.randomUUID (v4) is what the SDK used to mint.
    expect(versionNibble(crypto.randomUUID())).toBe(4n)
  })

  it('carries the mint instant the rollup keys on', () => {
    for (const ms of [0, 1, 1_000, Date.now(), 253_402_300_799_000]) {
      const id = uuidv7(ms)
      expect(embeddedMs(id)).toBe(BigInt(ms))
      expect(uuidv7Time(id)).toBe(ms)
    }
  })

  it('sets the RFC 9562 variant', () => {
    for (let i = 0; i < 50; i++) expect(variantBits(uuidv7())).toBe(2n)
  })

  it('sorts lexically by time', () => {
    const t = Date.now()
    const ids = [t + 3000, t, t + 1000, t + 2000].map((ms) => uuidv7(ms))
    expect([...ids].sort()).toEqual([ids[1], ids[2], ids[3], ids[0]])
  })

  it('is unique within a single millisecond', () => {
    const ms = Date.now()
    const seen = new Set(Array.from({ length: 5000 }, () => uuidv7(ms)))
    expect(seen.size).toBe(5000)
  })

  it('keeps a valid v7 shape with no crypto at all', () => {
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true })
    const id = uuidv7(1_700_000_000_000)
    // The old fallback emitted 'a-<base36>', which the plane casts to NULL and drops
    // by the same gate v4 fails. Only entropy may degrade — never the shape.
    expect(id).toMatch(SHAPE)
    expect(versionNibble(id)).toBe(7n)
    expect(embeddedMs(id)).toBe(1_700_000_000_000n)
  })
})

describe('eventId', () => {
  it('is the one minter formatted for the Sentry wire', () => {
    const id = eventId()
    expect(id).toMatch(/^[0-9a-f]{32}$/)
    const dashed = `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
    expect(versionNibble(dashed)).toBe(7n)
  })
})
