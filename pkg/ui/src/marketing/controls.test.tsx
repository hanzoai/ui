// @vitest-environment jsdom

import { act, useEffect, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import { Link } from '../backends/gui/link'
import config from '../gui-config'
import { Action, Chip, More } from './controls'

// A router link keeps state and runs an effect, as a framework's does.
const Router = ({ href, children }: { href: string; children?: ReactNode }) => {
  const [seen, see] = useState(0)
  useEffect(() => see((n) => n + 1), [href])
  return <a href={href} data-seen={seen}>{children}</a>
}

const draw = (href: string, Control: typeof Action) => (
  <GuiProvider config={config} defaultTheme="dark">
    <Link value={Router}>
      <Control href={href}>go</Control>
    </Link>
  </GuiProvider>
)

describe('a control whose address changes kind', () => {
  it.each([
    ['Action', Action],
    ['Chip', Chip],
    ['More', More],
  ])('%s keeps its hooks from an anchor to a route', async (_name, Control) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const root = createRoot(document.createElement('div'))
    await act(async () => root.render(draw('#builds', Control as typeof Action)))
    await act(async () => root.render(draw('/chat', Control as typeof Action)))
    await act(async () => root.render(draw('#builds', Control as typeof Action)))
    expect(errors.mock.calls.map((c) => String(c[0])).filter((m) => /hook/i.test(m))).toEqual([])
    errors.mockRestore()
    await act(async () => root.unmount())
  })
})
