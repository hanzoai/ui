// @vitest-environment jsdom

/**
 * CreditCard is a static face: no interaction to assert, so the coverage is
 * that every documented prop actually reaches the markup, that the two
 * variants read as two different `data-variant`s, and that the CVV badge only
 * shows up when a cvv is given.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { CreditCard } from './credit-card'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('CreditCard', () => {
  it('renders the placeholder face with no props', () => {
    const markup = html(<CreditCard />)

    expect(tag(markup, 'credit-card')).not.toBe('')
    expect(markup).toContain('data-variant="default"')
    expect(markup).toContain('•••• •••• •••• ••••')
    expect(markup).toContain('CARD HOLDER')
    expect(markup).toContain('MM/YY')
    // No cvv was passed, so no badge.
    expect(tag(markup, 'credit-card-cvv')).toBe('')
  })

  it('prints every field it is given', () => {
    const markup = html(
      <CreditCard number="4111 1111 1111 1111" name="ADA LOVELACE" expiry="09/30" cvv="123" />,
    )

    expect(markup).toContain('4111 1111 1111 1111')
    expect(markup).toContain('ADA LOVELACE')
    expect(markup).toContain('09/30')
    expect(tag(markup, 'credit-card-cvv')).not.toBe('')
    expect(markup).toContain('CVV: 123')
  })

  it('switches to the minimal variant on request', () => {
    const markup = html(<CreditCard variant="minimal" />)

    expect(markup).toContain('data-variant="minimal"')
  })

  it('defaults to the default variant when passed null', () => {
    const markup = html(<CreditCard variant={null} />)

    expect(markup).toContain('data-variant="default"')
  })
})
