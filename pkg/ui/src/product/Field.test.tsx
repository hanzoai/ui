// @vitest-environment jsdom

/**
 * FieldSwitch as a settings row: the whole row is the switch's label, so a
 * press anywhere toggles; without a label it is the bare switch. And the
 * settings Heading under a compact density is the record section header.
 */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { FieldSwitch } from './Field'
import { Heading } from '../settings/Section'
import { Density } from '../backends/gui/density'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  ).replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')

describe('FieldSwitch row', () => {
  it('is a 32px <label> row holding the switch, the description after a dot', () => {
    const markup = html(<FieldSwitch label="Compact view" description="Fewer fields" checked onChange={() => {}} />)
    const row = markup.match(/<label[^>]*data-slot="field-switch-row"[^>]*>/)![0]
    expect(row).toMatch(/_minH-32px/)
    expect(row).toMatch(/_btlr-c-radius-xs/)
    expect(markup.indexOf('Compact view')).toBeLessThan(markup.indexOf('Fewer fields'))
    expect(markup).toContain('· ')
    expect(markup).toMatch(/role="switch"/)
  })

  it('a press anywhere on the row toggles the switch', async () => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const changed = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    act(() =>
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <FieldSwitch label="Compact view" checked={false} onChange={changed} />
        </GuiProvider>,
      ),
    )
    act(() => (host.querySelector('[data-slot="field-switch-row"] span') as HTMLElement).click())
    expect(changed).toHaveBeenCalledWith(true)
    act(() => root.unmount())
    host.remove()
  })

  it('without a label it is the bare switch', () => {
    expect(html(<FieldSwitch checked onChange={() => {}} />)).not.toContain('field-switch-row')
  })
})

describe('settings Heading under a compact density', () => {
  it('13px semibold title, the description quiet and clamped, 16 before what follows', () => {
    const compact = html(
      <Density value="compact">
        <Heading title="Members" detail="Who can see records." />
      </Density>,
    )
    expect(compact).toMatch(/_fw-600/)
    expect(compact).toMatch(/_col-aside/)
    expect(compact).toMatch(/_mb-c-space-4/)
    const regular = html(<Heading title="Members" detail="Who can see records." />)
    expect(regular).not.toMatch(/_mb-c-space-4/)
    expect(regular).toMatch(/_col-soft/)
  })
})
