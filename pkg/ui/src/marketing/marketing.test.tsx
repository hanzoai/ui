// @vitest-environment jsdom

/**
 * The marketing components' contract, asserted on compiled markup: the slot
 * marks, the tokens that became classes, the document a crawler reads. Never on
 * computed style.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { PageLoading } from './PageLoading'

export const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('PageLoading', () => {
  it('is one status region holding one spinner and nothing else', () => {
    const out = html(<PageLoading />)
    expect(out).toMatch(/data-slot="page-loading"/)
    expect(out).toMatch(/role="status"[^>]*aria-label="Loading"|aria-label="Loading"[^>]*role="status"/)
    expect(out.match(/data-slot="spinner"/g)).toHaveLength(1)
    expect(out).not.toMatch(/<(a|button|header|footer|nav)[ >]/)
  })

  it('fills the viewport from tokens, so the frame after it starts the same size', () => {
    const out = html(<PageLoading label="Signing in" />)
    expect(out).toContain('aria-label="Signing in"')
    expect(out).toMatch(/class="[^"]*_minH-100dvh/)
  })
})
