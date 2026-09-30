// @vitest-environment jsdom

/** ChoiceCard is a radio: named, checked by attribute, and a group that says what it groups. */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

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
