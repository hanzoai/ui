// The insights player's decoder (common/replay-shared decompress.ts
// `decompressEvent`), restated for tests: what a test reads of a payload is what
// the player would show, so a privacy assertion cannot pass because the bytes
// were merely compressed.

import { gunzipSync, strFromU8, strToU8 } from 'fflate'

export const unzip = (s: unknown): unknown =>
  typeof s === 'string' && s ? JSON.parse(strFromU8(gunzipSync(strToU8(s, true)))) : undefined

type Ev = { cv?: string; type: number; data: Record<string, unknown> | string }

export function played(e: Ev): unknown {
  if (e.cv !== '2024-10') return e
  if (e.type === 2) return { ...e, data: unzip(e.data) }
  const d = e.data as Record<string, unknown>
  if (d.source === 0) return { ...e, data: { ...d, adds: unzip(d.adds), removes: unzip(d.removes), texts: unzip(d.texts), attributes: unzip(d.attributes) } }
  if (d.source === 8) return { ...e, data: { ...d, adds: unzip(d.adds), removes: unzip(d.removes) } }
  return e
}

/** A wire body as the player reads it: every compressed event opened. */
export function readable(payload: string): string {
  const body = JSON.parse(payload) as { events: Ev[] }
  return JSON.stringify({ ...body, events: body.events.map(played) })
}
