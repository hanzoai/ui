import { afterEach, beforeEach, describe as group, expect, it, vi } from 'vitest'
import { Batch, KEEPALIVE_BYTES, MAX_BATCH_BYTES, REPLAY_PATH, encodeBatch, publishable, replayUrl, utf8Length } from './batch'
import type { ReplayTransport, eventWithTime } from './types'

const IDS = { sessionId: 's1', windowId: 'w1', distinctId: 'd1' }

function ev(n: number): eventWithTime {
  return { type: 3, data: { source: 2, id: n }, timestamp: n } as unknown as eventWithTime
}

interface Sent {
  url: string
  payload: string
  beacon: boolean
  ingestKey: string
}

function spy(): { sent: Sent[]; transport: ReplayTransport } {
  const sent: Sent[] = []
  return {
    sent,
    transport: {
      send(url, payload, opts) {
        sent.push({ url, payload, beacon: opts.beacon, ingestKey: opts.ingestKey })
      },
    },
  }
}

function batch(t: ReplayTransport, over: Partial<ConstructorParameters<typeof Batch>[0]> = {}) {
  return new Batch({
    ...IDS,
    ingestKey: 'pk-test',
    url: replayUrl(),
    batchSize: 3,
    maxBytes: 1_000_000,
    flushIntervalMs: 1000,
    transport: t,
    ...over,
  })
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

group('the wire body', () => {
  it('is exactly { sessionId, windowId, distinctId, consent, events: [raw rrweb] }', () => {
    const body = JSON.parse(encodeBatch(IDS, [JSON.stringify(ev(1)), JSON.stringify(ev(2))]))
    expect(Object.keys(body)).toEqual(['sessionId', 'windowId', 'distinctId', 'consent', 'events'])
    expect(body.sessionId).toBe('s1')
    expect(body.windowId).toBe('w1')
    expect(body.distinctId).toBe('d1')
    // raw rrweb events, not re-encoded — the player reads them as they came
    expect(body.events).toEqual([ev(1), ev(2)])
  })

  it('escapes ids rather than concatenating them', () => {
    const body = JSON.parse(encodeBatch({ ...IDS, distinctId: 'a"b\\c' }, []))
    expect(body.distinctId).toBe('a"b\\c')
    expect(body.events).toEqual([])
  })
})

group('the ingest endpoint', () => {
  // The address cloud serves (hanzo-inc/cloud apps/event/replay.go `replayPath`,
  // registered under the /v1/event group). This package posted to /v1/replay, which
  // api.hanzo.ai answers 404, so every recording was lost at the door.
  it('is POST {endpoint}/v1/event/replay, the path cloud serves', () => {
    expect(REPLAY_PATH).toBe('/v1/event/replay')
    expect(replayUrl()).toBe('https://api.hanzo.ai/v1/event/replay')
    expect(replayUrl('https://api.hanzo.ai/')).toBe('https://api.hanzo.ai/v1/event/replay')
    expect(replayUrl('http://localhost:3000')).toBe('http://localhost:3000/v1/event/replay')
  })

  // The ingest refuses a body over 512 KiB (replay.go `maxReplayBytes`) with 413.
  it('bounds a batch by the ingest’s own limit', () => {
    expect(MAX_BATCH_BYTES).toBe(512 * 1024)
    expect(KEEPALIVE_BYTES).toBe(64 * 1024)
  })

  it('only a publishable key may ride a URL', () => {
    expect(publishable('pk-live-abc')).toBe(true)
    expect(publishable('pk_live_abc')).toBe(true)
    expect(publishable('sk-live-abc')).toBe(false)
    expect(publishable('hk-abc')).toBe(false)
    expect(publishable('')).toBe(false)
  })
})

group('flush triggers', () => {
  it('flushes once the batch is long enough', () => {
    const { sent, transport } = spy()
    const b = batch(transport)
    b.add(ev(1))
    b.add(ev(2))
    expect(sent).toHaveLength(0)
    b.add(ev(3))
    expect(sent).toHaveLength(1)
    expect(JSON.parse(sent[0].payload).events).toHaveLength(3)
    expect(sent[0].url).toBe('https://api.hanzo.ai/v1/event/replay')
    expect(sent[0].beacon).toBe(false)
    expect(sent[0].ingestKey).toBe('pk-test')
  })

  it('cuts the batch before an event would take it past maxBytes', () => {
    const { sent, transport } = spy()
    const b = batch(transport, { batchSize: 1000, maxBytes: 400 })
    const big = { type: 3, data: { blob: 'x'.repeat(150) }, timestamp: 2 } as unknown as eventWithTime
    b.add(big)
    expect(sent).toHaveLength(0)
    b.add(big) // two of them and the envelope are past 400 bytes
    expect(sent).toHaveLength(1)
    expect(JSON.parse(sent[0].payload).events).toHaveLength(1)
    b.flush()
    expect(sent).toHaveLength(2)
    for (const s of sent) expect(utf8Length(s.payload)).toBeLessThanOrEqual(400)
  })

  it('counts the body in UTF-8, as it is sent', () => {
    const { sent, transport } = spy()
    const b = batch(transport, { batchSize: 1000, maxBytes: 600 })
    // 120 characters, 360 bytes: two of them fit a 600-character budget and not a 600-byte one.
    const wide = { type: 3, data: { text: '界'.repeat(120) }, timestamp: 1 } as unknown as eventWithTime
    b.add(wide)
    b.add(wide)
    b.flush()
    expect(sent).toHaveLength(2)
    for (const s of sent) expect(utf8Length(s.payload)).toBeLessThanOrEqual(600)
    expect(utf8Length('a界😀')).toBe(new TextEncoder().encode('a界😀').length)
  })

  it('reports an event bigger than a batch on its own, and never sends it', () => {
    const { sent, transport } = spy()
    const errs: unknown[] = []
    const b = batch(transport, { batchSize: 1000, maxBytes: 300, onError: (e) => errs.push(e) })
    b.add(ev(1))
    b.add({ type: 2, data: { blob: 'x'.repeat(500) }, timestamp: 2 } as unknown as eventWithTime)
    b.add(ev(3))
    b.flush()
    expect(errs).toHaveLength(1)
    expect(String(errs[0])).toMatch(/cannot fit a 300-byte batch/)
    expect(sent).toHaveLength(1)
    expect(JSON.parse(sent[0].payload).events).toEqual([ev(1), ev(3)])
  })

  it('flushes on the interval, and never sends an empty batch', () => {
    const { sent, transport } = spy()
    const b = batch(transport)
    b.start()
    vi.advanceTimersByTime(3000)
    expect(sent).toHaveLength(0) // nothing buffered, nothing sent
    b.add(ev(1))
    vi.advanceTimersByTime(1000)
    expect(sent).toHaveLength(1)
    expect(JSON.parse(sent[0].payload).events).toHaveLength(1)
    b.stop()
  })

  it('beacons the tail on pagehide and on becoming hidden', () => {
    const { sent, transport } = spy()
    const b = batch(transport)
    b.start()
    b.add(ev(1))
    window.dispatchEvent(new Event('pagehide'))
    expect(sent).toHaveLength(1)
    expect(sent[0].beacon).toBe(true)

    b.add(ev(2))
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(sent).toHaveLength(2)
    expect(sent[1].beacon).toBe(true)
    b.stop()
  })

  it('sends the tail on stop, then stops listening', () => {
    const { sent, transport } = spy()
    const b = batch(transport)
    b.start()
    b.add(ev(1))
    b.stop()
    expect(sent).toHaveLength(1)
    b.add(ev(2))
    window.dispatchEvent(new Event('pagehide'))
    vi.advanceTimersByTime(10_000)
    expect(sent).toHaveLength(1) // the listeners and the timer are gone
  })

  it('drops one unserializable event, never the batch', () => {
    const { sent, transport } = spy()
    const errs: unknown[] = []
    const b = batch(transport, { onError: (e) => errs.push(e) })
    const cyclic = { type: 3, data: {}, timestamp: 1 } as unknown as Record<string, unknown>
    cyclic.self = cyclic
    b.add(ev(1))
    b.add(cyclic as unknown as eventWithTime)
    b.add(ev(2))
    b.add(ev(3))
    expect(errs).toHaveLength(1)
    expect(sent).toHaveLength(1)
    expect(JSON.parse(sent[0].payload).events).toEqual([ev(1), ev(2), ev(3)])
  })
})

group('the default transport', () => {
  it('puts the key in a header on fetch and in ?ingest_key= on a beacon', async () => {
    vi.useRealTimers()
    const calls: Array<[string, RequestInit | undefined]> = []
    const beacons: string[] = []
    const g = globalThis as unknown as Record<string, unknown>
    const oldFetch = g.fetch
    g.fetch = (url: string, init?: RequestInit) => {
      calls.push([url, init])
      return Promise.resolve({ ok: true, status: 200 } as Response)
    }
    const nav = navigator as unknown as Record<string, unknown>
    const oldBeacon = nav.sendBeacon
    nav.sendBeacon = (url: string) => {
      beacons.push(url)
      return true
    }

    const url = 'https://api.hanzo.ai/v1/event/replay'
    const { defaultTransport } = await import('./batch')
    defaultTransport.send(url, '{}', { beacon: false, ingestKey: 'pk-abc' })
    defaultTransport.send(url, '{}', { beacon: true, ingestKey: 'pk-abc' })
    // a secret key must never be written into a URL — fall back to the header
    defaultTransport.send(url, '{}', { beacon: true, ingestKey: 'sk-abc' })
    // past the keepalive quota the browser refuses a beacon or a keepalive fetch
    // outright, so the tail goes as an ordinary fetch
    const tail = '"' + 'x'.repeat(KEEPALIVE_BYTES) + '"'
    defaultTransport.send(url, tail, { beacon: true, ingestKey: 'pk-abc' })

    expect(calls).toHaveLength(3)
    expect((calls[0][1]!.headers as Record<string, string>).Authorization).toBe('Bearer pk-abc')
    expect(calls[0][1]!.method).toBe('POST')
    // an ordinary flush is not kept alive: a snapshot is several times the quota
    expect(calls[0][1]!.keepalive).toBe(false)
    expect((calls[1][1]!.headers as Record<string, string>).Authorization).toBe('Bearer sk-abc')
    expect(calls[1][1]!.keepalive).toBe(true)
    expect(calls[2][1]!.body).toBe(tail)
    expect(calls[2][1]!.keepalive).toBe(false)
    expect(beacons).toEqual(['https://api.hanzo.ai/v1/event/replay?ingest_key=pk-abc'])

    g.fetch = oldFetch
    nav.sendBeacon = oldBeacon
  })
})
