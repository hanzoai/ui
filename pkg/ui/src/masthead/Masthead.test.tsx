// @vitest-environment jsdom

/**
 * hanzo.ai's header, as hanzo.ai draws it and as another host draws it: the
 * same rows, a path going to hanzo.ai and reading as a page there, a host
 * marked ↗, and a row that names the page's own host becoming its own page.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Masthead, type MastheadProps } from './Masthead'
import { HANZO, ONBOARDING } from './nav'

const html = (props: MastheadProps = {}) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      <Masthead {...props} />
    </GuiProvider>,
  )

describe('Masthead on hanzo.ai', () => {
  const out = html()
  it('is the masthead: the name home, five menus, search, Log in and Try Hanzo', () => {
    expect(out).toContain('data-slot="masthead"')
    expect(out).toMatch(/<header[^>]*data-slot="masthead"/)
    expect(out).toMatch(/aria-label="Hanzo AI home"[^>]*href="\/"|href="\/"[^>]*aria-label="Hanzo AI home"/)
    for (const id of ['company', 'research', 'products', 'solutions', 'developers', 'learn', 'login']) expect(out).toContain(`aria-controls="menu-${id}"`)
    expect(out).toContain('aria-label="Search Hanzo or ask AI"')
    expect(out).toContain('>Log in<')
    expect(out).toMatch(new RegExp(`href="${ONBOARDING}"[^>]*>Try Hanzo<`))
  })
})

describe('Masthead on another host', () => {
  const out = html({ origin: HANZO, here: 'https://hanzo.agency' })
  it('sends the name and Try Hanzo to hanzo.ai, in the same tab', () => {
    expect(out).toContain(`href="${HANZO}/"`)
    expect(out).toMatch(new RegExp(`href="${HANZO}${ONBOARDING}"[^>]*>Try Hanzo<`))
    expect(out).not.toMatch(new RegExp(`href="${HANZO}${ONBOARDING}"[^>]*target="_blank"`))
  })
})

describe('Masthead for a reader who is signed in', () => {
  it('offers Open Hanzo, and no Log in', () => {
    const out = html({ origin: HANZO, person: { name: 'Ada' } })
    expect(out).toContain('>Open Hanzo<')
    expect(out).not.toContain('>Log in<')
  })
})

describe('Masthead on the way in', () => {
  it('is the name alone', () => {
    const out = html({ bare: true })
    expect(out).toContain('aria-label="Hanzo AI home"')
    expect(out).not.toContain('aria-controls="menu-research"')
    expect(out).not.toContain('>Try Hanzo<')
  })
})
