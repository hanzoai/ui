// @vitest-environment jsdom

/**
 * ModelPicker against a live DOM, over a catalog the size of the real one:
 * it draws a window of rows rather than five hundred, it reaches every model
 * by the keyboard anyway, and a paused model is labelled and still picked.
 *
 * The panel is portalled, so its rows are read off `document`, not the host.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { parseModels } from './catalog'
import { ModelPicker } from './ModelPicker'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = (ui: React.ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

/** 500 models: Hanzo's families and a long tail of third parties. */
const MODELS = parseModels([
  { id: 'enso-auto', owned_by: 'hanzo', family: 'enso', class: 'ours', name: 'Enso' },
  { id: 'zen5', owned_by: 'zenlm', family: 'zen', class: 'ours', context_window: 1_000_000 },
  { id: 'kai', owned_by: 'hanzo', family: 'kai', class: 'ours', outputs: ['decision'], pricing: { input_per_million: 0.021 } },
  { id: 'typesafe/jev-1.13', owned_by: 'typesafe', name: 'Jev', class: 'premium', outputs: ['decision'], pricing: { input_per_million: 0.042 } },
  { id: 'anthropic/claude-sonnet-4.5', owned_by: 'anthropic', class: 'premium', name: 'Claude Sonnet 4.5' },
  ...Array.from({ length: 496 }, (_, i) => ({
    id: `lab${i % 40}/model-${String(i).padStart(3, '0')}`,
    owned_by: `lab${i % 40}`,
    class: i % 3 ? 'premium' : 'free',
  })),
])

const options = () => [...document.querySelectorAll<HTMLElement>('[data-slot="model-picker-option"]')]
const input = () => document.querySelector<HTMLInputElement>('[data-slot="model-picker-input"]')!
const key = (k: string) =>
  act(() => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
  })

describe('a picker over five hundred models', () => {
  it('says how many it offers and draws only a window of them', () => {
    mount(<ModelPicker models={MODELS} onChange={() => {}} open />)
    // Every catalog model is offered, plus the research preview.
    expect(document.querySelector('[data-slot="model-picker-count"]')!.textContent).toBe('502 models')
    expect(options().length).toBeGreaterThan(5)
    expect(options().length).toBeLessThan(60)
    expect(options()[0]!.getAttribute('aria-setsize')).toBe('502')
  })

  it("leads with Hanzo's families", () => {
    mount(<ModelPicker models={MODELS} onChange={() => {}} open />)
    const heads = [...document.querySelectorAll('[data-slot="model-picker-group"]')].map((el) => el.textContent)
    expect(heads.slice(0, 3)).toEqual(['Enso1', 'Zen2', 'Kai1'])
  })

  it('narrows by search, and offers only what its scope runs', () => {
    mount(<ModelPicker models={MODELS} onChange={() => {}} open scope="decision" />)
    expect(options().map((o) => o.getAttribute('data-model'))).toEqual(['kai', 'typesafe/jev-1.13'])
  })

  it('walks the keyboard past the window and picks with Enter', () => {
    const onChange = vi.fn()
    mount(<ModelPicker models={MODELS} onChange={onChange} open />)
    key('End')
    const last = document.getElementById(input().getAttribute('aria-activedescendant')!)
    // TypeSafe sorts after every lab: Jev is the last row.
    expect(last?.getAttribute('data-model')).toBe('typesafe/jev-1.13')
    key('Enter')
    expect(onChange).toHaveBeenCalledWith('typesafe/jev-1.13')
  })

  it('labels a paused model and still picks it', () => {
    const onChange = vi.fn()
    mount(
      <ModelPicker
        models={MODELS}
        onChange={onChange}
        open
        limits={{ classes: { premium: { state: 'limited' } } }}
      />,
    )
    act(() => {
      const el = input()
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(el, 'claude')
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const claude = options().find((o) => o.getAttribute('data-model') === 'anthropic/claude-sonnet-4.5')!
    expect(claude.getAttribute('data-paused')).toBe('true')
    expect(claude.textContent).toContain('Paused')
    act(() => claude.click())
    expect(onChange).toHaveBeenCalledWith('anthropic/claude-sonnet-4.5')
  })

  it('unscoped, says what a model that does not converse does', () => {
    mount(<ModelPicker models={MODELS} onChange={() => {}} open />)
    act(() => {
      const el = input()
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(el, 'kai')
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const kai = options().find((o) => o.getAttribute('data-model') === 'kai')!
    expect(kai.textContent).toContain('50% less than Jev')
  })

  it('says the catalog could not be read, though the research preview is still listed', () => {
    mount(<ModelPicker models={[]} onChange={() => {}} open error="The model catalog is down" />)
    expect(document.querySelector('[data-slot="model-picker-error"]')?.textContent).toBe('The model catalog is down')
    expect(options().map((o) => o.getAttribute('data-model'))).toEqual(['zen7'])
  })

  it('never picks the research preview', () => {
    const onChange = vi.fn()
    mount(<ModelPicker models={MODELS} onChange={onChange} open />)
    act(() => {
      const el = input()
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(el, 'zen 7')
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const zen7 = options().find((o) => o.getAttribute('data-model') === 'zen7')!
    expect(zen7.getAttribute('aria-disabled')).toBe('true')
    act(() => zen7.click())
    expect(onChange).not.toHaveBeenCalled()
    expect(document.querySelector('[data-slot="model-picker-research"] a')?.getAttribute('href')).toBe('https://hanzo.ai/research-access')
  })
})
