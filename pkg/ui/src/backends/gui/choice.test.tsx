// @vitest-environment jsdom

/** ChoiceCard is a radio: named, checked by attribute, and a group that says what it groups. */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import { Density } from './density'
import config from '../../gui-config'
import { ChoiceCard, ChoiceGroup } from './choice'
import { Stepper } from './stepper'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="light">
      {node}
    </GuiProvider>,
  )

describe('Choice', () => {
  it('is a radio in a named radiogroup, checked by aria-checked', () => {
    const out = html(
      <ChoiceGroup label="Billing interval">
        <ChoiceCard selected onSelect={() => {}}>
          Monthly
        </ChoiceCard>
        <ChoiceCard selected={false} onSelect={() => {}}>
          Annually
        </ChoiceCard>
      </ChoiceGroup>,
    )
    expect(out).toContain('role="radiogroup"')
    expect(out).toContain('aria-label="Billing interval"')
    expect(out.match(/role="radio"/g)).toHaveLength(2)
    expect(out).toContain('aria-checked="true"')
    expect(out).toContain('aria-checked="false"')
    expect(out).toContain('data-slot="choice"')
  })

  it('is focusable, so the keyboard reaches it', () => {
    expect(html(<ChoiceCard selected={false} onSelect={() => {}}>x</ChoiceCard>)).toContain('tabindex="0"')
  })
})

describe('Stepper', () => {
  it('names both buttons for what it counts and disables at the bounds', () => {
    const out = html(<Stepper label="Standard seats" value={2} min={2} max={150} onChange={() => {}} />)
    expect(out).toContain('aria-label="Fewer standard seats"')
    expect(out).toContain('aria-label="More standard seats"')
    expect(out).toContain('role="group"')
    expect(out).toContain('aria-live="polite"')
    // at the floor, "Fewer" is disabled and "More" is not
    const fewer = out.match(/<button[^>]*aria-label="Fewer standard seats"[^>]*>/)![0]
    const more = out.match(/<button[^>]*aria-label="More standard seats"[^>]*>/)![0]
    expect(fewer).toMatch(/disabled/)
    expect(more).not.toMatch(/disabled/)
  })
})

describe('ChoiceCard, the radio card', () => {
  const card = (m: string) => m.match(/<div[^>]*data-slot="choice"[^>]*>/)?.[0] ?? ''
  const mark = (m: string) => m.match(/<div[^>]*data-slot="choice-mark"[^>]*>/)?.[0] ?? ''

  it('draws no corner radio unless asked', () => {
    expect(mark(html(<ChoiceCard selected onSelect={() => {}}>x</ChoiceCard>))).toBe('')
  })

  it('indicator: a radio 8px in from the top-end corner, filled when picked', () => {
    const on = mark(html(<ChoiceCard indicator selected onSelect={() => {}}>x</ChoiceCard>))
    expect(on).toMatch(/_pos-absolute/)
    expect(on).toMatch(/_t-8px/)
    expect(on).toMatch(/_insetInlineEnd-8px/)
    expect(on).toMatch(/_bg-primary/)
    expect(on).toContain('aria-hidden="true"')
    const off = mark(html(<ChoiceCard indicator selected={false} onSelect={() => {}}>x</ChoiceCard>))
    expect(off).toMatch(/_bg-transparent/)
    // The text clears the mark.
    expect(card(html(<ChoiceCard indicator selected onSelect={() => {}}>x</ChoiceCard>))).toMatch(/_paddingInlineEnd-32px/)
  })

  it('compact: 8px radius, 16 by 12 padding, the panel ground', () => {
    const el = card(
      html(
        <Density value="compact">
          <ChoiceCard selected={false} onSelect={() => {}}>
            x
          </ChoiceCard>
        </Density>,
      ),
    )
    expect(el).toMatch(/_bblr-c-radius-3/)
    expect(el).toMatch(/_pt-c-space-4/)
    expect(el).toMatch(/_pl-c-space-3/)
    expect(el).toMatch(/_bg-panel/)
  })
})
