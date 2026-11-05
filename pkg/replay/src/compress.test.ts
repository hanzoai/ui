import { describe as group, expect, it } from 'vitest'
import { Batch, MAX_BATCH_BYTES, replayUrl, utf8Length } from './batch'
import { COMPRESSION, COMPRESS_FROM, compress, encode } from './compress'
import { unzip } from './player.test.util'
import type { ReplayTransport, eventWithTime } from './types'


/** A serialized DOM shaped like the landing's: about a megabyte of nested nodes. */
function landing(): eventWithTime {
  const nodes = []
  for (let i = 0; i < 6000; i++) {
    nodes.push({
      type: 2,
      tagName: i % 3 ? 'div' : 'span',
      attributes: { class: `_dsp-flex _fd-column _ai-center _pt-${i % 40} is_View t_${i % 7}`, 'data-slot': 'cell' },
      childNodes: [{ type: 3, textContent: `Section ${i % 50}: the right intelligence, every time.`, id: i * 2 + 1 }],
      id: i * 2,
    })
  }
  return {
    type: 2,
    timestamp: 1,
    data: { node: { type: 0, childNodes: nodes, id: 1 }, initialOffset: { top: 0, left: 0 } },
  } as unknown as eventWithTime
}

group('compress', () => {
  it('sends a megabyte landing snapshot inside one message, and the player reads it back whole', () => {
    const snap = landing()
    const raw = JSON.stringify(snap)
    expect(utf8Length(raw)).toBeGreaterThan(MAX_BATCH_BYTES) // what was refused before
    const wire = encode(snap)
    expect(utf8Length(wire)).toBeLessThan(MAX_BATCH_BYTES / 2)
    const back = JSON.parse(wire)
    expect(back.cv).toBe(COMPRESSION)
    expect(back.type).toBe(2)
    expect(back.timestamp).toBe(1)
    expect(unzip(back.data)).toEqual((snap as unknown as { data: unknown }).data)
  })

  it('is what a batch sends, so the landing is no longer dropped', () => {
    const sent: string[] = []
    const errors: unknown[] = []
    const transport: ReplayTransport = { send: (_u, payload) => void sent.push(payload) }
    const b = new Batch({
      sessionId: 's',
      windowId: 'w',
      distinctId: 'd',
      ingestKey: 'pk-test',
      url: replayUrl(),
      batchSize: 50,
      maxBytes: MAX_BATCH_BYTES,
      flushIntervalMs: 0,
      transport,
      onError: (e) => errors.push(e),
    })
    b.add(landing())
    b.flush()
    expect(errors).toEqual([])
    expect(sent).toHaveLength(1)
    expect(utf8Length(sent[0])).toBeLessThan(MAX_BATCH_BYTES)
    expect(JSON.parse(sent[0]).events[0].cv).toBe(COMPRESSION)
  })

  it('compresses a large mutation part by part, as the player expects', () => {
    const adds = Array.from({ length: 400 }, (_, i) => ({ parentId: 1, nextId: null, node: { type: 3, textContent: `row ${i}`, id: i + 10 } }))
    const m = { type: 3, timestamp: 2, data: { source: 0, adds, removes: [], texts: [], attributes: [{ id: 3, attributes: { class: 'x' } }] } } as unknown as eventWithTime
    expect(JSON.stringify(m).length).toBeGreaterThan(COMPRESS_FROM)
    const back = JSON.parse(encode(m))
    expect(back.cv).toBe(COMPRESSION)
    expect(back.data.source).toBe(0)
    expect(unzip(back.data.adds)).toEqual(adds)
    expect(unzip(back.data.removes)).toEqual([])
    expect(unzip(back.data.texts)).toEqual([])
    expect(unzip(back.data.attributes)).toEqual([{ id: 3, attributes: { class: 'x' } }])
  })

  it('leaves small events and everything the ingester summarises as they were', () => {
    const click = { type: 3, timestamp: 3, data: { source: 2, type: 2, id: 9, x: 1, y: 2 } } as unknown as eventWithTime
    const meta = { type: 4, timestamp: 4, data: { href: 'https://hanzo.ai/', width: 1, height: 1 } } as unknown as eventWithTime
    const tiny = { type: 3, timestamp: 5, data: { source: 0, adds: [], removes: [], texts: [], attributes: [] } } as unknown as eventWithTime
    for (const e of [click, meta, tiny]) expect(encode(e)).toBe(JSON.stringify(e))
    expect(compress(click)).toBe(click)
  })
})
