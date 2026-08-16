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

/** One recorded transmission: which transport carried it, where, under what headers
 *  and — the fact that decides whether a cross-origin unload beacon is sent at all
 *  — the content type its body was labelled with. */
interface Post {
  via: 'beacon' | 'fetch'
  url: string
  headers: Record<string, string>
  contentType: string
  batch: WireEvent[]
}

// The three CORS-safelisted request content types. A POST whose body carries one
// is a SIMPLE request and goes immediately; anything else is PREFLIGHTED, and an
// unloading document never gets the preflight's second round trip. This tag runs
// on a customer's own domain, so its beacon is always cross-origin.
const CORS_SAFELISTED = new Set([
  'text/plain',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
])

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
  fire: (type: string) => void
  hide: () => void
} {
  const posts: Post[] = []
  const listeners = new Map<string, (() => void)[]>()
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
      ? (url: string, blob: { body: string; type: string }) => {
          posts.push({
            via: 'beacon',
            url,
            headers: {},
            contentType: blob.type,
            batch: JSON.parse(blob.body).batch,
          })
          return true
        }
      : undefined,
  })
  define(
    'Blob',
    class {
      body: string
      type: string
      constructor(parts: string[], opts?: { type?: string }) {
        this.body = parts.join('')
        this.type = opts?.type ?? ''
      }
    },
  )
  define('localStorage', store(local))
  define('sessionStorage', store(new Map()))
  define('history', { pushState: () => {}, replaceState: () => {} })
  // Listeners are kept, not discarded: the unload flush IS a listener, so a stub
  // that drops them leaves the only path the drop-off signal travels unexecuted.
  define('addEventListener', (type: string, fn: () => void) => {
    const seen = listeners.get(type)
    if (seen) seen.push(fn)
    else listeners.set(type, [fn])
  })
  define('PerformanceObserver', undefined)
  define('hzDNT', undefined)
  define('doNotTrack', undefined)
  // The stub `window` IS globalThis, so a public API installed by an earlier run
  // would still be there — and "it refused" would be indistinguishable from
  // "the previous run's API answered".
  define('hanzo', undefined)
  define('fetch', (url: string, init: { body: string; headers: Record<string, string> }) => {
    posts.push({
      via: 'fetch',
      url,
      headers: init.headers,
      contentType: init.headers['content-type'] ?? '',
      batch: JSON.parse(init.body).batch,
    })
    return Promise.resolve()
  })
  define('window', g)

  new Function(SRC)()
  /** Raise an event the page would raise, so its listeners actually run. */
  const fire = (type: string) => {
    for (const fn of listeners.get(type) ?? []) fn()
  }
  /** Hide the document, as a browser does before it takes one away. */
  const hide = () => {
    ;(g.document as { visibilityState: string }).visibilityState = 'hidden'
    fire('visibilitychange')
  }
  return { posts, api: (g.window as { hanzo?: Api }).hanzo, local, jar, fire, hide }
}

/** Every event across every transmission, in order. */
const sentOf = (r: { posts: Post[] }): WireEvent[] => r.posts.flatMap((p) => p.batch)

describe('hz.js', () => {
  let run: ReturnType<typeof runSnippet>
  beforeEach(() => {
    run = runSnippet()
  })

  // A visitor who leaves mid-funnel is the drop-off signal, and hz.js only gets
  // to report it from a teardown listener. Neither signal fires in every browser
  // on every path, so the tag listens for both.
  it('flushes what is queued when the tab is hidden', () => {
    run.api!.track('plan_clicked')
    run.hide()
    expect(sentOf(run).map((e) => e.event)).toContain('plan_clicked')
  })

  it('flushes what is queued on pagehide, which visibilitychange need not precede', () => {
    run.api!.track('checkout_started')
    run.fire('pagehide')
    expect(sentOf(run).map((e) => e.event)).toContain('checkout_started')
  })

  it('sends nothing a second time when both teardown signals arrive', () => {
    run.api!.track('plan_clicked')
    run.hide()
    run.fire('pagehide')
    const clicks = sentOf(run).filter((e) => e.event === 'plan_clicked')
    expect(clicks).toHaveLength(1)
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

  // The fetch presents it on the SAME carrier the beacon does, and stays a CORS
  // simple request doing so. This file's whole job is to run on a customer's own
  // page, where every send is cross-origin: an Authorization header or a JSON
  // content type would preflight the POST, and an origin that does not pass the
  // preflight loses the batch that splice has already emptied. A simple request is
  // sent from any origin — the browser asks permission to READ a cross-origin
  // response, never to send one, and nothing here reads it.
  it('presents the publishable key on the query, as a simple request', () => {
    const r = runSnippet({ attrs: { 'data-publishable-key': 'pk-abc123' } })
    r.api!.flush()
    const post = r.posts.at(-1)!
    expect(post.via).toBe('fetch')
    expect(post.url).toBe('https://api.hanzo.ai/v1/event?ingest_key=pk-abc123')
    expect(post.headers.authorization).toBeUndefined()
    expect(post.headers['content-type']).toBe('text/plain')
    // Content-Type is safelisted only for three values; every other header is
    // outside the safelist by construction, so the count is the check.
    expect(Object.keys(post.headers)).toEqual(['content-type'])
  })

  it('still reads the retiring data-ingest-key, on a headerless beacon', () => {
    const r = runSnippet({ attrs: { 'data-ingest-key': 'pk-abc123' }, beacon: true })
    r.api!.flush()
    const post = r.posts.at(-1)!
    expect(post.via).toBe('beacon')
    expect(post.url).toBe('https://api.hanzo.ai/v1/event?ingest_key=pk-abc123')
  })

  it('labels the beacon body a CORS-simple type, so the unload POST is sent', () => {
    // The tag is installed on a customer's own domain, so every send here is
    // cross-origin. A non-safelisted body type preflights, and an unloading
    // document gets no second round trip — the batch would simply never leave.
    // The credential is in the query for the same reason: a beacon sets no
    // headers, and an Authorization header preflights whatever the type is.
    const r = runSnippet({ attrs: { 'data-ingest-key': 'pk-abc123' }, beacon: true })
    r.api!.flush()
    const post = r.posts.at(-1)!
    expect(post.via).toBe('beacon')
    expect(CORS_SAFELISTED.has(post.contentType)).toBe(true)
  })

  it('sends no credential when no key is declared — no baked literal', () => {
    // The key is the surface's own, stamped into the tag by its deploy from KMS;
    // a bare tag carries nothing, so it is honestly keyless rather than borrowing
    // a hardcoded org credential.
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
