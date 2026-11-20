// @vitest-environment jsdom

/** A user turn is a tight bubble: its actions sit outside it, and a turn with none leaves no empty row. */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'
import type { ReactNode } from 'react'

import config from '../gui-config'
import { Message } from './Message'

const dom = (node: ReactNode) => {
  const host = document.createElement('div')
  host.innerHTML = renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )
  return host
}

describe('Message, a user turn', () => {
  it('draws no row under the bubble when it has no actions', () => {
    const host = dom(<Message role="user">hello</Message>)
    expect(host.querySelector('[data-slot="message-actions"]')).toBeNull()
    expect(host.querySelector('[data-bubble="true"]')?.textContent).toBe('hello')
  })

  it('puts its actions below the bubble, not inside it', () => {
    const host = dom(
      <Message role="user" actions={<button type="button">Copy</button>}>
        hello
      </Message>,
    )
    const actions = host.querySelector('[data-slot="message-actions"]')!
    expect(actions.textContent).toBe('Copy')
    expect(host.querySelector('[data-bubble="true"]')!.contains(actions)).toBe(false)
  })

  it('keeps an assistant turn bubble-less, with its actions beneath its words', () => {
    const host = dom(
      <Message role="assistant" actions={<button type="button">Copy</button>}>
        hi
      </Message>,
    )
    expect(host.querySelector('[data-bubble]')).toBeNull()
    expect(host.querySelector('[data-slot="message-body"]')!.contains(host.querySelector('[data-slot="message-actions"]'))).toBe(true)
  })
})
