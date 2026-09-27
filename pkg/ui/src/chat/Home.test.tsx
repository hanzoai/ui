// @vitest-environment jsdom

/**
 * Home against a live DOM: one heading, the mark beside it and hidden from
 * assistive tech, the composer under it in the same column, and nothing axe
 * can find. Where it sits on the page is a browser's question — the consumer
 * suite measures it at 390 and 1280.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { Composer } from './Composer'
import { Home } from './Home'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = (ui: React.ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

const q = (sel: string) => host.querySelector<HTMLElement>(sel)

const home = (over: Partial<React.ComponentProps<typeof Home>> = {}) => (
  <Home mark={<span>H</span>} {...over}>
    <Composer inline value="" onChange={() => {}} onSend={() => {}} label="Describe a task" />
  </Home>
)

describe('Home', () => {
  it('asks its question as the page heading, with the mark beside it', () => {
    mount(home())
    const title = q('[data-slot="home-title"]')!
    expect(title.getAttribute('role')).toBe('heading')
    expect(title.getAttribute('aria-level')).toBe('1')
    expect(title.textContent).toBe('What’s up next?')
    expect(q('[data-slot="home-mark"]')!.getAttribute('aria-hidden')).toBe('true')
    expect(host.querySelectorAll('[role="heading"]')).toHaveLength(1)
  })

  it('takes its own question and level, and draws no mark when given none', () => {
    mount(home({ title: 'What’s up next, Dave?', level: 2, mark: undefined }))
    const title = q('[data-slot="home-title"]')!
    expect(title.textContent).toBe('What’s up next, Dave?')
    expect(title.getAttribute('aria-level')).toBe('2')
    expect(q('[data-slot="home-mark"]')).toBeNull()
  })

  it('puts the composer under the question, in the pane', () => {
    mount(home())
    const title = q('[data-slot="home-title"]')!
    const field = q('[data-slot="composer"]')!
    expect(q('[data-slot="home"]')!.contains(field)).toBe(true)
    expect(title.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('has no axe violations', async () => {
    mount(home())
    expect(await audit(host)).toEqual([])
  })
})
