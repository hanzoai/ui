// The anonymous id is the join key for the whole pre-signup journey, and it used
// to live in localStorage — which is ORIGIN-scoped, so docs, cloud and console
// each minted their own for the same person (463 anonymous identities carried 545
// events in a week). It is now a cookie on the registrable domain. These tests
// pin the two properties that migration turns on: that one jar yields ONE id
// across surfaces, and that an existing localStorage id is ADOPTED rather than
// minted over — minting there resets every returning visitor.

import { describe, it, expect, vi } from 'vitest'

const ANON = 'hz_anon_id'
const LEGACY = '01920000-0000-7000-8000-0000000000aa'
const OTHER = '01920000-0000-7000-8000-0000000000bb'

const g = globalThis as Record<string, unknown>

interface Browser {
  /** Every raw `document.cookie = …` write, so attributes can be asserted. */
  writes: string[]
  /** name → raw cookie value, shared between surfaces to model one browser. */
  jar: Map<string, string>
  store: Map<string, string> | undefined
  restore: () => void
}

/** A minimal browser. `jar` can be passed in to model two *.hanzo.ai surfaces
 *  reading the same cookie store, which is the whole point of the change. */
function browser(
  opts: {
    href?: string
    jar?: Map<string, string>
    storage?: Record<string, string>
    noStorage?: boolean
    refuseCookies?: boolean
    noDocument?: boolean
  } = {},
): Browser {
  const had = { window: 'window' in g, document: 'document' in g }
  const prev = { window: g.window, document: g.document }
  const jar = opts.jar ?? new Map<string, string>()
  const writes: string[] = []
  const store = opts.noStorage ? undefined : new Map(Object.entries(opts.storage ?? {}))
  const url = new URL(opts.href ?? 'https://docs.hanzo.ai/guide')

  g.window = {
    location: {
      href: url.href,
      hostname: url.hostname,
      protocol: url.protocol,
      pathname: url.pathname,
      search: url.search,
    },
    localStorage: store && {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
    addEventListener: () => {},
  }
  if (opts.noDocument) {
    delete g.document
  } else {
    g.document = {
      get cookie(): string {
        return [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
      },
      set cookie(raw: string) {
        writes.push(raw)
        if (opts.refuseCookies) return // a jar that accepts the write and drops it
        const eq = raw.split(';')[0].indexOf('=')
        if (eq < 0) return
        jar.set(raw.slice(0, eq).trim(), raw.split(';')[0].slice(eq + 1).trim())
      },
      referrer: '',
      visibilityState: 'visible',
    }
  }

  return {
    writes,
    jar,
    store,
    restore: () => {
      if (had.window) g.window = prev.window
      else delete g.window
      if (had.document) g.document = prev.document
      else delete g.document
    },
  }
}

/** A fresh module instance — the in-memory fallback is module state, and each
 *  surface in these tests is a separately loaded copy of the client. */
const load = async () => {
  vi.resetModules()
  return await import('./storage')
}

const isUuidV7 = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)

describe('anonId', () => {
  it('adopts an existing localStorage id into the cookie instead of minting', async () => {
    // THE migration invariant. Minting here would hand every returning visitor a
    // new identity and detach them from their own history.
    const b = browser({ storage: { [ANON]: LEGACY } })
    try {
      const { anonId } = await load()
      expect(anonId()).toBe(LEGACY)
      expect(b.jar.get(ANON)).toBe(LEGACY)
      expect(b.store!.get(ANON)).toBe(LEGACY)
    } finally {
      b.restore()
    }
  })

  it('lets the cookie win over a divergent origin-local id', async () => {
    // docs already minted its own before the migration; the shared cookie is now
    // the source of truth and localStorage converges onto it.
    const b = browser({ jar: new Map([[ANON, OTHER]]), storage: { [ANON]: LEGACY } })
    try {
      const { anonId } = await load()
      expect(anonId()).toBe(OTHER)
      expect(b.store!.get(ANON)).toBe(OTHER)
    } finally {
      b.restore()
    }
  })

  it('mints a v7 id when neither store holds one, and writes both', async () => {
    const b = browser()
    try {
      const { anonId } = await load()
      const id = anonId()!
      expect(isUuidV7(id)).toBe(true)
      expect(b.jar.get(ANON)).toBe(id)
      expect(b.store!.get(ANON)).toBe(id)
      expect(anonId()).toBe(id) // stable across calls
    } finally {
      b.restore()
    }
  })

  it('is the SAME id on a second *.hanzo.ai surface sharing the jar', async () => {
    // The goal: one visitor is one person from marketing through checkout.
    const shared = new Map<string, string>()
    const docs = browser({ href: 'https://docs.hanzo.ai/guide', jar: shared })
    let first: string
    try {
      first = (await load()).anonId()!
    } finally {
      docs.restore()
    }
    // A different origin: its own empty localStorage, the same cookie jar.
    const cloud = browser({ href: 'https://cloud.hanzo.ai/', jar: shared })
    try {
      expect((await load()).anonId()).toBe(first)
    } finally {
      cloud.restore()
    }
  })

  it('returns undefined during SSR rather than minting a server-side id', async () => {
    const had = { window: 'window' in g, document: 'document' in g }
    const prev = { window: g.window, document: g.document }
    delete g.window
    delete g.document
    try {
      const { anonId } = await load()
      expect(anonId()).toBeUndefined()
    } finally {
      if (had.window) g.window = prev.window
      if (had.document) g.document = prev.document
    }
  })

  it('scopes the cookie to the registrable domain, secure and long-lived', async () => {
    const b = browser({ href: 'https://cloud.hanzo.ai/billing' })
    try {
      const { anonId } = await load()
      anonId()
      const w = b.writes[0]
      expect(w).toContain('Domain=hanzo.ai')
      expect(w).toContain('Path=/')
      expect(w).toContain('SameSite=Lax')
      expect(w).toContain('Secure')
      expect(w).toContain(`Max-Age=${2 * 365 * 24 * 60 * 60}`)
    } finally {
      b.restore()
    }
  })

  it('omits Domain and Secure off hanzo.ai, where both would drop the cookie', async () => {
    const b = browser({ href: 'http://localhost:3000/' })
    try {
      const { anonId } = await load()
      const id = anonId()!
      expect(b.writes[0]).not.toContain('Domain=')
      expect(b.writes[0]).not.toContain('Secure')
      expect(b.jar.get(ANON)).toBe(id) // still durable, just host-only
    } finally {
      b.restore()
    }
  })

  it('falls back to localStorage when cookies are refused', async () => {
    const b = browser({ refuseCookies: true, storage: { [ANON]: LEGACY } })
    try {
      const { anonId } = await load()
      expect(anonId()).toBe(LEGACY)
      expect(anonId()).toBe(LEGACY)
      expect(b.jar.size).toBe(0)
    } finally {
      b.restore()
    }
  })

  it('holds one id in memory when both cookies and localStorage are refused', async () => {
    const b = browser({ refuseCookies: true, noStorage: true })
    try {
      const { anonId } = await load()
      const id = anonId()!
      expect(isUuidV7(id)).toBe(true)
      expect(anonId()).toBe(id) // one identity per page load, not one per event
    } finally {
      b.restore()
    }
  })

  it('survives a browser with no document at all', async () => {
    const b = browser({ noDocument: true, storage: { [ANON]: LEGACY } })
    try {
      const { anonId } = await load()
      expect(anonId()).toBe(LEGACY)
    } finally {
      b.restore()
    }
  })
})

describe('sessionId', () => {
  // Deliberately unchanged by the anon migration: a session is origin-local and
  // rotates on a 30-minute idle window.
  it('stays in localStorage and rotates after the idle window', async () => {
    const b = browser()
    try {
      const { sessionId } = await load()
      const t0 = Date.now()
      const a = sessionId(t0)
      // The window runs from the LAST call, not from the session's start.
      expect(sessionId(t0 + 60_000)).toBe(a)
      expect(sessionId(t0 + 60_000 + 31 * 60_000)).not.toBe(a)
      expect(b.jar.has('hz_session')).toBe(false)
    } finally {
      b.restore()
    }
  })
})
