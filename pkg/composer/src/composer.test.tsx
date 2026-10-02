import { createGui, GuiProvider } from '@hanzo/gui'
import { defaultConfig } from '@hanzogui/config/v5'
import type { ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Composer, Control, Field, SHEET, SLOT } from './index'

const config = createGui(defaultConfig)

const html = (ui: ReactNode) =>
  renderToString(
    <GuiProvider config={config} defaultTheme="dark">
      <html>
        <head />
        <body>{ui}</body>
      </html>
    </GuiProvider>,
  )

const page = html(
  <Composer render="form" band={1.5} halo={8} control={38}>
    <div>
      <Field placeholder="Ask" aria-label="Ask" />
      <Control type="button" aria-label="Mic" />
      <Control type="submit" aria-label="Send" fill />
    </div>
  </Composer>,
)

describe('the composer draws itself', () => {
  it('stamps no hz- class and sets no hz- property', () => {
    expect(page).not.toMatch(/hz-/)
    expect(SHEET).not.toMatch(/hz-/)
  })

  it('marks the host, both layers and each control with a data-slot', () => {
    expect(page).toContain(`data-slot="${SLOT}"`)
    expect(page).toContain('data-slot="prism-ring"')
    expect(page).toContain('data-slot="prism-halo"')
    expect(page.match(/data-slot="prism-control"/g)?.length).toBe(2)
  })

  it('renders the host as the element it is asked for', () => {
    expect(page).toMatch(/<form[^>]*data-slot="prism"/)
  })

  it('hoists the sweep once, keyed on data-slots and never a class', () => {
    expect(page.match(/prism-orbit/g)?.length).toBeGreaterThan(0)
    expect(SHEET).not.toMatch(/(^|[\s,{(])\.[a-z]/)
    for (const q of [
      'prefers-reduced-motion: reduce',
      'prefers-reduced-transparency: reduce',
      'prefers-contrast: more',
      'forced-colors: active',
    ])
      expect(SHEET).toContain(`@media (${q})`)
  })

  it('sizes the controls from the host, scaled by density and floored at 24px', () => {
    expect(page).toContain('max(24px, calc(38px * var(--density, 1)))')
  })

  it('lets a control outside a composer name its own size', () => {
    expect(html(<Control size={30} aria-label="Mic" />)).toContain('max(24px, calc(30px * var(--density, 1)))')
  })

  it('shapes a control another package draws, keeping its children', () => {
    const Mic = ({ children, ...rest }: { children?: (s: string) => ReactNode }) => (
      <button type="button" data-mic {...rest}>
        {children?.('idle')}
      </button>
    )
    const out = html(
      <Composer>
        <Control asChild aria-label="Mic">
          <Mic>{(state) => <i data-state={state} />}</Mic>
        </Control>
      </Composer>,
    )
    const tag = out.match(/<button[^>]*data-mic[^>]*>/)?.[0] ?? ''
    expect(tag).toContain('data-slot="prism-control"')
    // The paint reaches the child: the circle and the ground, not only the size.
    expect(tag).toMatch(/class="[^"]*_btlr-[^"]*"/)
    expect(tag).toMatch(/class="[^"]*_bg-[^"]*"/)
    expect(out).toContain('<i data-state="idle"></i>')
  })
})
