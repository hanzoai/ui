// What a recording's large events cost on the wire: gzip, in the encoding the
// player already reads.
//
// A full snapshot is the whole serialized DOM. A landing page's is about a
// megabyte, and one replay message carries at most 512 KiB (MAX_BATCH_BYTES), so
// sent raw it is refused whole and the recording has no first frame to play from.
// DOM JSON is highly repetitive, so gzip takes it to a few percent of that.
//
// THE ENCODING IS THE PLAYER'S, NOT OURS. The event keeps its type and timestamp
// and gains `cv: '2024-10'`; the compressed part becomes a gzip stream carried as
// a latin-1 string (one char per byte). The insights player decompresses exactly
// that (common/replay-shared decompress.ts `decompressEvent`): a full snapshot's
// `data`; a mutation's `adds`, `removes`, `texts` and `attributes`; a style rule's
// `adds` and `removes`. Nothing else is touched, so the ingester still reads the
// clicks, inputs and page metadata it summarises a session from.
//
// A full snapshot is always compressed. An incremental mutation or style rule is
// compressed once its JSON passes COMPRESS_FROM: below that gzip saves little and
// costs a sync pass on the main thread for every small DOM change.

import { gzipSync, strFromU8, strToU8 } from 'fflate'
import type { eventWithTime } from './types'

/** The compression version the player keys on. */
export const COMPRESSION = '2024-10'

/** A mutation or style rule's JSON size, in characters, from which it is sent compressed. */
export const COMPRESS_FROM = 4096

const FULL_SNAPSHOT = 2
const INCREMENTAL = 3
const MUTATION = 0
const STYLE_RULE = 8

/** A value as gzip, carried as a latin-1 string. `undefined` stays undefined: the
 *  player decompresses an absent part to nothing. */
function pack(v: unknown): string | undefined {
  if (v === undefined) return undefined
  return strFromU8(gzipSync(strToU8(JSON.stringify(v)), { level: 6, mtime: 0 }), true)
}

type Incremental = { source?: number; [k: string]: unknown }

/** The event as it is compressed, or the event unchanged when nothing in it is. */
export function compress(e: eventWithTime): eventWithTime {
  const ev = e as unknown as { type: number; data: unknown }
  if (ev.type === FULL_SNAPSHOT) return { ...e, cv: COMPRESSION, data: pack(ev.data) } as unknown as eventWithTime
  if (ev.type !== INCREMENTAL || !ev.data || typeof ev.data !== 'object') return e
  const d = ev.data as Incremental
  if (d.source === MUTATION && 'texts' in d) {
    return {
      ...e,
      cv: COMPRESSION,
      data: { ...d, adds: pack(d.adds), removes: pack(d.removes), texts: pack(d.texts), attributes: pack(d.attributes) },
    } as unknown as eventWithTime
  }
  if (d.source === STYLE_RULE) {
    return { ...e, cv: COMPRESSION, data: { ...d, adds: pack(d.adds), removes: pack(d.removes) } } as unknown as eventWithTime
  }
  return e
}

/** One event's wire form: JSON, compressed where it pays. */
export function encode(e: eventWithTime): string {
  if ((e as { type: number }).type === FULL_SNAPSHOT) return JSON.stringify(compress(e))
  const raw = JSON.stringify(e)
  if (raw.length < COMPRESS_FROM) return raw
  const packed = compress(e)
  return packed === e ? raw : JSON.stringify(packed)
}
