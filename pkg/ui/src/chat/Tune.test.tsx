// @vitest-environment jsdom

/**
 * The row under the composer: the model, the effort only for a model that
 * reasons, the mode — and the surface's chips, which the person may hide.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { parseModels } from '../models/catalog'
import { Chips, Tune, type Mind } from './Tune'

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
    const pill = host.querySelector<HTMLElement>('[data-slot="mode"]')!
    expect(pill.getAttribute('aria-label')).toBe('Mode: Auto')
    act(() => pill.click())
    const plan = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent?.startsWith('Plan'))!
    act(() => plan.click())
    expect(set).toHaveBeenCalledWith('plan')
  })

  it('draws nothing where the surface has no model and no mode', () => {
    mount(<Tune mind={null} mode={null} />)
    expect(host.querySelector('[data-slot="tune"]')?.children.length).toBe(0)
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
