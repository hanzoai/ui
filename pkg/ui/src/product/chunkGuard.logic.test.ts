import { describe, expect, it } from 'vitest'
import { isBuildAssetError, isChunkLoadError, shouldReloadForChunk } from './chunkGuard.logic'

describe('isChunkLoadError', () => {
  it('recognizes a named ChunkLoadError', () => {
    const e = new Error('Loading chunk 12 failed')
    e.name = 'ChunkLoadError'
    expect(isChunkLoadError(e)).toBe(true)
  })

  it('recognizes the webpack and vite dynamic-import phrasings', () => {
    expect(isChunkLoadError(new Error('Loading chunk 42 failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Importing a module script failed'))).toBe(true)
  })

  it('recognizes a stale chunk URL parsed as HTML', () => {
    // The 404 fell through to the SPA shell, so the browser tried to parse
    // HTML as JS — this is the signature of THAT failure, not a syntax bug.
    expect(isChunkLoadError(new SyntaxError("Unexpected token '<'"))).toBe(true)
  })

  it('is false for an ordinary application error', () => {
    expect(isChunkLoadError(new TypeError('cannot read property of undefined'))).toBe(false)
  })

  it('is false for nothing at all', () => {
    expect(isChunkLoadError(undefined)).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})

describe('isBuildAssetError', () => {
  const asTarget = (src: string): EventTarget => ({ src }) as unknown as EventTarget

  it('is true for a script tag under the build asset path', () => {
    expect(isBuildAssetError(asTarget('https://app.example.com/_next/static/chunks/123.js'))).toBe(true)
  })

  it('honors a custom asset path prefix', () => {
    const script = asTarget('https://app.example.com/assets/chunks/123.js')
    expect(isBuildAssetError(script, '/assets/')).toBe(true)
    expect(isBuildAssetError(script)).toBe(false)
  })

  it('is false for an unrelated element or a missing target', () => {
    expect(isBuildAssetError(asTarget('https://cdn.example.com/tracker.js'))).toBe(false)
    expect(isBuildAssetError(null)).toBe(false)
  })
})

describe('shouldReloadForChunk', () => {
  it('allows the first reload, having never reloaded', () => {
    expect(shouldReloadForChunk(1_000_000, null)).toBe(true)
  })

  it('refuses a second reload inside the window', () => {
    expect(shouldReloadForChunk(1_000_000, 990_000, 15_000)).toBe(false)
  })

  it('allows a reload once the window has passed', () => {
    expect(shouldReloadForChunk(1_020_000, 1_000_000, 15_000)).toBe(true)
  })

  it('treats a corrupt stored timestamp as no prior reload', () => {
    expect(shouldReloadForChunk(1_000_000, Number.NaN)).toBe(true)
  })
})
