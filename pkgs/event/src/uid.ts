// The ONE id minter for this client — UUIDv7 (RFC 9562 §5.7).
//
// WHY NOT crypto.randomUUID(): it mints v4, whose 122 bits are pure entropy and
// carry no time. The session rollups on the event plane derive a session's start
// instant FROM THE ID — their PARTITION BY and ORDER BY are
// `fromUnixTimestamp(intDiv(toUInt64(bitShiftRight(session_id_v7, 80)), 1000))` —
// so they admit only ids whose version nibble is 7
// (`bitAnd(bitShiftRight(toUInt128(session_id), 76), 15) = 7`). A v4 session id is
// not merely unordered there: it is DISCARDED at the door, silently, and the
// rollup stays empty forever. Minting v7 is the whole reason those rollups can
// exist; it also clusters index writes by time instead of scattering them across
// the keyspace.
//
// Layout, 16 bytes big-endian:
//   0..5   unix_ts_ms — 48-bit millisecond timestamp
//   6      0111 (version 7) in the high nibble | rand_a
//   7      rand_a
//   8      10 (variant) in the high 2 bits | rand_b
//   9..15  rand_b
//
// Never returns a non-UUID shape. The old minters fell back to `'a-' + base36`
// when crypto was absent, and the plane casts a session id with
// accurateCastOrNull(…, 'UUID') — a shape that does not parse becomes NULL and is
// dropped by the same gate, so the fallback failed exactly like v4 did. Here only
// the ENTROPY degrades without crypto; the shape is always a valid v7 UUID.

/** 00..ff, so formatting is a lookup rather than 16 padStart calls. */
const HEX: string[] = Array.from({ length: 256 }, (_, i) => (i + 0x100).toString(16).slice(1))

/** Cryptographic randomness when the host has it, Math.random when it does not. */
function fill(b: Uint8Array): Uint8Array {
  const c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(b)
    return b
  }
  for (let i = 0; i < b.length; i++) b[i] = (Math.random() * 256) | 0
  return b
}

/**
 * uuidv7 mints a time-ordered UUIDv7 for `now` (epoch milliseconds).
 *
 * Two ids minted in the same millisecond sort arbitrarily between themselves; ids
 * from different milliseconds sort by time, lexically and numerically alike.
 */
export function uuidv7(now: number = Date.now()): string {
  const b = fill(new Uint8Array(16))
  // 48-bit big-endian timestamp. Milliseconds stay exact well past year 10000, so
  // the arithmetic never leaves the safe-integer range.
  let t = Math.floor(now)
  for (let i = 5; i >= 0; i--) {
    b[i] = t % 256
    t = Math.floor(t / 256)
  }
  b[6] = 0x70 | (b[6] & 0x0f) // version 7
  b[8] = 0x80 | (b[8] & 0x3f) // variant 0b10
  return (
    HEX[b[0]] + HEX[b[1]] + HEX[b[2]] + HEX[b[3]] + '-' +
    HEX[b[4]] + HEX[b[5]] + '-' +
    HEX[b[6]] + HEX[b[7]] + '-' +
    HEX[b[8]] + HEX[b[9]] + '-' +
    HEX[b[10]] + HEX[b[11]] + HEX[b[12]] + HEX[b[13]] + HEX[b[14]] + HEX[b[15]]
  )
}

/** The millisecond timestamp a v7 id was minted at — the inverse of uuidv7. */
export function uuidv7Time(id: string): number {
  return parseInt(id.slice(0, 8) + id.slice(9, 13), 16)
}
