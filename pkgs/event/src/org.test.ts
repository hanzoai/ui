import { describe, it, expect, afterEach } from 'vitest'

import { createAnalytics } from './core'
import { ORG_KEY, keyFor, keyForPage, orgOf } from './org'

const ENV = 'NEXT_PUBLIC_PUBLISHABLE_KEY'

/** Stand on a host the way a browser does, for the duration of one assertion. */
function onHost<T>(hostname: string, run: () => T): T {
  const had = 'location' in globalThis
  const prev = (globalThis as { location?: unknown }).location
  Object.defineProperty(globalThis, 'location', {
    value: { hostname },
    configurable: true,
    writable: true,
  })
  try {
    return run()
  } finally {
    if (had) Object.defineProperty(globalThis, 'location', { value: prev, configurable: true, writable: true })
    else delete (globalThis as { location?: unknown }).location
  }
}

afterEach(() => {
  delete process.env[ENV]
})

describe('the org that owns a host', () => {
  it('claims a brand domain and every subdomain of it', () => {
    expect(orgOf('hanzo.ai')).toBe('hanzo')
    expect(orgOf('lux.network')).toBe('lux')
    expect(orgOf('zoo.ngo')).toBe('zoo')
    // an alias inherits by naming its brand's domain — no entry of its own
    expect(orgOf('explore.lux.network')).toBe('lux')
    expect(orgOf('id.zoo.network')).toBe('zoo')
  })

  it('claims every Hanzo site the fleet actually serves', () => {
    // The table is the reason a static export reports at all, so a site that is
    // LIVE and missing from it reports nothing while looking configured. These
    // are the hosts universe serves; each resolves to Hanzo's key or this fails.
    for (const host of [
      'hanzo.works',
      'hanzo.codes',
      'hanzoskills.com',
      'hanzo.ventures',
      'hanzo.team',
    ]) {
      expect(orgOf(host)).toBe('hanzo')
      expect(keyFor(host)).toBe(ORG_KEY.hanzo)
    }
  })

  it('reads a hostname the way a domain compares', () => {
    expect(orgOf('LUX.NETWORK')).toBe('lux')
    expect(orgOf('lux.network:3000')).toBe('lux')
    expect(orgOf('lux.network.')).toBe('lux')
    expect(orgOf('  hanzo.ai  ')).toBe('hanzo')
  })

  it('claims nothing it does not own, rather than defaulting to Hanzo', () => {
    // The defect this exists to prevent: an unrecognised host filed under a brand
    // that is not its own is silent, reads as working, and surfaces a week later
    // in someone else's warehouse.
    for (const host of ['osage.id', 'pars.id', 'id.bootno.de', 'example.com', '']) {
      expect(orgOf(host)).toBeUndefined()
      expect(keyFor(host)).toBeUndefined()
    }
    // and it must not be fooled by a suffix that merely ENDS with a brand domain
    expect(orgOf('notlux.network')).toBeUndefined()
    expect(orgOf('evil-hanzo.ai')).toBeUndefined()
  })
})

describe('the key a host resolves to', () => {
  it('gives each brand its OWN key', () => {
    const hanzo = keyFor('hanzo.ai')
    const lux = keyFor('lux.network')
    const zoo = keyFor('zoo.ngo')
    for (const k of [hanzo, lux, zoo]) expect(k).toMatch(/^pk-/)
    // The bug on record: one build-time key filed every brand's visitors into
    // Hanzo's project. Three brands must resolve to three DIFFERENT keys.
    expect(new Set([hanzo, lux, zoo]).size).toBe(3)
    expect(lux).not.toBe(hanzo)
    expect(zoo).not.toBe(hanzo)
  })

  it('refuses anything that is not publishable, failing closed', () => {
    expect(keyFor('hanzo.ai', { hanzo: 'sk-live-secret' })).toBeUndefined()
    expect(keyFor('hanzo.ai', { hanzo: '' })).toBeUndefined()
    expect(keyFor('hanzo.ai', {})).toBeUndefined()
  })

  it('resolves a runtime keyring through the same function, not a second copy', () => {
    // hanzo.id serves every brand from ONE image and gets its keyring at runtime.
    expect(keyFor('id.lux.network', { lux: 'pk-runtime-lux' })).toBe('pk-runtime-lux')
  })

  it('is undefined off a browser, where there is no host to read', () => {
    expect(keyForPage()).toBeUndefined()
  })
})

describe('a surface that configures nothing', () => {
  it('still reports, to its own brand', () => {
    const lux = onHost('lux.network', () => createAnalytics({ product: 'site' }))
    expect((lux as unknown as { cfg: { ingestKey?: string } }).cfg.ingestKey).toBe(ORG_KEY.lux)

    const zoo = onHost('zoo.ngo', () => createAnalytics({ product: 'site' }))
    expect((zoo as unknown as { cfg: { ingestKey?: string } }).cfg.ingestKey).toBe(ORG_KEY.zoo)
  })

  it('never overrides what the surface or the build already resolved', () => {
    const explicit = onHost('lux.network', () =>
      createAnalytics({ product: 'site', ingestKey: 'pk-explicit' })
    )
    expect((explicit as unknown as { cfg: { ingestKey?: string } }).cfg.ingestKey).toBe('pk-explicit')

    process.env[ENV] = 'pk-from-the-build'
    const env = onHost('lux.network', () => createAnalytics({ product: 'site' }))
    expect((env as unknown as { cfg: { ingestKey?: string } }).cfg.ingestKey).toBe('pk-from-the-build')
  })

  it('has no key on a host no brand claims, and invents none', () => {
    const none = onHost('example.com', () => createAnalytics({ product: 'site' }))
    expect((none as unknown as { cfg: { ingestKey?: string } }).cfg.ingestKey).toBeUndefined()
  })
})
