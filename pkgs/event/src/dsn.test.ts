import { describe, it, expect, afterEach } from 'vitest'

import { createAnalytics } from './core'
import { PRODUCT_DSN, dsnForProduct } from './dsn'
import { parseDsn } from './sentry'

const ENV = 'NEXT_PUBLIC_HANZO_EVENT_DSN'
const OVERRIDE = 'https://1:aaaa@api.hanzo.ai/v1/sentry/env-project'
const EXPLICIT = 'https://1:bbbb@api.hanzo.ai/v1/sentry/explicit-project'

afterEach(() => {
  delete process.env[ENV]
})

describe('the product registry', () => {
  it('resolves a registered product to its DSN', () => {
    expect(dsnForProduct('console')).toBe(PRODUCT_DSN.console)
    expect(dsnForProduct('app')).toBe(PRODUCT_DSN.app)
    expect(dsnForProduct('site')).toBe(PRODUCT_DSN.site)
  })

  it('returns undefined for an unregistered or missing product, rather than guessing', () => {
    expect(dsnForProduct('not-a-product')).toBeUndefined()
    expect(dsnForProduct(undefined)).toBeUndefined()
    expect(dsnForProduct('')).toBeUndefined()
  })

  it('registers only DSNs that actually parse — a typo here would silently disable a surface', () => {
    for (const [product, dsn] of Object.entries(PRODUCT_DSN)) {
      const parsed = parseDsn(dsn)
      expect(parsed, `${product} DSN must parse`).not.toBeNull()
      expect(parsed!.projectId, `${product} needs a project id`).toBeTruthy()
      expect(parsed!.publicKey, `${product} needs a public key`).toBeTruthy()
    }
  })
})

describe('DSN precedence — most specific source wins', () => {
  it('lights up the error plane from `product` alone, with no dsn and no env', () => {
    const a = createAnalytics({ product: 'console', enabled: false })
    expect(a.errorPlaneEnabled).toBe(true)
    expect(a.errorIngestUrl).toContain(parseDsn(PRODUCT_DSN.console)!.projectId)
  })

  it('prefers an explicit dsn over both the env and the registry', () => {
    process.env[ENV] = OVERRIDE
    const a = createAnalytics({ product: 'console', dsn: EXPLICIT, enabled: false })
    expect(a.errorIngestUrl).toContain('explicit-project')
  })

  it('prefers the env override over the registry, so a deploy can repoint a surface', () => {
    process.env[ENV] = OVERRIDE
    const a = createAnalytics({ product: 'console', enabled: false })
    expect(a.errorIngestUrl).toContain('env-project')
  })

  it('stays inert for an unregistered product — never posts one surface into another project', () => {
    const a = createAnalytics({ product: 'not-a-product', enabled: false })
    expect(a.errorPlaneEnabled).toBe(false)
    expect(a.errorIngestUrl).toBeUndefined()
  })
})
