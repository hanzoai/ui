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

/** Renders `ui`, and lets an open picker's menu — loaded on open — arrive. */
const mount = async (ui: React.ReactNode) => {
  await act(async () => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })
  await act(async () => {
    await import('./ModelPickerMenu')
  })
  await act(async () => {})
}

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
  it('says how many it offers and draws only a window of them', async () => {
    await mount(<ModelPicker models={MODELS} onChange={() => {}} open />)
    // Every catalog model is offered, plus the research preview.
    expect(document.querySelector('[data-slot="model-picker-count"]')!.textContent).toBe('501 models')
    expect(options().length).toBeGreaterThan(5)
    expect(options().length).toBeLessThan(60)
    expect(options()[0]!.getAttribute('aria-setsize')).toBe('501')
  })

  it("leads with Hanzo's families", async () => {
    await mount(<ModelPicker models={MODELS} onChange={() => {}} open />)
    const heads = [...document.querySelectorAll('[data-slot="model-picker-group"]')].map((el) => el.textContent)
    expect(heads.slice(0, 3)).toEqual(['Enso1', 'Zen2', 'Kai1'])
  })

  it('narrows by scope, and the comparison vendor’s decision model is in none', async () => {
    await mount(<ModelPicker models={MODELS} onChange={() => {}} open scope="decision" />)
    expect(options().map((o) => o.getAttribute('data-model'))).toEqual(['kai'])
  })

  it('walks the keyboard past the window and picks with Enter', async () => {
    const onChange = vi.fn()
    await mount(<ModelPicker models={MODELS} onChange={onChange} open />)
    key('End')
    const last = document.getElementById(input().getAttribute('aria-activedescendant')!)
    // The last lab's last model is the last row; Jev, which sorts after every lab, is in no list.
    expect(last?.getAttribute('data-model')).toBe('lab9/model-489')
    key('Enter')
    expect(onChange).toHaveBeenCalledWith('lab9/model-489')
  })

  it('labels a paused model and still picks it', async () => {
    const onChange = vi.fn()
    await mount(
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

  it('unscoped, says what a model that does not converse does', async () => {
    await mount(<ModelPicker models={MODELS} onChange={() => {}} open />)
    act(() => {
      const el = input()
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(el, 'kai')
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const kai = options().find((o) => o.getAttribute('data-model') === 'kai')!
    expect(kai.textContent).toContain('50% less than Jev')
  })

  it('says a router bills at the model that serves it, up to its ceiling', async () => {
    const router = parseModels([{ id: 'openrouter/auto', owned_by: 'openrouter', name: 'Auto Router', class: 'premium', outputs: ['text'], variable: true, pricing: { prompt: '0.000000042', completion: '0' } }])
    await mount(<ModelPicker models={[...MODELS, ...router]} onChange={() => {}} open />)
    act(() => {
      const el = input()
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(el, 'auto router')
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const row = options().find((o) => o.getAttribute('data-model') === 'openrouter/auto')!
    expect(row.textContent).toContain('Up to $0.042 / 1M · billed at the model that serves it')
    expect(row.textContent).not.toContain('less than')
  })

  it('says the catalog could not be read, though the research preview is still listed', async () => {
    await mount(<ModelPicker models={[]} onChange={() => {}} open error="The model catalog is down" />)
    expect(document.querySelector('[data-slot="model-picker-error"]')?.textContent).toBe('The model catalog is down')
    expect(options().map((o) => o.getAttribute('data-model'))).toEqual(['zen7'])
  })

  it('draws the trigger alone until it is opened, then the list', async () => {
    await mount(<ModelPicker models={MODELS} value="enso-auto" onChange={() => {}} />)
    const trigger = document.querySelector<HTMLElement>('[data-slot="model-picker"]')!
    expect(trigger.getAttribute('aria-label')).toBe('Model: Enso')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(options()).toHaveLength(0)
    await act(async () => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    await act(async () => {
      await import('./ModelPickerMenu')
    })
    await act(async () => {})
    expect(options().length).toBeGreaterThan(5)
  })

  it('never picks the research preview', async () => {
    const onChange = vi.fn()
    await mount(<ModelPicker models={MODELS} onChange={onChange} open />)
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

describe('a model the plan does not grant', () => {
  it('says Upgrade, and choosing it asks for the plan instead of the model', async () => {
    const onChange = vi.fn()
    const onUpgrade = vi.fn()
    await mount(
      <ModelPicker models={MODELS} value="enso-auto" onChange={onChange} granted={(id) => id === 'enso-auto'} onUpgrade={onUpgrade} open />,
    )
    const claude = options().find((o) => o.getAttribute('data-model') === 'anthropic/claude-sonnet-4.5')!
    expect(claude.textContent).toContain('Upgrade')
    act(() => claude.click())
    expect(onUpgrade).toHaveBeenCalledWith('anthropic/claude-sonnet-4.5')
    expect(onChange).not.toHaveBeenCalled()
  })
})

/** The mount pushes a search into the open picker. */
const search = (q: string) =>
  act(() => {
    const el = input()
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    set.call(el, q)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
const row = (id: string) => options().find((o) => o.getAttribute('data-model') === id)!

describe('another maker’s model on a plan that grants Enso alone', () => {
  const granted = (id: string) => id === 'enso-auto'

  it('with a balance, shows its price by the million and picks', async () => {
    const onChange = vi.fn()
    const onTopUp = vi.fn()
    const pricey = parseModels([{ id: 'anthropic/claude-opus', owned_by: 'anthropic', class: 'premium', name: 'Claude Opus', context_window: 200_000, pricing: { input_per_million: 3, output_per_million: 15 } }])
    await mount(<ModelPicker models={[...MODELS, ...pricey]} onChange={onChange} granted={granted} funded={() => true} balance="$12.40" onTopUp={onTopUp} open />)
    search('opus')
    const opus = row('anthropic/claude-opus')
    expect(opus.textContent).toContain('$3.00 / 1M')
    expect(opus.textContent).toContain('200K')
    expect(opus.textContent).not.toContain('Upgrade')
    expect(opus.textContent).not.toContain('Top up')
    act(() => opus.click())
    expect(onChange).toHaveBeenCalledWith('anthropic/claude-opus')
    expect(onTopUp).not.toHaveBeenCalled()
  })

  it('with no balance, says Top up, never Upgrade, and choosing it opens the top-up with the model', async () => {
    const onChange = vi.fn()
    const onUpgrade = vi.fn()
    const onTopUp = vi.fn()
    await mount(<ModelPicker models={MODELS} onChange={onChange} granted={granted} onUpgrade={onUpgrade} funded={() => false} balance="$0.00" onTopUp={onTopUp} open />)
    search('claude')
    const claude = row('anthropic/claude-sonnet-4.5')
    expect(claude.textContent).toContain('Top up')
    expect(claude.textContent).not.toContain('Upgrade')
    act(() => claude.click())
    expect(onTopUp).toHaveBeenCalledWith('anthropic/claude-sonnet-4.5')
    expect(onUpgrade).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('after a top-up, the same row picks', async () => {
    const onChange = vi.fn()
    const onTopUp = vi.fn()
    const picker = (funded: boolean) => (
      <ModelPicker models={MODELS} onChange={onChange} granted={granted} funded={() => funded} balance={funded ? '$10.00' : '$0.00'} onTopUp={onTopUp} open />
    )
    await mount(picker(false))
    search('claude')
    expect(row('anthropic/claude-sonnet-4.5').textContent).toContain('Top up')
    await act(async () => {
      root.render(<GuiProvider config={config} defaultTheme="dark">{picker(true)}</GuiProvider>)
    })
    search('sonnet')
    const claude = row('anthropic/claude-sonnet-4.5')
    expect(claude.textContent).not.toContain('Top up')
    act(() => claude.click())
    expect(onChange).toHaveBeenCalledWith('anthropic/claude-sonnet-4.5')
  })

  it('still says Upgrade on one of Hanzo’s own models the plan does not grant', async () => {
    await mount(<ModelPicker models={MODELS} onChange={() => {}} granted={granted} funded={() => true} onUpgrade={() => {}} open />)
    search('zen5')
    expect(row('zen5').textContent).toContain('Upgrade')
  })

  it('shows the balance under the list with a Top up link that opens the top-up', async () => {
    const onTopUp = vi.fn()
    await mount(<ModelPicker models={MODELS} onChange={() => {}} balance="$12.40" onTopUp={onTopUp} open />)
    const foot = document.querySelector('[data-slot="model-picker-balance"]')!
    expect(foot.textContent).toContain('Balance $12.40')
    act(() => foot.querySelector<HTMLElement>('[role="button"]')!.click())
    expect(onTopUp).toHaveBeenCalledWith()
  })
})

describe('an agent’s picker', () => {
  const FIXTURE = parseModels([
    { id: 'enso', owned_by: 'hanzo', family: 'enso', class: 'ours', name: 'Enso', outputs: ['text'] },
    { id: 'openai/gpt-6-sol', owned_by: 'openai', class: 'premium', name: 'GPT-6 Sol', outputs: ['text'], supports_tools: true, supports_reasoning: true },
    { id: 'typesafe/jev-router', owned_by: 'typesafe', class: 'premium', name: 'Jev Router', outputs: ['text'], supports_tools: true, supports_reasoning: true },
    { id: 'typesafe/jev-1.13', owned_by: 'typesafe', class: 'premium', name: 'Jev 1.13', outputs: ['decision'] },
    { id: 'google/gemini-image', owned_by: 'google', class: 'premium', name: 'Gemini Image', outputs: ['image'] },
    { id: 'acme/no-tools', owned_by: 'acme', class: 'premium', name: 'No Tools', outputs: ['text'], supports_tools: false },
  ])

  it('lists every maker that can run an agent, grouped, and no Jev', async () => {
    await mount(<ModelPicker models={FIXTURE} onChange={() => {}} scope="agent" open />)
    expect(options().map((o) => o.getAttribute('data-model'))).toEqual(['enso', 'zen7', 'openai/gpt-6-sol'])
    const heads = [...document.querySelectorAll('[data-slot="model-picker-group"]')].map((el) => el.textContent)
    expect(heads).toEqual(['Enso1', 'Zen1', 'OpenAI1'])
  })

  it('keeps what cannot run one in a shut group that opens, each row disabled with why', async () => {
    const onChange = vi.fn()
    await mount(<ModelPicker models={FIXTURE} onChange={onChange} scope="agent" open />)
    const fold = document.querySelector<HTMLElement>('[data-slot="model-picker-fold"]')!
    expect(fold.getAttribute('aria-expanded')).toBe('false')
    expect(fold.textContent).toContain('Not available for agents')
    expect(options().map((o) => o.getAttribute('data-model'))).not.toContain('acme/no-tools')
    act(() => fold.click())
    const none = row('acme/no-tools')
    expect(none.getAttribute('aria-disabled')).toBe('true')
    expect(none.textContent).toContain('No tool use')
    expect(row('google/gemini-image').textContent).toContain('Image model')
    expect(options().map((o) => o.getAttribute('data-model'))).not.toContain('typesafe/jev-router')
    expect(options().map((o) => o.getAttribute('data-model'))).not.toContain('typesafe/jev-1.13')
    act(() => none.click())
    expect(onChange).not.toHaveBeenCalled()
  })
})
