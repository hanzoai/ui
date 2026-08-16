import { describe, expect, it } from 'vitest'

import { hanzo } from './index'

const ROOT = '/app'
const find = (cfg: any, f: unknown) =>
  (cfg.resolve.alias as Array<{ find: unknown; replacement: string }>).find(
    (a) => String(a.find) === String(f),
  )

describe('@hanzo/vite', () => {
  it('resolves the source alias against the app root', () => {
    expect(find(hanzo({}, { root: ROOT }), '~')?.replacement).toBe('/app/src')
  })

  it('matches react-native EXACTLY, so deep imports still find the real package', () => {
    // A bare-string alias is a PREFIX match in Vite, which would rewrite
    // `react-native/Libraries/*` too — and those files expect the real package.
    const entry = find(hanzo({}, { root: ROOT }), /^react-native$/)
    expect(entry?.replacement).toBe('react-native-web')
    expect(entry?.find).toBeInstanceOf(RegExp)
    expect(String((entry!.find as RegExp).test('react-native/Libraries/x'))).toBe('false')
  })

  it('forces ONE copy of every package whose identity is load-bearing', () => {
    // Two copies of a context provider are two contexts, and the failure is not
    // a crash — it is a component that renders unstyled.
    const d = (hanzo({}, { root: ROOT }) as any).resolve.dedupe
    for (const p of ['react', 'react-dom', '@hanzo/gui', '@hanzo/ui']) expect(d).toContain(p)
  })

  it('prefers a .web.* implementation', () => {
    expect((hanzo({}, { root: ROOT }) as any).resolve.extensions.slice(0, 2)).toEqual([
      '.web.tsx',
      '.web.ts',
    ])
  })

  it('lets the app override one of ours — its aliases are matched first', () => {
    const cfg = hanzo(
      { resolve: { alias: [{ find: '~', replacement: '/elsewhere' }], dedupe: ['zustand'] } },
      { root: ROOT },
    ) as any
    expect(cfg.resolve.alias[0]).toEqual({ find: '~', replacement: '/elsewhere' })
    expect(cfg.resolve.dedupe).toContain('zustand')
  })

  it('keeps the app\'s own keys', () => {
    expect((hanzo({ base: '/x' }, { root: ROOT }) as any).base).toBe('/x')
  })
})
