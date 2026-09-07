// @vitest-environment jsdom

/**
 * CodeTabs switches which snippet is visible when a different tab is pressed,
 * and falls back to a message when it is given no tabs at all.
 *
 * Imports `./code-tabs` directly, not the backend barrel, so a sibling
 * component's dependency moving cannot fail this.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { CodeTabs, type CodeTabsTab } from './code-tabs'

// jsdom has no ResizeObserver, and @hanzogui/tabs measures its indicator with
// one on mount — a live render needs the shim, a static one never runs it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    triggers: () => [...host.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]')],
    lines: () => [...host.querySelectorAll<HTMLElement>('[data-slot="code-block-line"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tabs: CodeTabsTab[] = [
  { label: 'JavaScript', language: 'javascript', code: 'console.log("js")' },
  { label: 'TypeScript', language: 'typescript', code: 'console.log("ts" as const)' },
  { label: 'Python', language: 'python', code: 'print("py")' },
]

describe('CodeTabs', () => {
  it('renders one trigger per tab and shows the default tab’s code', () => {
    const markup = html(<CodeTabs tabs={tabs} />)

    const triggers = [...markup.matchAll(/<[a-z0-9]+[^>]*data-slot="tabs-trigger"[^>]*>/g)]
    expect(triggers).toHaveLength(3)
    expect(markup).toContain('console.log(&quot;js&quot;)')
  })

  it('honours defaultTab', () => {
    const markup = html(<CodeTabs tabs={tabs} defaultTab={2} />)

    expect(markup).toContain('print(&quot;py&quot;)')
  })

  it('switches the visible code when a different tab is pressed', () => {
    const view = mount(<CodeTabs tabs={tabs} />)

    expect(view.host.textContent).toContain('console.log("js")')

    act(() => {
      view.triggers()[1]!.click()
    })

    expect(view.host.textContent).toContain('console.log("ts" as const)')
    expect(view.host.textContent).not.toContain('print("py")')

    view.cleanup()
  })

  it('shows a language badge per active tab', () => {
    const view = mount(<CodeTabs tabs={tabs} />)

    expect(view.host.querySelector('[data-slot="code-block-language"]')?.textContent).toBe('javascript')

    act(() => {
      view.triggers()[2]!.click()
    })

    expect(view.host.querySelector('[data-slot="code-block-language"]')?.textContent).toBe('python')

    view.cleanup()
  })

  it('falls back to a message when there are no tabs', () => {
    const markup = html(<CodeTabs tabs={[]} />)

    expect(markup).toContain('No code tabs available')
    expect(markup).not.toContain('data-slot="tabs-trigger"')
  })
})
