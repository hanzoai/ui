// First-party consent & server-hosted tag bridge tests for @hanzo/event.
// Verifies that open-source @hanzo/event never embeds third-party ad network
// scripts or hardcoded pixel IDs, and talks exclusively to first-party Hanzo
// Analytics / Cloud endpoints.

import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const g = globalThis as Record<string, unknown>
const original = {
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  Intl: Object.getOwnPropertyDescriptor(globalThis, 'Intl'),
}
const put = (k: string, value: unknown) =>
  Object.defineProperty(globalThis, k, { value, configurable: true, writable: true })

interface ScriptEl {
  src: string
  async?: boolean
  attrs: Record<string, string>
  setAttribute: (k: string, v: string) => void
  onload?: () => void
}

function browser(zone: string, jar = new Map<string, string>()) {
  const scripts: ScriptEl[] = []
  const listeners = new Map<string, Array<() => void>>()
  const requests: Array<{ url: string; init?: RequestInit }> = []
  put('navigator', { globalPrivacyControl: false, userAgent: 'UA' })
  put('Intl', { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: zone }) }) })
  g.Event = class {
    constructor(public type: string) {}
  }
  g.window = {
    location: { hostname: 'hanzo.ai', protocol: 'https:', search: '', href: 'https://hanzo.ai/' },
    dispatchEvent: (e: { type: string }) => listeners.get(e.type)?.forEach((f) => f()),
    addEventListener: (t: string, f: () => void) => listeners.set(t, [...(listeners.get(t) ?? []), f]),
    removeEventListener: () => undefined,
  }
  g.addEventListener = (g.window as { addEventListener: unknown }).addEventListener
  g.removeEventListener = () => undefined
  g.document = {
    visibilityState: 'visible',
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')
    },
    set cookie(line: string) {
      const [pair] = line.split(';')
      const i = pair.indexOf('=')
      const k = pair.slice(0, i)
      if (line.includes('Max-Age=0')) jar.delete(k)
      else jar.set(k, decodeURIComponent(pair.slice(i + 1)))
    },
    createElement: () => {
      const attrs: Record<string, string> = {}
      return {
        src: '',
        attrs,
        setAttribute: (k: string, v: string) => {
          attrs[k] = v
        },
      }
    },
    head: {
      appendChild: (s: ScriptEl) => {
        scripts.push(s)
        setTimeout(() => s.onload?.(), 0)
      },
    },
  }
  put('fetch', async (url: string, init?: RequestInit) => {
    requests.push({ url, init })
    return { ok: true, json: async () => ({ tags: [] }) }
  })
  let n = 0
  put('crypto', { randomUUID: () => `id-${++n}` })
  return { jar, scripts, requests }
}

beforeEach(() => vi.resetModules())
afterEach(() => {
  for (const k of ['window', 'document', 'Event', 'addEventListener', 'removeEventListener', 'fetch', 'crypto']) {
    delete g[k]
  }
  for (const [k, d] of Object.entries(original)) if (d) Object.defineProperty(globalThis, k, d)
})

const tick = () => new Promise((r) => setTimeout(r, 10))
const accepted = () =>
  new Map([
    ['__Host-hz_consent', 'analytics,marketing,ads'],
    ['__Host-hz_consent_v', '2'],
  ])

describe('OSS @hanzo/event contains zero ad-pixel SDKs or hardcoded pixel IDs', () => {
  it('ships no third-party ad network URLs, globals, or Hanzo pixel IDs in source', () => {
    for (const file of ['tags.ts', 'org.ts', 'index.ts', 'touch.ts']) {
      const src = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')
      for (const forbidden of [
        'oaiq',
        'bzrcdn.openai.com',
        'TXKHZduRxZZGp4B1ysfiwm',
        'HANZO_OPENAI_PIXEL_ID',
        'fbevents.js',
        'connect.facebook.net',
        'snap.licdn.com',
        'static.ads-twitter.com',
        'analytics.tiktok.com',
        'redditstatic.com',
        'googletagmanager.com',
        '1790308611893001',
        '10406532',
      ]) {
        expect(src, `${file} must not contain ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  it('does not export HANZO_OPENAI_PIXEL_ID', async () => {
    const mod = (await import('./index')) as Record<string, unknown>
    expect(mod.HANZO_OPENAI_PIXEL_ID).toBeUndefined()
  })

  it('loads nothing when /v1/project/tags returns an empty tag list', async () => {
    const b = browser('America/New_York', accepted())
    const { startTags } = await import('./index')
    startTags({ base: 'https://analytics.hanzo.ai', key: 'pk-test' })
    await tick()
    expect(b.requests[0].url).toBe('https://analytics.hanzo.ai/v1/project/tags?key=pk-test&host=hanzo.ai')
    expect(b.scripts).toEqual([])
  })
})

describe('first-party server-managed tag bridge & consent gating', () => {
  it('loads only the first-party server tag script when server tags are configured for a person', async () => {
    const b = browser('America/New_York', accepted())
    put('fetch', async (url: string, init?: RequestInit) => {
      b.requests.push({ url, init })
      return {
        ok: true,
        json: async () => ({
          tags: [{ platform: 'analytics', type: 'ga', id: 'server-configured' }],
          consent: { region: 'US-CA', mode: 'us_privacy', version: 3, floor: 2, refused: false },
          audience: 'person',
        }),
      }
    })
    const { startTags, tagsReady } = await import('./index')
    startTags({ base: 'https://analytics.hanzo.ai', key: 'pk-site' })
    await tagsReady(500)
    await tick()

    expect(b.scripts.map((s) => s.src)).toEqual(['https://analytics.hanzo.ai/v1/event/tag.js'])
    expect(b.scripts[0].attrs).toEqual({
      'data-key': 'pk-site',
      'data-tags-only': '1',
    })
  })

  it('loads nothing under GPC/DNT refusal or bot classification', async () => {
    const b = browser('America/New_York', accepted())
    put('fetch', async (url: string, init?: RequestInit) => {
      b.requests.push({ url, init })
      return {
        ok: true,
        json: async () => ({
          tags: [{ platform: 'analytics', type: 'ga', id: 'server-configured' }],
          consent: { region: 'US-CA', mode: 'us_privacy', version: 3, floor: 2, refused: true },
          audience: 'person',
        }),
      }
    })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-site' })
    await tick()
    expect(b.scripts).toEqual([])

    vi.resetModules()
    const botBrowser = browser('America/New_York', accepted())
    put('fetch', async (url: string, init?: RequestInit) => {
      botBrowser.requests.push({ url, init })
      return {
        ok: true,
        json: async () => ({
          tags: [{ platform: 'analytics', type: 'ga', id: 'server-configured' }],
          audience: 'bot',
        }),
      }
    })
    const mod2 = await import('./index')
    mod2.startTags({ key: 'pk-site' })
    await tick()
    expect(botBrowser.scripts).toEqual([])
  })

  it('retries without Authorization header if bearer preflight fails', async () => {
    const b = browser('America/New_York', accepted())
    let callCount = 0
    put('fetch', async (url: string, init?: RequestInit) => {
      callCount++
      b.requests.push({ url, init })
      if (callCount === 1) throw new TypeError('CORS preflight refused')
      return { ok: true, json: async () => ({ tags: [] }) }
    })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-site', token: () => 'jwt-token' })
    await tick()
    expect(b.requests.length).toBe(2)
    expect(b.requests[0].init?.headers).toEqual({ Authorization: 'Bearer jwt-token' })
    expect(b.requests[1].init).toBeUndefined()
  })

  it('waits for consent sheet to close before reloading on category withdrawal', async () => {
    const b = browser('America/New_York', accepted())
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    put('fetch', async (url: string, init?: RequestInit) => {
      b.requests.push({ url, init })
      return {
        ok: true,
        json: async () => ({
          tags: [{ platform: 'analytics', type: 'ga', id: 'server-configured' }],
          consent: { region: 'US-CA', mode: 'us_privacy', version: 3, floor: 2, refused: false },
          audience: 'person',
        }),
      }
    })
    const { startTags, consentSheet, saveConsent } = await import('./index')
    startTags({ key: 'pk-site' })
    await tick()

    consentSheet(true)
    saveConsent({ analytics: true, marketing: false, ads: false })
    await tick()
    expect(reload).not.toHaveBeenCalled()

    consentSheet(false)
    await tick()
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

describe('track, mirror, reach, and visit', () => {
  it('captures first-party stream events and bridges to __hanzoTags when registered by server tag.js', async () => {
    const b = browser('America/New_York', accepted())
    ;(g.window as { location: Record<string, unknown> }).location.search = '?gclid=G123'
    const mirrored: Array<{ name: string; params: Record<string, unknown>; id: string; to?: string }> = []
    ;(g.window as Record<string, unknown>).__hanzoTags = {
      reach: () => 'ga',
      mirror: (name: string, params: Record<string, unknown>, id: string, to?: string) =>
        mirrored.push({ name, params, id, to }),
    }
    const { startTags, track, visit } = await import('./index')
    startTags({ key: 'pk-site' })
    await tick()

    const captured: Array<{ name: string; props: Record<string, unknown> }> = []
    const stream = {
      capture: (name: string, props: Record<string, unknown>) => captured.push({ name, props }),
    } as never

    track(stream, 'checkout_started', { value: 49, currency: 'USD' })
    track(stream, 'order_completed', { event_id: 'ord-99', value: 49, currency: 'USD' }, 'tags')
    track(stream, 'order_completed', { test: true, value: 99, items: [{ item_id: 'pro', price: 99 }] })
    await tick()

    expect(captured.length).toBe(2)
    expect(captured[0].name).toBe('checkout_started')
    expect(captured[0].props.gclid).toBe('G123')
    expect(captured[0].props.tags).toBe('ga')
    expect(captured[0].props.consent).toBe('analytics,marketing,ads')

    // `only: 'tags'` mirrors to server tag runtime without duplicating stream capture.
    expect(mirrored.length).toBe(3)
    expect(mirrored[0]).toMatchObject({
      name: 'checkout_started',
      id: captured[0].props.event_id,
      to: 'ga',
    })
    expect(mirrored[1]).toMatchObject({ name: 'order_completed', id: 'ord-99', to: 'ga' })
    // `test: true` zeroes revenue before mirroring.
    expect(mirrored[2].params).toMatchObject({
      test: true,
      value: 0,
      items: [{ item_id: 'pro', price: 0 }],
    })

    expect(visit()).toMatchObject({
      gclid: 'G123',
      consent: 'analytics,marketing,ads',
      tags: 'ga',
      userAgent: 'UA',
    })
  })

  it('holds eu track calls until consent is answered, then sends with the chosen consent', async () => {
    const b = browser('Europe/Berlin')
    put('fetch', async (url: string, init?: RequestInit) => {
      b.requests.push({ url, init })
      return {
        ok: true,
        json: async () => ({
          tags: [],
          consent: { region: 'DE', mode: 'eu', version: 3, floor: 2, refused: false },
        }),
      }
    })
    const { startTags, track, acceptAll } = await import('./index')
    startTags({ key: 'pk-site' })
    await tick()

    const captured: Array<{ name: string; props: Record<string, unknown> }> = []
    const stream = {
      capture: (name: string, props: Record<string, unknown>) => captured.push({ name, props }),
    } as never

    track(stream, 'signup_completed', {})
    expect(captured).toEqual([])

    acceptAll()
    await tick()
    expect(captured.length).toBe(1)
    expect(captured[0].props.consent).toBe('analytics,marketing,ads')
  })
})
