// @vitest-environment jsdom

/**
 * The row under the composer: the model, the effort and the mode as one set of
 * quiet words — and the surface's chips, which the person may hide.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { parseModels } from '../models/catalog'
import { Chips, Tune, type Mind } from './Tune'
import { EFFORTS } from './ways'

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

const models = parseModels([
  { id: 'enso-auto', owned_by: 'hanzo', family: 'enso', class: 'ours', name: 'Enso' },
  { id: 'plain', owned_by: 'lab', class: 'free', name: 'Plain', supports_reasoning: false },
  { id: 'thinker', owned_by: 'lab', class: 'free', name: 'Thinker', supports_reasoning: true },
])

const mind = (over: Partial<Mind> = {}): Mind => ({
  model: 'enso-auto',
  models,
  loading: false,
  error: null,
  note: '',
  free: false,
  pick: () => {},
  ...over,
})

const label = (name: string) => host.querySelector(`[aria-label^="${name}"]`)

describe('Tune', () => {
  it('draws the model only when handed', () => {
    mount(<Tune mind={mind()} />)
    expect(label('Model')).not.toBeNull()
    mount(<Tune />)
    expect(label('Model')).toBeNull()
  })

  it('names the mode in force and changes it from its own list', () => {
    const set = vi.fn()
    mount(
      <Tune
        mode={{
          value: 'auto',
          set,
          items: [
            { id: 'auto', label: 'Auto', note: 'Runs on its own' },
            { id: 'plan', label: 'Plan', note: 'Writes nothing' },
          ],
        }}
      />,
    )
    const word = host.querySelector<HTMLElement>('[data-slot="mode"]')!
    expect(word.tagName).toBe('BUTTON')
    expect(word.getAttribute('aria-label')).toBe('Mode: Auto')
    act(() => word.click())
    const plan = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent?.startsWith('Plan'))!
    act(() => plan.click())
    expect(set).toHaveBeenCalledWith('plan')
  })

  it('names the effort in force as a word of the same row, and changes it from its own list', () => {
    const set = vi.fn()
    mount(
      <Tune
        effort={{
          value: 'high',
          set,
          items: [
            { id: 'auto', label: 'Auto', note: 'Adaptive' },
            { id: 'high', label: 'High', note: 'Thinks longer' },
          ],
        }}
      />,
    )
    const word = host.querySelector<HTMLElement>('[data-slot="effort"]')!
    expect(word.getAttribute('aria-label')).toBe('Effort: High')
    act(() => word.click())
    const auto = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent?.startsWith('Auto'))!
    act(() => auto.click())
    expect(set).toHaveBeenCalledWith('auto')
  })

  it('draws nothing where the surface has no model, no effort and no mode', () => {
    mount(<Tune mind={null} effort={null} mode={null} />)
    expect(host.querySelector('[data-slot="tune"]')?.children.length).toBe(0)
  })
})

describe('Tune, effort and mode lists', () => {
  const items = [
    { id: 'fast', label: 'Fast', note: 'Quick' },
    { id: 'high', label: 'High', note: 'Thinks longer' },
    { id: 'auto', label: 'Auto', note: 'Adaptive' },
  ]
  const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].map((o) => o.textContent?.split(/(?=[A-Z][a-z]+ )/)[0] ?? '')

  it('lists the efforts in the order it was given, Auto first in EFFORTS', () => {
    mount(<Tune effort={{ value: 'high', set: () => {}, items: EFFORTS }} />)
    act(() => host.querySelector<HTMLElement>('[data-slot="effort"]')!.click())
    const names = [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent ?? '')
    expect(names[0]).toMatch(/^Auto/)
    expect(names.at(-1)).toMatch(/^Max/)
    expect(names).toHaveLength(EFFORTS.length)
  })

  it('closes a list on Escape', () => {
    mount(<Tune mode={{ value: 'fast', set: () => {}, items }} />)
    act(() => host.querySelector<HTMLElement>('[data-slot="mode"]')!.click())
    expect(document.querySelector('[role="option"]')).not.toBeNull()
    act(() => {
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(document.querySelector('[role="option"]')).toBeNull()
  })

  it('names the model from the catalog, with the catalog\'s own description in its tip', () => {
    mount(<Tune mind={mind()} />)
    expect(label('Model')!.getAttribute('aria-label')).toBe('Model: Enso')
    expect(host.textContent).toContain('Enso')
  })
  it('leaves the mode list in the order it was given', () => {
    mount(<Tune mode={{ value: 'fast', set: () => {}, items }} />)
    act(() => host.querySelector<HTMLElement>('[data-slot="mode"]')!.click())
    expect(options()[0]).toMatch(/^Fast/)
  })

  it('says whether a list is open', () => {
    mount(<Tune mode={{ value: 'fast', set: () => {}, items }} />)
    const word = host.querySelector<HTMLElement>('[data-slot="mode"]')!
    expect(word.getAttribute('aria-expanded')).toBe('false')
    act(() => word.click())
    expect(host.querySelector('[data-slot="mode"]')!.getAttribute('aria-expanded')).toBe('true')
  })

  it('does not open the mode while the surface disables it', () => {
    mount(<Tune disabled mode={{ value: 'fast', set: () => {}, items }} />)
    const word = host.querySelector<HTMLElement>('[data-slot="mode"]')!
    expect(word.getAttribute('aria-disabled')).toBe('true')
    act(() => word.click())
    expect(document.querySelector('[role="option"]')).toBeNull()
    expect(word.getAttribute('aria-expanded')).toBe('false')
  })

  it('stands the model, effort and mode as separate controls', () => {
    mount(<Tune mind={mind()} effort={{ value: 'high', set: () => {}, items }} mode={{ value: 'fast', set: () => {}, items }} />)
    expect(label('Model')).not.toBeNull()
    expect(host.querySelector('[data-slot="effort"]')).not.toBeNull()
    expect(host.querySelector('[data-slot="mode"]')).not.toBeNull()
  })
})

describe('Chips', () => {
  it('marks the one in force and runs the one pressed', () => {
    const run = vi.fn()
    mount(
      <Chips
        chips={[
          { id: 'auto', label: 'Auto', on: true, onPress: () => {} },
          { id: 'kai', label: 'Kai', onPress: run },
        ]}
      />,
    )
    const chips = [...host.querySelectorAll<HTMLElement>('[data-slot="composer-chip"]')]
    expect(chips.map((c) => c.getAttribute('aria-pressed'))).toEqual(['true', null])
    act(() => chips[1]!.click())
    expect(run).toHaveBeenCalledOnce()
  })
})
