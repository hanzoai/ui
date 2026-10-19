// @vitest-environment jsdom

/**
 * Below lg a docked pane is the overlay: full screen, over the page, its own
 * dialog. gui reads the media once when the config loads, so this file pins an
 * 800px viewport before anything imports it (the shared shim matches nothing,
 * and `lg` is a min-width).
 */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

vi.hoisted(() => {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*([\d.]+)px/)
    const max = query.match(/max-width:\s*([\d.]+)px/)
    const matches = (!min || 800 >= Number(min[1])) && (!max || 800 <= Number(max[1])) && !!(min || max)
    return { matches, media: query, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }
  }) as typeof window.matchMedia
})

import { GuiProvider } from '@hanzo/gui'
import config from '../gui-config'
import { DetailPane, useDetailPane, type DetailPaneApi } from './DetailPane'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

it('a docked pane below lg is the overlay, in the record frame', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  let api!: DetailPaneApi
  const Capture = () => {
    api = useDetailPane()
    return null
  }
  act(() =>
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        <DetailPane mode="docked">
          <Capture />
        </DetailPane>
      </GuiProvider>,
    ),
  )
  act(() => api.open({ title: 'Acme', content: <span>body</span> }))
  expect(host.querySelector('[data-slot="detail-pane"]')).toBeNull()
  expect(host.querySelector('[role="dialog"]')).toBeTruthy()
  expect(host.querySelector('[data-slot="pane-bar"]')?.textContent).toContain('Acme')
  act(() => root.unmount())
  host.remove()
})
