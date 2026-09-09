import { describe, it, expect, afterEach } from 'vitest'

import { createAnalytics } from './core'
import { PRODUCT_PROJECT, dsnForProduct } from './dsn'
import { parseDsn } from './sentry'

const ENV = 'NEXT_PUBLIC_HANZO_EVENT_DSN'
const OVERRIDE = 'https://1:aaaa@api.hanzo.ai/v1/event/env-project'
const EXPLICIT = 'https://1:bbbb@api.hanzo.ai/v1/event/explicit-project'
// A stand-in for the surface's own resolved key — the DSN carries whatever key
// the caller resolved (config or the KMS-sourced env), never a literal.
const KEY = 'pk-test-resolved-key'

afterEach(() => {
  delete process.env[ENV]
})

describe('the product registry', () => {
  it('builds a product DSN from the CALLER key + the project — nothing baked', () => {
    expect(dsnForProduct('console', KEY)).toBe(
      `https://${KEY}@api.hanzo.ai/v1/event/${PRODUCT_PROJECT.console}`
    )
    expect(dsnForProduct('site', KEY)).toBe(
      `https://${KEY}@api.hanzo.ai/v1/event/${PRODUCT_PROJECT.site}`
    )
  })

  it('returns undefined without a key or without a project, rather than guessing', () => {
    expect(dsnForProduct('console', undefined)).toBeUndefined() // no key -> inert
    expect(dsnForProduct('not-a-product', KEY)).toBeUndefined()
    expect(dsnForProduct(undefined, KEY)).toBeUndefined()
    expect(dsnForProduct('', KEY)).toBeUndefined()
  })

  it('every product DSN parses to the caller key + its own project id', () => {
    for (const [product, projectId] of Object.entries(PRODUCT_PROJECT)) {
      const parsed = parseDsn(dsnForProduct(product, KEY))
      expect(parsed, `${product} DSN must parse`).not.toBeNull()
      expect(parsed!.projectId, `${product} project id`).toBe(projectId)
      expect(parsed!.publicKey, `${product} carries the resolved key`).toBe(KEY)
    }
  })
})

describe('DSN precedence — most specific source wins', () => {
  it('lights up the error plane from `product` + a resolved key, with no explicit dsn', () => {
    const a = createAnalytics({ product: 'console', ingestKey: KEY, enabled: false })
    expect(a.errorPlaneEnabled).toBe(true)
    expect(a.errorIngestUrl).toContain(PRODUCT_PROJECT.console)
  })

  it('prefers an explicit dsn over both the env and the registry', () => {
    process.env[ENV] = OVERRIDE
    const a = createAnalytics({ product: 'console', ingestKey: KEY, dsn: EXPLICIT, enabled: false })
    expect(a.errorIngestUrl).toContain('explicit-project')
  })

  it('prefers the env override over the registry, so a deploy can repoint a surface', () => {
    process.env[ENV] = OVERRIDE
    const a = createAnalytics({ product: 'console', ingestKey: KEY, enabled: false })
    expect(a.errorIngestUrl).toContain('env-project')
  })

  it('stays inert for an unregistered product — never posts one surface into another project', () => {
    const a = createAnalytics({ product: 'not-a-product', ingestKey: KEY, enabled: false })
    expect(a.errorPlaneEnabled).toBe(false)
    expect(a.errorIngestUrl).toBeUndefined()
  })

  it('stays inert with a product but no key — the error plane needs the live key', () => {
    const a = createAnalytics({ product: 'console', enabled: false })
    expect(a.errorPlaneEnabled).toBe(false)
    expect(a.errorIngestUrl).toBeUndefined()
  })
})
