// @vitest-environment jsdom

/**
 * The family chips draw only what the catalog lists, mark the one the model
 * belongs to, pick a family's first model the plan grants, and ask for the plan
 * where it grants none.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { parseModels } from '../models/catalog'
import { useFamilies } from './Families'
import { Chips, type Mind } from './Tune'

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

const models = parseModels([
  { id: 'enso-auto', owned_by: 'hanzo', family: 'enso', class: 'ours', name: 'Enso' },
  { id: 'zen6', owned_by: 'zenlm', family: 'zen', class: 'free', name: 'Zen 6' },
  { id: 'kai', owned_by: 'hanzo', family: 'kai', class: 'ours', name: 'Kai' },
])

const mind = (over: Partial<Mind> = {}): Mind => ({ model: 'enso-auto', models, loading: false, error: null, note: '', free: false, pick: () => {}, ...over })

function Row({ m, onUpgrade }: { m: Mind; onUpgrade?: (id: string) => void }) {
  return <Chips chips={useFamilies(m, onUpgrade)} />
}

const mount = (ui: React.ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

const chips = () => [...host.querySelectorAll<HTMLElement>('[data-slot="composer-chip"]')]

describe('useFamilies', () => {
  it('draws Auto and the families the catalog lists, and marks the one the model is in', () => {
    mount(<Row m={mind()} />)
    expect(chips().map((c) => c.textContent)).toEqual(['Auto', 'Kai', 'Zen'])
    expect(chips().map((c) => c.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false'])
    mount(<Row m={mind({ model: 'zen6' })} />)
    expect(chips().map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true'])
  })

  it('picks a family’s model, and Auto the router', () => {
    const pick = vi.fn()
    mount(<Row m={mind({ model: 'zen6', pick })} />)
    act(() => chips()[1]!.click())
    expect(pick).toHaveBeenLastCalledWith('kai')
    act(() => chips()[0]!.click())
    expect(pick).toHaveBeenLastCalledWith('enso-auto')
  })

  it('asks for the plan where a free plan does not grant the family', () => {
    const pick = vi.fn()
    const onUpgrade = vi.fn()
    mount(<Row m={mind({ free: true, pick })} onUpgrade={onUpgrade} />)
    act(() => chips()[1]!.click())
    expect(onUpgrade).toHaveBeenCalledWith('kai')
    expect(pick).not.toHaveBeenCalled()
    act(() => chips()[2]!.click())
    expect(pick).toHaveBeenCalledWith('zen6')
  })
})
