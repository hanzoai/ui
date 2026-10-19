// @vitest-environment jsdom

/**
 * ComboBox: the value is the text, the list is the live options under it.
 * `limit` caps the list; a compact density draws it as one field box with the
 * chevron inside (the record kit's Autocomplete). A live DOM, because the list
 * is a portalled panel that only exists open.
 */
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Density } from '../backends/gui/density'
import { ComboBox } from './ComboBox'

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

const OPTIONS = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'].map((value) => ({ value }))

function Live({ limit }: { limit?: number }) {
  const [v, setV] = useState('')
  return <ComboBox value={v} onChange={setV} options={OPTIONS} limit={limit} />
}

const wrap = (node: React.ReactNode, compact = false) => (
  <GuiProvider config={config} defaultTheme="dark">
    {compact ? <Density value="compact">{node}</Density> : node}
  </GuiProvider>
)
const rows = () => [...document.querySelectorAll('[role="menuitem"]')]
const open = () => act(() => host.querySelector<HTMLElement>('[aria-label="Show options"]')!.click())

describe('ComboBox', () => {
  it('shows every live option without a limit', () => {
    act(() => root.render(wrap(<Live />)))
    open()
    expect(rows()).toHaveLength(5)
  })

  it('limit caps the list', () => {
    act(() => root.render(wrap(<Live limit={2} />)))
    open()
    expect(rows().map((r) => r.textContent)).toEqual(['alpha', 'beta'])
  })

  it('compact: one field box, the chevron inside its end', () => {
    act(() => root.render(wrap(<Live />, true)))
    const group = host.querySelector('[data-slot="combo-box"] [data-slot="input-group"]')!
    expect(group).not.toBeNull()
    expect(group.querySelector('[data-slot="input-group-end"] [aria-label="Show options"]')).not.toBeNull()
    open()
    expect(rows()).toHaveLength(5)
  })
})
