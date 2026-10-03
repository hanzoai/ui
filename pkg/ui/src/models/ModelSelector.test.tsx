// @vitest-environment jsdom

/**
 * ModelSelector against a live DOM: a model with `access` is listed and cannot
 * be chosen, and the one thing its row offers is the link to ask for access.
 *
 * The panel is portalled, so its rows are read off `document`, not the host.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { RESEARCH, type ModelCatalogEntry } from './catalog'
import { ModelSelector } from './ModelSelector'

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

const MODELS: ModelCatalogEntry[] = [
  { id: 'enso', owned_by: 'hanzo', label: 'Enso' },
  { id: 'zen6', owned_by: 'zenlm', label: 'Zen 6' },
  ...RESEARCH,
]

const row = (text: string) =>
  [...document.querySelectorAll<HTMLElement>('[data-slot="command-item"]')].find((el) => el.textContent?.includes(text))!

describe('a model nobody can call yet', () => {
  it('is listed under its family, disabled, and says why', () => {
    mount(<ModelSelector models={MODELS} onChange={() => {}} open />)
    const zen7 = row('Zen 7')
    expect(zen7).toBeTruthy()
    expect(zen7.getAttribute('data-access')).toBe('research')
    expect(zen7.querySelector('[aria-disabled="true"]')?.textContent).toContain('Research preview')
    expect(row('Zen 6').querySelector('[aria-disabled]')).toBeNull()
    // Nothing that holds the link says it is disabled: that would disable the link too.
    const link = zen7.querySelector('a')!
    expect(link.closest('[aria-disabled="true"]')).toBeNull()
  })

  it('is never chosen, by the pointer or by Enter', () => {
    const onChange = vi.fn()
    mount(<ModelSelector models={MODELS} onChange={onChange} open />)
    act(() => row('Zen 7').click())
    expect(onChange).not.toHaveBeenCalled()

    act(() => row('Zen 6').click())
    expect(onChange).toHaveBeenCalledWith('zen6')
  })

  it('links to where a person asks for access, and keeps its Enter from the list', () => {
    const onChange = vi.fn()
    mount(<ModelSelector models={MODELS} onChange={onChange} open />)
    const link = row('Zen 7').querySelector('a')!
    expect(link.textContent).toBe('Request access')
    expect(link.getAttribute('href')).toBe('https://hanzo.ai/research-access')
    expect(link.getAttribute('target')).toBe('_blank')

    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    act(() => {
      link.dispatchEvent(ev)
    })
    expect(ev.defaultPrevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  // `aria-required-parent` is set aside: Command draws every row as an `li` in a
  // plain group, whatever the row holds, so it is the palette's finding and not
  // this row's. What this row could add — a control nested in another — is not.
  it('adds nothing to axe', async () => {
    mount(<ModelSelector models={MODELS} onChange={() => {}} open />)
    const panel = row('Zen 7').closest('[data-slot="command"]')!
    const found = (await audit(panel)).filter((f) => f.id !== 'aria-required-parent')
    expect(found).toEqual([])
  })
})

describe('a model whose class is paused', () => {
  const MIX: ModelCatalogEntry[] = [
    { id: 'zen6', owned_by: 'zenlm', label: 'Zen 6' },
    { id: 'claude-opus-4.8', owned_by: 'anthropic', label: 'Claude Opus 4.8' },
  ]
  const paused = (m: ModelCatalogEntry) => m.id.startsWith('claude')

  it('says Paused, and still picks', () => {
    const onChange = vi.fn()
    mount(<ModelSelector models={MIX} onChange={onChange} paused={paused} open />)
    const opus = row('Claude Opus 4.8')
    expect(opus.getAttribute('data-paused')).toBe('true')
    expect(opus.textContent).toContain('Paused')
    expect(row('Zen 6').getAttribute('data-paused')).toBeNull()
    expect(row('Zen 6').textContent).not.toContain('Paused')
    act(() => opus.click())
    expect(onChange).toHaveBeenCalledWith('claude-opus-4.8')
  })
})
