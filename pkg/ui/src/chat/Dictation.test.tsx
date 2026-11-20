// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'
import { describe, expect, it, vi } from 'vitest'

import config from '../gui-config'
import { Dictation } from './Dictation'
import { LANGUAGES } from './languages'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('the languages dictation listens in', () => {
  it('offers each once, by its own name', () => {
    expect(LANGUAGES.map((l) => l.id)).toEqual(['en', 'es', 'fr', 'de', 'ja', 'zh'])
    expect(LANGUAGES.find((l) => l.id === 'de')?.label).toBe('Deutsch')
  })
})

describe('Dictation', () => {
  it('survives a browser that refuses to list microphones', async () => {
    const refused: unknown[] = []
    const onRefused = (e: unknown) => refused.push(e)
    process.on('unhandledRejection', onRefused)
    const enumerateDevices = vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError'))
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { enumerateDevices } })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const voice = { state: 'idle', open: false, level: 0, blocked: null, reason: null, refusal: null, toggle: () => {} } as const
    act(() =>
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <Dictation voice={voice} />
        </GuiProvider>,
      ),
    )
    act(() => host.querySelector<HTMLElement>('[data-slot="dictation-menu"]')!.click())
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })
    process.off('unhandledRejection', onRefused)
    expect(enumerateDevices).toHaveBeenCalled()
    expect(refused).toEqual([])
    act(() => root.unmount())
    host.remove()
  })

  it('says it is listening while it listens', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const voice = { state: 'listening', open: true, level: 0, blocked: null, reason: null, refusal: null, toggle: () => {} } as const
    act(() =>
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <Dictation voice={voice} />
        </GuiProvider>,
      ),
    )
    expect(host.querySelector('[data-slot="dictation-live"]')?.textContent).toBe('Listening')
    act(() => root.unmount())
    host.remove()
  })

  it('gives the settings chevron a 44px target on a phone', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const voice = { state: 'idle', open: false, level: 0, blocked: null, reason: null, refusal: null, toggle: () => {} } as const
    act(() =>
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <Dictation voice={voice} />
        </GuiProvider>,
      ),
    )
    expect(host.querySelector('[data-slot="dictation-menu"]')!.className).toMatch(/_minH-_maxsm_44px/)
    act(() => root.unmount())
    host.remove()
  })
})
