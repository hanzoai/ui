// The ONE id minter for this client — UUIDv7 (RFC 9562 §5.7).
//
// The implementation is `hzUuidv7` in ./anon.js and this file only re-exports it.
// It lives there because the anonymous-id chain has to mint too, and that chain is
// inlined verbatim by the distribution that has no bundler (the tag
// the door hosts) — a minter here as well would be a second implementation, and
// the version nibble it produces is exactly the thing that must never diverge.
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
// dropped by the same gate, so the fallback failed exactly like v4 did. Only the
// ENTROPY degrades without crypto; the shape is always a valid v7 UUID.

/**
 * uuidv7 mints a time-ordered UUIDv7 for `now` (epoch milliseconds).
 *
 * Two ids minted in the same millisecond sort arbitrarily between themselves; ids
 * from different milliseconds sort by time, lexically and numerically alike.
 */
export { hzUuidv7 as uuidv7 } from './anon.js'

/** The millisecond timestamp a v7 id was minted at — the inverse of uuidv7. */
export function uuidv7Time(id: string): number {
  return parseInt(id.slice(0, 8) + id.slice(9, 13), 16)
}
