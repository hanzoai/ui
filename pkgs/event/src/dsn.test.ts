import { describe, it, expect, afterEach } from 'vitest'

import { createAnalytics } from './core'
import { PRODUCT_PROJECT, dsnForProduct, HANZO_PUBLISHABLE_KEY } from './dsn'
import { parseDsn } from './sentry'

const ENV = 'NEXT_PUBLIC_HANZO_EVENT_DSN'
const OVERRIDE = 'https://1:aaaa@api.hanzo.ai/v1/sentry/env-project'
const EXPLICIT = 'https://1:bbbb@api.hanzo.ai/v1/sentry/explicit-project'

afterEach(() => {
  delete process.env[ENV]
})

describe('the product registry', () => {
  it('builds a product DSN — the org publishable key at its project envelope', () => {
    expect(dsnForProduct('console')).toBe(
      `https://${HANZO_PUBLISHABLE_KEY}@api.hanzo.ai/v1/sentry/${PRODUCT_PROJECT.console}`
    )
    expect(dsnForProduct('site')).toBe(
      `https://${HANZO_PUBLISHABLE_KEY}@api.hanzo.ai/v1/sentry/${PRODUCT_PROJECT.site}`
    )
  })

  it('returns undefined for an unregistered or missing product, rather than guessing', () => {
    expect(dsnForProduct('not-a-product')).toBeUndefined()
    expect(dsnForProduct(undefined)).toBeUndefined()
    expect(dsnForProduct('')).toBeUndefined()
  })

  it('every product DSN parses to the org key + its own project id', () => {
    for (const [product, projectId] of Object.entries(PRODUCT_PROJECT)) {
      const parsed = parseDsn(dsnForProduct(product))
      expect(parsed, `${product} DSN must parse`).not.toBeNull()
      expect(parsed!.projectId, `${product} project id`).toBe(projectId)
      expect(parsed!.publicKey, `${product} carries the org key`).toBe(HANZO_PUBLISHABLE_KEY)
    }
  })
})

describe('DSN precedence — most specific source wins', () => {
  it('lights up the error plane from `product` alone, with no dsn and no env', () => {
    const a = createAnalytics({ product: 'console', enabled: false })
    expect(a.errorPlaneEnabled).toBe(true)
    expect(a.errorIngestUrl).toContain(PRODUCT_PROJECT.console)
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
