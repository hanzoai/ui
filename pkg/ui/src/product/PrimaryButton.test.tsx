// @vitest-environment jsdom

/**
 * PrimaryButton at the two densities: unchanged on a regular surface, the
 * record surfaces' main action on a compact one (semibold, a 12px gutter, the
 * small shadow). Read off the server render, where each is an atomic class.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Density } from '../backends/gui/density'
import { PrimaryButton } from './PrimaryButton'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const button = (markup: string) => markup.match(/<button[^>]*>/)?.[0] ?? ''

describe('PrimaryButton', () => {
  it('a regular surface draws it as it always has', () => {
    const el = button(html(<PrimaryButton>Continue</PrimaryButton>))
    expect(el).toMatch(/_bg-primary/)
    expect(el).not.toMatch(/_bxsh-/)
  })

  it('compact: semibold, a 12px gutter and the small shadow', () => {
    const markup = html(
      <Density value="compact">
        <PrimaryButton>Continue</PrimaryButton>
      </Density>,
    )
    const el = button(markup)
    expect(el).toMatch(/_bxsh-/)
    expect(el).toMatch(/_pl-c-space-3/)
    expect(markup).toMatch(/_fw-600/)
  })
})
