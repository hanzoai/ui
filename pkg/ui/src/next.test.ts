/**
 * The config helper is build-time plumbing, and its failure mode is silence: a
 * missing alias does not throw, it lets a bundler walk into React Native's Flow
 * source and report a parse error inside a dependency.
 *
 * So what is asserted is that BOTH bundlers are configured — the whole reason
 * this is one file is that a webpack-only alias is invisible under Turbopack,
 * and then `next dev` and `next build` disagree about whether the app compiles.
 */
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const withGui = createRequire(import.meta.url)('../dist/next.cjs') as {
  (c?: Record<string, unknown>): any
  withGui: (c?: Record<string, unknown>) => any
  GUI_ALIAS: Record<string, string>
}

describe('both bundlers are told the same thing', () => {
  it('turbopack resolves react-native to its web build', () => {
    const c = withGui({})
    expect(c.turbopack.resolveAlias['react-native']).toBe('react-native-web')
    expect(c.turbopack.resolveAlias['@react-native/assets-registry/registry']).toContain('AssetRegistry')
  })

  it('webpack resolves it too', () => {
    const config: any = { resolve: { alias: {}, extensions: ['.tsx', '.ts'] } }
    withGui({}).webpack(config, {})
    expect(config.resolve.alias['react-native']).toBe('react-native-web')
  })

  it('the web extensions come FIRST, or the native file wins by being listed first', () => {
    const config: any = { resolve: { extensions: ['.tsx', '.ts'] } }
    withGui({}).webpack(config, {})
    expect(config.resolve.extensions[0]).toBe('.web.tsx')
    expect(config.resolve.extensions).toContain('.tsx')
    // and no duplicates, which would be harmless but sloppy
    expect(new Set(config.resolve.extensions).size).toBe(config.resolve.extensions.length)
  })
})

describe('it composes rather than replaces', () => {
  it("keeps a caller's own webpack hook and runs after it", () => {
    const order: string[] = []
    const c = withGui({
      webpack(config: any) {
        order.push('theirs')
        config.marked = true
        return config
      },
    })
    const config: any = { resolve: { alias: {} } }
    const out = c.webpack(config, {})
    order.push('ours')
    expect(order).toEqual(['theirs', 'ours'])
    // Theirs ran, and ours did not undo it.
    expect(out.marked).toBe(true)
    expect(out.resolve.alias['react-native']).toBe('react-native-web')
  })

  it('keeps the rest of the config untouched', () => {
    const c = withGui({ output: 'export', transpilePackages: ['@hanzo/ui'] })
    expect(c.output).toBe('export')
    expect(c.transpilePackages).toEqual(['@hanzo/ui'])
  })

  it("keeps a caller's own turbopack aliases", () => {
    const c = withGui({ turbopack: { resolveAlias: { lodash: 'lodash-es' } } })
    expect(c.turbopack.resolveAlias.lodash).toBe('lodash-es')
    expect(c.turbopack.resolveAlias['react-native']).toBe('react-native-web')
  })

  it('is callable both ways, because both spellings appear in the wild', () => {
    expect(withGui({}).turbopack).toBeTruthy()
    expect(withGui.withGui({}).turbopack).toBeTruthy()
  })
})
