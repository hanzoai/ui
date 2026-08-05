// Two kinds of test here, on purpose.
//
//   • The privacy claims run against the REAL rrweb serializer. A masking rule
//     that is only ever asserted against a mock proves nothing about what leaves
//     a browser.
//   • The lifecycle claims (refusal, stop-on-navigation, batching) run against an
//     injected recorder, so the exact moment an event arrives is ours to choose.

import { afterEach, beforeEach, describe as group, expect, it, vi } from 'vitest'
import { record } from './index'
import type { Recorder, ReplayTransport, eventWithTime, recordOptions } from './types'

// happy-dom declares `DOMTokenList` on window without a value, so rrweb's
// feature-detect (`'DOMTokenList' in win`) passes and then dereferences
// undefined. Test-environment gap, not a library bug.
const w = window as unknown as Record<string, unknown>
if (!w.DOMTokenList) w.DOMTokenList = class DOMTokenList {}

const KEY = 'pk-test'

interface Sent {
  url: string
  payload: string
  beacon: boolean
  ingestKey: string
}

function spy(): { sent: Sent[]; transport: ReplayTransport; bodies: () => Array<Record<string, unknown>> } {
  const sent: Sent[] = []
  return {
    sent,
    transport: {
      send: (url, payload, opts) =>
        void sent.push({ url, payload, beacon: opts.beacon, ingestKey: opts.ingestKey }),
    },
    bodies: () => sent.map((s) => JSON.parse(s.payload)),
  }
}

/** A recorder that hands the emit callback back so a test can drive it. */
function fakeRecorder(): { recorder: Recorder; emit: (e: eventWithTime) => void; opts: () => recordOptions<eventWithTime>; stopped: () => number; calls: () => number } {
  let emit: ((e: eventWithTime) => void) | undefined
  let opts: recordOptions<eventWithTime> | undefined
  let stops = 0
  let calls = 0
  return {
    recorder: (o) => {
      calls++
      opts = o
      emit = o?.emit as (e: eventWithTime) => void
      return () => {
        stops++
      }
    },
    emit: (e) => emit?.(e),
    opts: () => opts!,
    stopped: () => stops,
    calls: () => calls,
  }
}

function ev(n: number): eventWithTime {
  return { type: 3, data: { source: 2, id: n }, timestamp: n } as unknown as eventWithTime
}

function go(path: string): void {
  window.history.pushState({}, '', path)
}

beforeEach(() => {
  go('/')
  document.body.innerHTML = ''
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => vi.useRealTimers())

// KNOWN LIMIT OF THIS ENVIRONMENT: happy-dom does not satisfy rrweb's untainted
// `Node.prototype.textContent` accessor, so EVERY serialized text node comes out
// as "" — with or without our options, and with plain rrweb too. Asserting
// "secret text is absent" here would therefore pass whether or not the gate
// exists, so these tests assert on ATTRIBUTES, which do serialize faithfully:
// a blocked subtree loses its children (and their attributes), and an input's
// value arrives already masked. Text masking is covered by maskText's unit test
// and by the maskTextSelector wiring assertion in policy.test.ts.
group('what leaves the browser (real rrweb)', () => {
  function capture(html: string, config: Parameters<typeof record>[0] = { ingestKey: KEY }) {
    document.body.innerHTML = html
    const s = spy()
    const replay = record({ ...config, ingestKey: config.ingestKey || KEY, transport: s.transport })
    replay.stop() // flushes the full snapshot rrweb takes on start
    expect(s.sent.length).toBeGreaterThan(0)
    return { replay, payload: s.sent.map((x) => x.payload).join(''), bodies: s.bodies() }
  }

  it('masks input values by default, keeping only the length', () => {
    const { payload } = capture('<input name="nickname" value="supersecretnick">')
    expect(payload).not.toContain('supersecretnick')
    expect(payload).toContain('"value":"***************"') // 15 chars, structure kept
  })

  it('never captures a password field — value or length', () => {
    const { payload } = capture(
      '<form><input type="password" name="password" value="hunter2correcthorse">' +
        '<input name="username" value="ada"></form>',
    )
    expect(payload).not.toContain('hunter2correcthorse')
    expect(payload).not.toContain('*'.repeat(19)) // no length leak either
    // it was BLOCKED, not merely masked: rrweb leaves a sized placeholder
    expect(payload).toContain('rr_width')
    // and the ordinary field beside it still records, masked
    expect(payload).toContain('"value":"***"')
  })

  it('never captures a payment field, even with masking explicitly off', () => {
    const { payload } = capture(
      '<input name="cardNumber" autocomplete="cc-number" value="4111111111111111">' +
        '<input name="cvv" autocomplete="cc-csc" value="737">' +
        '<input name="query" value="4111111111111111 lookup">',
      { ingestKey: KEY, policy: { maskInput: false } },
    )
    expect(payload).not.toContain('4111111111111111')
    expect(payload).not.toContain('"value":"737"')
    // masking off is honored for a field that is provably none of the above…
    expect(payload).toContain('"name":"query"')
    expect(payload).toContain('lookup')
    // …but a card number pasted into it is redacted by content anyway. The PAN
    // rule eats the separator after the digits, which is @hanzo/event's shape.
    expect(payload).toContain('"value":"[redacted]lookup"')
  })

  it('excludes a data-hz-private subtree', () => {
    const { payload } = capture(
      '<div data-hz-private><span id="private-marker"></span><input name="q" value="privatevalue"></div>' +
        '<p id="public-marker"></p>',
    )
    expect(payload).not.toContain('private-marker')
    expect(payload).not.toContain('privatevalue')
    expect(payload).toContain('public-marker') // the rest of the page still records
  })

  it('honors data-observe="off" and data-private', () => {
    for (const attr of ['data-observe="off"', 'data-private']) {
      const { payload } = capture(
        `<section ${attr}><input name="q" value="hiddenvalue"></section>` +
          '<p id="public-marker"></p>',
      )
      expect(payload, attr).not.toContain('hiddenvalue')
      expect(payload, attr).toContain('public-marker')
    }
  })

  it("honors a caller's custom privateAttribute", () => {
    const { payload } = capture(
      '<div data-vault><input name="q" value="vaultedvalue"></div><p id="public-marker"></p>',
      { ingestKey: KEY, policy: { privateAttribute: 'data-vault' } },
    )
    expect(payload).not.toContain('vaultedvalue')
    expect(payload).toContain('public-marker')
  })

  it('redacts a credential-bearing URL in the page and in the Meta event', () => {
    go('/dashboard?code=liveauthcode123&plan=pro')
    const { payload, bodies } = capture(
      '<a href="https://hanzo.id/callback?code=anotherlivecode&state=st4te">continue</a>' +
        '<img src="https://cdn.example/i.png?access_token=tok3n">',
    )
    expect(payload).not.toContain('liveauthcode123')
    expect(payload).not.toContain('anotherlivecode')
    expect(payload).not.toContain('st4te')
    expect(payload).not.toContain('tok3n')
    expect(payload).toContain('[redacted]')
    // non-credential query params survive, so the URL still identifies the page
    expect(payload).toContain('plan=pro')

    const meta = bodies
      .flatMap((b) => b.events as Array<{ type: number; data: { href?: string } }>)
      .find((e) => e.type === 4)
    expect(meta?.data.href).toContain('/dashboard')
    expect(meta?.data.href).toContain('code=[redacted]')
  })

  it('applies the whole gate through the documented POST body', () => {
    const { bodies, replay } = capture('<input type="password" value="hunter2">')
    const body = bodies[0]
    expect(Object.keys(body)).toEqual(['sessionId', 'windowId', 'distinctId', 'events'])
    expect(body.sessionId).toBe(replay.sessionId)
    expect(body.windowId).toBe(replay.windowId)
    expect(body.distinctId).toBe(replay.distinctId)
    // raw rrweb events: a Meta then a FullSnapshot
    const types = (body.events as Array<{ type: number }>).map((e) => e.type)
    expect(types).toContain(4)
    expect(types).toContain(2)
  })
})

group('credential routes', () => {
  it('refuses to start on /callback', () => {
    const f = fakeRecorder()
    const s = spy()
    go('/callback?code=live')
    const replay = record({ ingestKey: KEY, recorder: f.recorder, transport: s.transport })
    expect(f.calls()).toBe(0) // rrweb is never even constructed
    expect(replay.recording).toBe(false)
    expect(s.sent).toHaveLength(0)
    expect(() => replay.stop()).not.toThrow()
  })

  it('refuses to start on /login/oauth/device and on a nested callback', () => {
    for (const p of ['/login/oauth/device', '/auth/callback', '/api/auth/callback']) {
      const f = fakeRecorder()
      go(p)
      expect(record({ ingestKey: KEY, recorder: f.recorder }).recording, p).toBe(false)
      expect(f.calls(), p).toBe(0)
    }
  })

  it('records normally everywhere else', () => {
    const f = fakeRecorder()
    go('/pricing')
    const replay = record({ ingestKey: KEY, recorder: f.recorder })
    expect(f.calls()).toBe(1)
    expect(replay.recording).toBe(true)
    replay.stop()
  })

  it('stops when an SPA routes ONTO a callback, dropping the event that carries it', () => {
    const f = fakeRecorder()
    const s = spy()
    const replay = record({
      ingestKey: KEY,
      recorder: f.recorder,
      transport: s.transport,
      batchSize: 1000,
    })
    f.emit(ev(1))
    expect(replay.recording).toBe(true)

    go('/auth/callback?code=live')
    f.emit(ev(2)) // the first event of the callback page
    expect(replay.recording).toBe(false)
    expect(f.stopped()).toBe(1)
    f.emit(ev(3)) // anything still in flight

    // the safe page is delivered; nothing from the callback page is
    const events = s.bodies().flatMap((b) => b.events as Array<{ timestamp: number }>)
    expect(events.map((e) => e.timestamp)).toEqual([1])
  })

  it('stops on the clock too, for a route change with nothing left to mutate', () => {
    vi.useFakeTimers()
    const f = fakeRecorder()
    const replay = record({ ingestKey: KEY, recorder: f.recorder, flushIntervalMs: 1000 })
    expect(replay.recording).toBe(true)
    go('/login/oauth/device')
    vi.advanceTimersByTime(1000)
    expect(replay.recording).toBe(false)
    expect(f.stopped()).toBe(1)
  })

  it('takes an extra refusal predicate from the app', () => {
    const f = fakeRecorder()
    go('/admin/keys')
    const replay = record({
      ingestKey: KEY,
      recorder: f.recorder,
      refuse: (p) => p.startsWith('/admin'),
    })
    expect(replay.recording).toBe(false)
    expect(f.calls()).toBe(0)
  })
})

group('the recording handle', () => {
  it('refuses to start without a publishable key, and says so', () => {
    const errs: unknown[] = []
    const f = fakeRecorder()
    const replay = record({ ingestKey: '', recorder: f.recorder, onError: (e) => errs.push(e) })
    expect(replay.recording).toBe(false)
    expect(f.calls()).toBe(0)
    expect(String(errs[0])).toContain('ingestKey')
  })

  it('carries the ids the batch is filed under', () => {
    const f = fakeRecorder()
    const replay = record({ ingestKey: KEY, recorder: f.recorder })
    expect(replay.sessionId).toMatch(/^[0-9a-f-]{36}$/)
    expect(replay.windowId).toMatch(/^[0-9a-f-]{36}$/)
    expect(replay.distinctId).toMatch(/^[0-9a-f-]{36}$/)
    expect(new Set([replay.sessionId, replay.windowId, replay.distinctId]).size).toBe(3)
    replay.stop()
  })

  it('accepts caller-supplied ids — a known user is not anonymous', () => {
    const f = fakeRecorder()
    const s = spy()
    const replay = record({
      ingestKey: KEY,
      distinctId: 'user_42',
      sessionId: 'sess_7',
      recorder: f.recorder,
      transport: s.transport,
    })
    f.emit(ev(1))
    replay.flush()
    expect(s.bodies()[0]).toMatchObject({ sessionId: 'sess_7', distinctId: 'user_42' })
  })

  it('shares @hanzo/event’s session, rather than minting a second one', () => {
    localStorage.setItem('hz_session', JSON.stringify({ id: 'from-event-client', last: Date.now() }))
    localStorage.setItem('hz_anon_id', 'anon-from-event-client')
    const f = fakeRecorder()
    const replay = record({ ingestKey: KEY, recorder: f.recorder })
    expect(replay.sessionId).toBe('from-event-client')
    expect(replay.distinctId).toBe('anon-from-event-client')
    replay.stop()
  })

  it('batches, then flushes on size — with the documented body', () => {
    const f = fakeRecorder()
    const s = spy()
    record({ ingestKey: KEY, recorder: f.recorder, transport: s.transport, batchSize: 3 })
    f.emit(ev(1))
    f.emit(ev(2))
    expect(s.sent).toHaveLength(0)
    f.emit(ev(3))
    expect(s.sent).toHaveLength(1)
    expect(s.sent[0].url).toBe('https://api.hanzo.ai/v1/replay')
    expect(s.sent[0].ingestKey).toBe(KEY)
    expect(s.sent[0].beacon).toBe(false)
    expect((s.bodies()[0].events as unknown[]).length).toBe(3)
  })

  it('flushes on the interval and beacons on pagehide', () => {
    vi.useFakeTimers()
    const f = fakeRecorder()
    const s = spy()
    record({
      ingestKey: KEY,
      recorder: f.recorder,
      transport: s.transport,
      batchSize: 1000,
      flushIntervalMs: 2000,
    })
    f.emit(ev(1))
    vi.advanceTimersByTime(2000)
    expect(s.sent).toHaveLength(1)
    expect(s.sent[0].beacon).toBe(false)

    f.emit(ev(2))
    window.dispatchEvent(new Event('pagehide'))
    expect(s.sent).toHaveLength(2)
    expect(s.sent[1].beacon).toBe(true)
  })

  it('stop() flushes the tail, is idempotent, and ends the recording once', () => {
    const f = fakeRecorder()
    const s = spy()
    const replay = record({ ingestKey: KEY, recorder: f.recorder, transport: s.transport, batchSize: 1000 })
    f.emit(ev(1))
    replay.stop()
    replay.stop()
    expect(replay.recording).toBe(false)
    expect(f.stopped()).toBe(1)
    expect(s.sent).toHaveLength(1)
    expect((s.bodies()[0].events as unknown[]).length).toBe(1)
  })

  it('points at a caller-supplied endpoint', () => {
    const f = fakeRecorder()
    const s = spy()
    const replay = record({
      ingestKey: KEY,
      endpoint: 'http://localhost:8080',
      recorder: f.recorder,
      transport: s.transport,
    })
    f.emit(ev(1))
    replay.flush()
    expect(s.sent[0].url).toBe('http://localhost:8080/v1/replay')
  })

  it('hands rrweb the privacy gate, not the caller’s idea of it', () => {
    const f = fakeRecorder()
    record({
      ingestKey: KEY,
      recorder: f.recorder,
      rrweb: { maskAllInputs: false, blockSelector: '.mine' },
    })
    const o = f.opts()
    expect(o.maskAllInputs).toBe(true)
    expect(o.blockSelector).toContain('[data-hz-private]')
    expect(o.blockSelector).toContain('input[type="password"]')
    expect(typeof o.emit).toBe('function')
  })

  it('never lets a recorder failure reach the app', () => {
    const errs: unknown[] = []
    const replay = record({
      ingestKey: KEY,
      recorder: () => {
        throw new Error('rrweb exploded')
      },
      onError: (e) => errs.push(e),
    })
    expect(replay.recording).toBe(false)
    expect(String(errs[0])).toContain('rrweb exploded')
  })
})
