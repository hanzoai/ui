// @vitest-environment jsdom

/**
 * The chat shell renders. Same reason the gui backend has this test: a build, a
 * typecheck and a pack all pass on a component that throws on first paint.
 *
 * `Composer` is absent here and that is not an oversight — it draws its send
 * control with a `@hanzogui/lucide-icons-2` glyph, and under vitest every themed
 * icon throws `Missing theme` (vitest resolves `@hanzogui/web` to its `src`, and
 * `usePropsAndStyle` finds no theme there on either a server or a client render).
 * The same wall makes `render.test.tsx`'s whole-surface case red on main, because
 * it mounts Checkbox and Select. Composer is covered end-to-end against the built
 * package instead — see `pkg/ui/e2e/chat.spec.ts`.
 */
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Message, Thread } from './index'

const html = (node: ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('chat shell renders', () => {
  it('marks each turn with its role', () => {
    const markup = html(
      <Thread>
        <Message role="user">ask</Message>
        <Message role="assistant" busy>
          answer
        </Message>
        <Message role="system">note</Message>
      </Thread>,
    )
    for (const r of ['user', 'assistant', 'system']) expect(markup, r).toContain(`data-role="${r}"`)
    for (const s of ['thread', 'thread-column', 'message', 'message-body', 'message-busy'])
      expect(markup, s).toContain(`data-slot="${s}"`)
    for (const t of ['ask', 'answer', 'note']) expect(markup, t).toContain(t)
  })

  it('bubbles a user turn and gives an assistant turn the full measure', () => {
    expect(html(<Message role="user">hi</Message>)).toContain('data-bubble="true"')
    expect(html(<Message role="assistant">hi</Message>)).not.toContain('data-bubble')
  })

  it('does not leak gui style props onto the DOM', () => {
    const markup = html(
      <Thread>
        <Message role="user">hi</Message>
      </Thread>,
    )
    for (const leak of ['backgroundcolor=', 'maxw=', 'hoverstyle=', 'flexdirection='])
      expect(markup, leak).not.toContain(leak)
  })
})
