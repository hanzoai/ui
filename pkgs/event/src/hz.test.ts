// hz.js is the no-build distribution — 300 lines of shipped client that no test
// had ever executed. It restates, by hand, what the bundled client imports, so the
// two can drift; this runs the real file against a minimal browser stub and reads
// the batch it actually posts.

import { describe, expect, it, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SRC = readFileSync(fileURLToPath(new URL('../hz.js', import.meta.url)), 'utf8')

/** The event plane's session-rollup admission gate, transcribed from its own SQL. */
const versionNibble = (id: string): bigint => (BigInt('0x' + id.replace(/-/g, '')) >> 76n) & 15n
const embeddedMs = (id: string): bigint => BigInt('0x' + id.replace(/-/g, '')) >> 80n

interface WireEvent {
  messageId: string
  sessionId: string
  anonymousId: string
  type: string
  event?: string
  library: string
  libraryVersion: string
}

/** Runs hz.js against a stub browser and returns everything it posted. */
function runSnippet(): { sent: WireEvent[]; api: { track(n: string): void; flush(): void } } {
  const sent: WireEvent[] = []
  const store = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
  }
  const g = globalThis as Record<string, unknown>
  g.location = { href: 'https://x.test/p?a=1', pathname: '/p', search: '?a=1', hostname: 'x.test', host: 'x.test' }
  g.document = {
    currentScript: { getAttribute: (a: string) => (a === 'data-product' ? 'test' : null) },
    referrer: '',
    addEventListener: () => {},
    documentElement: { scrollHeight: 1000 },
    visibilityState: 'visible',
    createElement: () => ({}),
    head: { appendChild: () => {} },
  }
  g.navigator = { doNotTrack: '0' }
  g.localStorage = store()
  g.sessionStorage = store()
  g.history = { pushState: () => {}, replaceState: () => {} }
  g.addEventListener = () => {}
  g.PerformanceObserver = undefined
  g.fetch = (_u: string, init: { body: string }) => {
    sent.push(...(JSON.parse(init.body).batch as WireEvent[]))
    return Promise.resolve()
  }
  g.window = g
  new Function(SRC)()
  return { sent, api: (g.window as { hanzo: { track(n: string): void; flush(): void } }).hanzo }
}

describe('hz.js', () => {
  let run: ReturnType<typeof runSnippet>
  beforeEach(() => {
    run = runSnippet()
  })

  it('mints session ids the plane admits', () => {
    run.api.track('checkout_started')
    run.api.flush()
    expect(run.sent.length).toBeGreaterThan(0)
    const before = Date.now()
    for (const ev of run.sent) {
      expect(versionNibble(ev.sessionId)).toBe(7n)
      expect(versionNibble(ev.messageId)).toBe(7n)
      expect(versionNibble(ev.anonymousId)).toBe(7n)
      // The embedded instant is the real mint time, not a constant.
      expect(Number(embeddedMs(ev.sessionId))).toBeGreaterThan(before - 60_000)
      expect(Number(embeddedMs(ev.sessionId))).toBeLessThanOrEqual(Date.now())
    }
  })

  it('holds one session id across every event it emits', () => {
    run.api.track('a')
    run.api.track('b')
    run.api.flush()
    const ids = new Set(run.sent.map((e) => e.sessionId))
    expect(ids.size).toBe(1)
    expect(new Set(run.sent.map((e) => e.messageId)).size).toBe(run.sent.length)
  })

  it('emits the auto pageview on load and stamps the library', () => {
    run.api.flush()
    const pv = run.sent.find((e) => e.type === 'pageview')
    expect(pv).toBeDefined()
    expect(pv!.library).toBe('hz.js')
    expect(pv!.libraryVersion).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
