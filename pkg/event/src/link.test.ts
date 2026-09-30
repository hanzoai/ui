// Cross-domain continuity: a link between Hanzo hosts carries the visitor, the
// destination adopts it before its first pageview and cleans the address bar.

import { describe, it, expect, vi, afterEach } from 'vitest'
import { linkUrl, readLink, stripLink, encodeFirstTouch } from './link'
import { keyFor, keyForPage } from './org'
import type { Attribution, Transport, WireEvent } from './types'

const AID = '01920000-0000-7000-8000-0000000000aa'
const SID = '01920000-0000-7000-8000-0000000000bb'
const LOCAL = '01920000-0000-7000-8000-0000000000cc'
const FT: Attribution = {
  utm: { source: 'x', medium: 'cpc', campaign: 'launch' },
  refCode: 'r1',
  referrer: 'https://t.co/abc',
  channel: 'paid',
}

const g = globalThis as Record<string, unknown>

function browser(href: string, storage: Record<string, string> = {}) {
  const url = new URL(href)
  const store = new Map(Object.entries(storage))
  const jar = new Map<string, string>()
  const replaced: string[] = []
  const location = {
    href: url.href,
    hostname: url.hostname,
    protocol: url.protocol,
    pathname: url.pathname,
    search: url.search,
  }
  g.window = {
    location,
    history: {
      state: null,
      replaceState: (_s: unknown, _t: string, next: string) => {
        replaced.push(next)
        const u = new URL(next, url)
        location.href = u.href
        location.search = u.search
      },
    },
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
    addEventListener: () => {},
  }
  g.document = {
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
    },
    set cookie(raw: string) {
      const kv = raw.split(';')[0]
      const eq = kv.indexOf('=')
      jar.set(kv.slice(0, eq).trim(), kv.slice(eq + 1))
    },
    referrer: 'https://hanzo.ai/',
    visibilityState: 'visible',
  }
  return { store, jar, replaced, location }
}

class Tx implements Transport {
  all: WireEvent[] = []
  send(_u: string, body: string) {
    try {
      this.all.push(...(JSON.parse(body) as { batch: WireEvent[] }).batch)
    } catch {
      /* not JSON */
    }
  }
}

const load = async () => {
  vi.resetModules()
  return await import('./core')
}

afterEach(() => {
  delete g.window
  delete g.document
})

describe('linkUrl', () => {
  const state = { anonId: AID, sessionId: SID, firstTouch: FT }

  it('appends id, session and first touch for Hanzo-owned hosts', () => {
    for (const host of ['hanzo.id', 'hanzo.app', 'hanzo.team', 'hanzo.bot', 'id.lux.network', 'zoo.ngo']) {
      const u = new URL(linkUrl(`https://${host}/login`, state, 'hanzo.ai'))
      expect(u.searchParams.get('hz_aid')).toBe(AID)
      expect(u.searchParams.get('hz_sid')).toBe(SID)
      expect(readLink(u.search).firstTouch).toEqual(FT)
    }
  })

  it('leaves foreign hosts and same-host links alone', () => {
    expect(linkUrl('https://example.com/x', state, 'hanzo.ai')).toBe('https://example.com/x')
    expect(linkUrl('https://hanzo.ai/x', state, 'hanzo.ai')).toBe('https://hanzo.ai/x')
    expect(linkUrl('mailto:z@hanzo.ai', state, 'hanzo.ai')).toBe('mailto:z@hanzo.ai')
    expect(linkUrl('https://evilhanzo.id/x', state, 'hanzo.ai')).toBe('https://evilhanzo.id/x')
  })

  it('keeps existing query and hash, and refuses a non-UUID id', () => {
    const out = linkUrl('https://hanzo.id/login/oauth/authorize?client_id=a&x=1#h', { anonId: 'nope' }, 'hanzo.ai')
    expect(out).toBe('https://hanzo.id/login/oauth/authorize?client_id=a&x=1#h')
    const ok = new URL(linkUrl('https://hanzo.id/a?client_id=a#h', state, 'hanzo.ai'))
    expect(ok.searchParams.get('client_id')).toBe('a')
    expect(ok.hash).toBe('#h')
  })

  it('round-trips first touch and rejects garbage', () => {
    expect(readLink('?hz_ft=' + encodeURIComponent(encodeFirstTouch(FT))).firstTouch).toEqual(FT)
    expect(readLink('?hz_ft=%5B1%5D&hz_aid=zzz').firstTouch).toBeUndefined()
    expect(readLink('?hz_aid=zzz').anonId).toBeUndefined()
  })

  it('stripLink removes only its own params', () => {
    expect(stripLink(`https://hanzo.id/a?hz_aid=${AID}&keep=1&hz_sid=${SID}#f`)).toBe('/a?keep=1#f')
    expect(stripLink('https://hanzo.id/a?keep=1')).toBeUndefined()
  })
})

describe('Analytics adopts a link on init', () => {
  const href = `https://hanzo.id/login?client_id=c&hz_aid=${AID}&hz_sid=${SID}&hz_ft=${encodeURIComponent(encodeFirstTouch(FT))}`

  it('first pageview carries the linked ids, first touch and a clean address bar', async () => {
    const b = browser(href, { 'iam-anon-id': LOCAL })
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 't', host: '', transport: tx })
    a.pageview()
    a.flush()
    const e = tx.all[0]
    expect(e.anonymousId).toBe(AID)
    expect(e.sessionId).toBe(SID)
    expect(e.channel).toBe('paid')
    expect(e.utm?.campaign).toBe('launch')
    expect(e.url).not.toContain('hz_aid')
    expect(b.replaced).toEqual(['/login?client_id=c'])
    expect(b.location.search).toBe('?client_id=c')
    expect(b.jar.get('iam-anon-id')).toBe(AID)
    expect(b.store.get('iam-anon-id')).toBe(AID)
  })

  it('an existing first touch is not overwritten by a link', async () => {
    browser(href, { hz_first_touch: JSON.stringify({ utm: { source: 'old' }, channel: 'organic' }) })
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 't', host: '', transport: tx })
    a.pageview()
    a.flush()
    expect(tx.all[0].utm?.source).toBe('old')
    expect(tx.all[0].anonymousId).toBe(AID)
  })

  it('a link with a bad id changes nothing but is still stripped', async () => {
    const b = browser('https://hanzo.id/x?hz_aid=evil', { 'iam-anon-id': LOCAL })
    const { Analytics } = await load()
    const tx = new Tx()
    new Analytics({ product: 't', host: '', transport: tx }).pageview()
    expect(b.replaced).toEqual(['/x'])
    expect(b.store.get('iam-anon-id')).toBe(LOCAL)
  })
})

describe('Analytics.link / authorize / identify', () => {
  it('link decorates an IAM authorize URL with the current visitor', async () => {
    browser('https://hanzo.ai/chat?utm_source=news', { 'iam-anon-id': LOCAL })
    const { Analytics } = await load()
    const a = new Analytics({ product: 't', host: '', transport: new Tx() })
    const u = new URL(a.link('https://hanzo.id/login/oauth/authorize?client_id=c&state=s'))
    expect(u.searchParams.get('client_id')).toBe('c')
    expect(u.searchParams.get('hz_aid')).toBe(LOCAL)
    expect(u.searchParams.get('hz_sid')).toMatch(/^[0-9a-f-]{36}$/)
    expect(readLink(u.search).firstTouch?.utm.source).toBe('news')
    expect(a.link('https://example.com/x')).toBe('https://example.com/x')
  })

  it('authorize decorates and flushes what is queued before unload', async () => {
    browser('https://hanzo.ai/chat', { 'iam-anon-id': LOCAL })
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 't', host: '', transport: tx, flushIntervalMs: 999999 })
    a.capture('chat_started')
    const out = a.authorize('https://hanzo.id/login/oauth/authorize?client_id=c')
    expect(out).toContain('hz_aid=' + LOCAL)
    expect(tx.all.map((e) => e.event)).toEqual(['chat_started'])
  })

  it('identify emits the anonymous id and the person id together', async () => {
    browser('https://hanzo.ai/', { 'iam-anon-id': LOCAL })
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 't', host: '', transport: tx })
    a.identify('person-1')
    a.flush()
    const e = tx.all[0]
    expect(e.type).toBe('identify')
    expect(e.anonymousId).toBe(LOCAL)
    expect(e.personId).toBe('person-1')
    expect(e.distinctId).toBe('person-1')
  })
})

describe('one visitor across the journey, each site its own project', () => {
  it('www.hanzo.ai is hanzo.ai; every site owns a key; a runtime keyring stays per org', () => {
    const k = keyFor('hanzo.ai')
    expect(k).toBeTruthy()
    expect(keyFor('www.hanzo.ai')).toBe(k)
    for (const h of ['hanzo.id', 'hanzo.app', 'hanzo.team', 'hanzo.bot']) expect(keyFor(h)).not.toBe(k)
    const ring = { hanzo: 'pk-runtime' }
    expect(keyFor('hanzo.id', ring)).toBe(keyFor('hanzo.ai', ring))
  })

  it('keyForPage on either host names the same project', () => {
    browser('https://hanzo.id/login')
    const id = keyForPage()
    browser('https://hanzo.ai/')
    expect(keyForPage()).toBe(id)
  })
})
