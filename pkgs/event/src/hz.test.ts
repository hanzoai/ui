// hz.js is the no-build distribution — 300 lines of shipped client that no test
// had ever executed. It restates, by hand, what the bundled client imports, so the
// two can drift; this runs the real file against a minimal browser stub and reads
// what it actually posts — batch, URL and headers, because the credential is not
// in the body and a test that reads only the batch cannot see it.

import { describe, expect, it, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SRC = readFileSync(fileURLToPath(new URL('../hz.js', import.meta.url)), 'utf8')
const PKG = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as { version: string }

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

/** One recorded transmission: which transport carried it, where, under what headers. */
interface Post {
  via: 'beacon' | 'fetch'
  url: string
  headers: Record<string, string>
  batch: WireEvent[]
}

interface StubOptions {
  /** data-* attributes on the <script> tag. */
  attrs?: Record<string, string>
  /** navigator fields — doNotTrack, globalPrivacyControl, msDoNotTrack. */
  navigator?: Record<string, unknown>
  /** Seed localStorage (e.g. an explicit hz_consent choice). */
  storage?: Record<string, string>
  /** The cookie jar. Pass one in to model a browser that already carries an id —
   *  from another *.hanzo.ai surface, or from the npm client on this same page. */
  jar?: Map<string, string>
  /** Let navigator.sendBeacon succeed, so the beacon path is the one measured. */
  beacon?: boolean
}

type Api = { track(n: string, p?: unknown): void; flush(): void }

/** Runs hz.js against a stub browser and returns everything it posted.
 *
 *  Globals are DEFINED, not assigned: Node ≥ 21 ships a real `navigator` whose
 *  descriptor is an accessor with no setter, so the plain assignment this
 *  harness used threw — and every hz.js test failed on a current runtime,
 *  leaving the shipped file with no executed coverage again. */
function runSnippet(opts: StubOptions = {}): {
  posts: Post[]
  api: Api | undefined
  local: Map<string, string>
  jar: Map<string, string>
} {
  const posts: Post[] = []
  const local = new Map<string, string>(Object.entries(opts.storage ?? {}))
  const jar = opts.jar ?? new Map<string, string>()
  const store = (m: Map<string, string>) => ({
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  })
  const attrs: Record<string, string> = { 'data-product': 'test', ...opts.attrs }
  const g = globalThis as unknown as Record<string, unknown>
  const define = (name: string, value: unknown) =>
    Object.defineProperty(g, name, { value, configurable: true, writable: true })

  define('location', {
    href: 'https://x.test/p?a=1',
    pathname: '/p',
    search: '?a=1',
    hostname: 'x.test',
    host: 'x.test',
  })
  define('document', {
    currentScript: { getAttribute: (a: string) => attrs[a] ?? null },
    // A real jar: the anonymous id is a cookie now, so a stub with no `cookie`
    // would leave the whole identity chain unexecuted by these tests.
    get cookie(): string {
      return [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
    },
    set cookie(raw: string) {
      const first = raw.split(';')[0]
      const eq = first.indexOf('=')
      if (eq > 0) jar.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim())
    },
    referrer: '',
    addEventListener: () => {},
    documentElement: { scrollHeight: 1000 },
    visibilityState: 'visible',
    createElement: () => ({}),
    head: { appendChild: () => {} },
  })
  define('navigator', {
    doNotTrack: '0',
    ...opts.navigator,
    sendBeacon: opts.beacon
      ? (url: string, blob: { body: string }) => {
          posts.push({ via: 'beacon', url, headers: {}, batch: JSON.parse(blob.body).batch })
          return true
        }
      : undefined,
  })
  define(
    'Blob',
    class {
      body: string
      constructor(parts: string[]) {
        this.body = parts.join('')
      }
    },
  )
  define('localStorage', store(local))
  define('sessionStorage', store(new Map()))
  define('history', { pushState: () => {}, replaceState: () => {} })
  define('addEventListener', () => {})
  define('PerformanceObserver', undefined)
  define('hzDNT', undefined)
  define('doNotTrack', undefined)
  // The stub `window` IS globalThis, so a public API installed by an earlier run
  // would still be there — and "it refused" would be indistinguishable from
  // "the previous run's API answered".
  define('hanzo', undefined)
  define('fetch', (url: string, init: { body: string; headers: Record<string, string> }) => {
    posts.push({ via: 'fetch', url, headers: init.headers, batch: JSON.parse(init.body).batch })
    return Promise.resolve()
  })
  define('window', g)

  new Function(SRC)()
  return { posts, api: (g.window as { hanzo?: Api }).hanzo, local, jar }
}

/** Every event across every transmission, in order. */
const sentOf = (r: { posts: Post[] }): WireEvent[] => r.posts.flatMap((p) => p.batch)

describe('hz.js', () => {
  let run: ReturnType<typeof runSnippet>
  beforeEach(() => {
    run = runSnippet()
  })

  it('mints session ids the plane admits', () => {
    run.api!.track('checkout_started')
    run.api!.flush()
    const sent = sentOf(run)
    expect(sent.length).toBeGreaterThan(0)
    const before = Date.now()
    for (const ev of sent) {
      expect(versionNibble(ev.sessionId)).toBe(7n)
      expect(versionNibble(ev.messageId)).toBe(7n)
      expect(versionNibble(ev.anonymousId)).toBe(7n)
      // The embedded instant is the real mint time, not a constant.
      expect(Number(embeddedMs(ev.sessionId))).toBeGreaterThan(before - 60_000)
      expect(Number(embeddedMs(ev.sessionId))).toBeLessThanOrEqual(Date.now())
    }
  })

  it('holds one session id across every event it emits', () => {
    run.api!.track('a')
    run.api!.track('b')
    run.api!.flush()
    const sent = sentOf(run)
    expect(new Set(sent.map((e) => e.sessionId)).size).toBe(1)
    expect(new Set(sent.map((e) => e.messageId)).size).toBe(sent.length)
  })

  it('emits the auto pageview on load and stamps the library', () => {
    run.api!.flush()
    const pv = sentOf(run).find((e) => e.type === 'pageview')
    expect(pv).toBeDefined()
    expect(pv!.library).toBe('hz.js')
    // The stamped version IS the package version. It had drifted to 0.3.9 against
    // a published 0.3.11, so every static-site row in the warehouse was dated to a
    // release three patches old — including the ones that changed what it sends.
    expect(pv!.libraryVersion).toBe(PKG.version)
  })

  // ── identity ──────────────────────────────────────────────────────────────
  // This file used to mint into `hz_id`, a key nothing else read or wrote, so a
  // page carrying both this tag and the npm client sent two anonymous ids for one
  // visitor — and every surface counted them as two people. It now runs the same
  // chain, from the same file, against the same key.

  const SEEDED = '01920000-0000-7000-8000-0000000000cc'
  const LEGACY = '01920000-0000-7000-8000-0000000000dd'

  it('is the same person as every other Hanzo client on the browser', () => {
    // The cookie the npm client (or another *.hanzo.ai surface) already wrote.
    const r = runSnippet({ jar: new Map([['hz_anon_id', SEEDED]]) })
    r.api!.track('checkout_started')
    r.api!.flush()
    const sent = sentOf(r)
    expect(sent.length).toBeGreaterThan(0)
    for (const ev of sent) expect(ev.anonymousId).toBe(SEEDED)
  })

  it('adopts the `hz_id` it used to mint rather than making a stranger', () => {
    // Every browser that has ever loaded this tag holds one of these. Minting
    // over it would detach a returning visitor from their own history.
    const r = runSnippet({ storage: { hz_id: LEGACY } })
    r.api!.flush()
    for (const ev of sentOf(r)) expect(ev.anonymousId).toBe(LEGACY)
    expect(r.jar.get('hz_anon_id')).toBe(LEGACY) // carried onto the shared key
    expect(r.local.get('hz_anon_id')).toBe(LEGACY)
  })

  it('writes the one key, in the durable place, and no longer mints its own', () => {
    const r = runSnippet()
    r.api!.flush()
    const id = sentOf(r)[0].anonymousId
    expect(r.jar.get('hz_anon_id')).toBe(id) // the cookie outlives the ORIGIN
    expect(r.local.get('hz_anon_id')).toBe(id)
    expect(r.local.has('hz_id')).toBe(false)
  })

  // ── the publishable key ───────────────────────────────────────────────────
  // Through 0.3.11 this file could present none at all: no header, no query. A
  // keyed static surface therefore sent UNATTRIBUTED writes, which the door
  // refuses — silently, because nothing here reads the response.

  it('presents the ingest key as a bearer on fetch', () => {
    const r = runSnippet({ attrs: { 'data-ingest-key': 'pk-abc123' } })
    r.api!.flush()
    const post = r.posts.at(-1)!
    expect(post.via).toBe('fetch')
    expect(post.headers.authorization).toBe('Bearer pk-abc123')
    expect(post.url).toBe('https://api.hanzo.ai/v1/event')
  })

  it('presents the ingest key in the query on a headerless beacon', () => {
    const r = runSnippet({ attrs: { 'data-ingest-key': 'pk-abc123' }, beacon: true })
    r.api!.flush()
    const post = r.posts.at(-1)!
    expect(post.via).toBe('beacon')
    expect(post.url).toBe('https://api.hanzo.ai/v1/event?ingest_key=pk-abc123')
  })

  it('sends no credential when no key is declared', () => {
    run.api!.flush()
    const post = run.posts.at(-1)!
    expect(post.headers.authorization).toBeUndefined()
    expect(post.url).not.toContain('ingest_key')
  })

  // ── consent ───────────────────────────────────────────────────────────────

  it('refuses under Global Privacy Control', () => {
    const r = runSnippet({ navigator: { globalPrivacyControl: true } })
    expect(r.api).toBeUndefined()
    expect(r.posts).toEqual([])
  })

  it('refuses under Do Not Track, in each of its spellings', () => {
    for (const nav of [{ doNotTrack: '1' }, { doNotTrack: 'yes' }, { msDoNotTrack: '1' }]) {
      expect(runSnippet({ navigator: nav }).api).toBeUndefined()
    }
  })

  it('refuses on a stored denial', () => {
    expect(runSnippet({ storage: { hz_consent: 'denied' } }).api).toBeUndefined()
  })

  it('an explicit grant outranks the browser signal', () => {
    const r = runSnippet({ navigator: { doNotTrack: '1' }, storage: { hz_consent: 'granted' } })
    expect(r.api).toBeDefined()
    r.api!.flush()
    expect(sentOf(r).length).toBeGreaterThan(0)
  })
})
