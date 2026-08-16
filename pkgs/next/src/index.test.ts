import { describe, expect, it } from 'vitest'

import { hanzo, transpileList } from './index'

const ROOT = '/app'

describe('@hanzo/next', () => {
  it('resolves the source alias itself, because the compiler will not', () => {
    // The whole reason this package exists: Next reads tsconfig `paths` through
    // the installed typescript, and TypeScript 7 publishes no such API. A green
    // typecheck with an unresolvable `~/config` is the failure being prevented.
    const cfg = hanzo({}, { root: ROOT }) as any
    const out = { resolve: { alias: {}, extensions: ['.ts'] } }
    cfg.webpack(out, {})
    expect(out.resolve.alias['~']).toBe('/app/src')
  })

  it('aliases react-native EXACTLY, so deep imports still find the real package', () => {
    const cfg = hanzo({}, { root: ROOT }) as any
    const out = { resolve: { alias: {}, extensions: [] } }
    cfg.webpack(out, {})
    expect(out.resolve.alias['react-native$']).toBe('react-native-web')
    expect(out.resolve.alias['react-native']).toBeUndefined()
  })

  it('runs the typecheck through the tsc binary', () => {
    // A typecheck that silently does not run is worse than one that fails.
    expect((hanzo({}, { root: ROOT }) as any).experimental.useTypeScriptCli).toBe(true)
  })

  it('keeps symlinked paths, so one gui runtime loads instead of two', () => {
    const cfg = hanzo({}, { root: ROOT }) as any
    const out = { resolve: { alias: {}, extensions: [] } }
    cfg.webpack(out, {})
    expect(out.resolve.symlinks).toBe(false)
  })

  it('prefers a .web.* implementation without dropping the defaults', () => {
    const cfg = hanzo({}, { root: ROOT }) as any
    const out = { resolve: { alias: {}, extensions: ['.tsx', '.ts'] } }
    cfg.webpack(out, {})
    expect(out.resolve.extensions.slice(0, 2)).toEqual(['.web.tsx', '.web.ts'])
    expect(out.resolve.extensions).toContain('.ts')
  })

  it('ADDS to the transpile list rather than replacing it', () => {
    // Replacing it is how a satellite goes missing, silently, at runtime.
    const list = transpileList(ROOT, ['@acme/thing'])
    expect(list).toContain('@hanzo/gui')
    expect(list).toContain('@acme/thing')
    expect(new Set(list).size).toBe(list.length)
  })

  it('lets the app win on its own keys, and composes its webpack hook', () => {
    let ran = false
    const cfg = hanzo(
      {
        reactStrictMode: true,
        webpack(c: any) {
          ran = true
          // The app sees the shared resolution already applied, so it can build on it.
          expect(c.resolve.alias['~']).toBe('/app/src')
          c.resolve.alias['@extra'] = '/x'
          return c
        },
      },
      { root: ROOT },
    ) as any
    const out = { resolve: { alias: {}, extensions: [] } }
    const result = cfg.webpack(out, {})
    expect(cfg.reactStrictMode).toBe(true)
    expect(ran).toBe(true)
    expect(result.resolve.alias['@extra']).toBe('/x')
  })
})
