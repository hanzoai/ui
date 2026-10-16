// @vitest-environment jsdom

/**
 * The two fields ask for the placeholder token and the full ink, by name.
 *
 * gui paints `::placeholder` from `--t_placeholderColor`, which it writes inline
 * from `placeholderTextColor`; the colours themselves are held in
 * gui-config.test.ts. This holds the wiring: a field that named `$soft` again
 * would paint a 67% grey hint under an 80% grey value, the pair a customer
 * read as a typed name.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Input } from './input'
import { Textarea } from './textarea'

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

const field = (ui: React.ReactNode, tag: 'input' | 'textarea') => {
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })
  const el = host.querySelector(tag)
  expect(el, `no <${tag}> rendered`).not.toBeNull()
  return el as HTMLElement
}

describe.each([
  ['Input', () => <Input placeholder="Your name" />, 'input'],
  ['Textarea', () => <Textarea placeholder="Anything that would help prepare?" />, 'textarea'],
] as const)('%s', (_, render, tag) => {
  it('paints its placeholder from the placeholder token', () => {
    const el = field(render(), tag)
    expect(el.style.getPropertyValue('--t_placeholderColor')).toBe('var(--placeholderColor)')
  })

  it('a caller can still name another', () => {
    const el = field(
      tag === 'input' ? <Input placeholder="x" placeholderTextColor="$ink" /> : <Textarea placeholder="x" placeholderTextColor="$ink" />,
      tag,
    )
    expect(el.style.getPropertyValue('--t_placeholderColor')).toBe('var(--ink)')
  })
})
