// @vitest-environment jsdom

/**
 * Mounting `<Hanzo>` is the whole of what an app does to honour a person's
 * appearance preference.
 *
 * The alternative — an app calling `apply(read())` itself — is the version that
 * silently does nothing on the one surface that forgot, and a setting that works
 * on three products out of four is worse than one that works on none, because
 * nobody reports it. So this asserts the wiring rather than the API: store a
 * preference, mount the root, read the document.
 */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { KEY } from '@hanzo/appearance/state'

import { Hanzo } from './root'

// This jsdom has no localStorage (it is only provided for a real origin), so
// the module under test would see storage as unavailable and correctly do
// nothing — which would make every assertion below pass for the wrong reason.
// A real Storage, so the test exercises the path a browser takes.
const mem = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() { return mem.size },
  } satisfies Storage,
})

// <Hanzo> asserts in development that its stylesheet reached the document, by
// looking up `--hanzo-ui-styles`. vite hands vitest a real (empty) stylesheet
// for the `import './styles.css'`, so the guard is live here and correctly
// reports a missing sheet. Declare the marker the shipped sheet declares — the
// guard is doing its job and this test is not about it.
beforeAll(() => {
  const marker = document.createElement('style')
  marker.textContent = ':root{--hanzo-ui-styles:1}'
  document.head.appendChild(marker)
})

const mount = async () => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  await act(async () => {
    createRoot(host).render(<Hanzo />)
  })
  return host
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
  document.body.innerHTML = ''
})

describe('<Hanzo> honours the person, with no wiring', () => {
  it('puts a stored type size and density on the document', async () => {
    localStorage.setItem(KEY, JSON.stringify({ type: 1.3, density: 'comfortable' }))
    await mount()
    const s = document.documentElement.style
    expect(s.getPropertyValue('--type-scale')).toBe('1.3')
    expect(s.getPropertyValue('--density')).toBe('1.15')
  })

  it('puts a stored accent on BOTH names the ramp spends', async () => {
    // design's ramp uses --primary for action surfaces and --accent for
    // selection. One hue, stated once, landing on both.
    localStorage.setItem(KEY, JSON.stringify({ accent: '#8b5cf6' }))
    await mount()
    const s = document.documentElement.style
    expect(s.getPropertyValue('--primary')).toBe('#8b5cf6')
    expect(s.getPropertyValue('--accent')).toBe('#8b5cf6')
  })

  it('writes NOTHING when nobody has set anything', async () => {
    // An axis nobody set is absent, not neutral. Stamping a `1` here would be
    // invisible on hanzo.ai and decisive on a brand that publishes its own
    // scale — an inline property on <html> outranks every stylesheet, so the
    // untouched install would silently override the brand.
    await mount()
    const s = document.documentElement.style
    for (const knob of ['--type-scale', '--density', '--primary', '--accent'])
      expect(s.getPropertyValue(knob)).toBe('')
  })

  it('ignores a corrupt preference rather than taking the surface down', async () => {
    localStorage.setItem(KEY, '{not json')
    await expect(mount()).resolves.toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--type-scale')).toBe('')
  })
})
