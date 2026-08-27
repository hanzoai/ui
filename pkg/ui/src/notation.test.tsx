/**
 * Class notation works on every component, not on some of them.
 *
 * Half the library read it (anything through Box) and half handed it to the DOM
 * (Button, Badge, Link, Sheet, the product menus), so a caller had to know which
 * kind each one was — and got no error when they guessed wrong, just an element
 * with two tokens on it and nothing behind them.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from './gui-config'
import { Button } from './backends/gui/button'
import { Badge } from './backends/gui/badge'

const html = (ui: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config as never} defaultTheme="dark">{ui}</GuiProvider>)

/** The class attribute of one named element — gui wraps everything in a span
 *  of its own, so the first `class=` in the markup is never the one asked for. */
const classes = (markup: string, tag: string) =>
  new RegExp(`<${tag}\\b[^>]*?class="([^"]*)"`).exec(markup)?.[1] ?? ''

describe('a component reads the notation it is given', () => {
  it('Button converts it instead of forwarding it', () => {
    const out = html(<Button className="w-full mt-4">go</Button>)
    expect(out).not.toContain('w-full')
    expect(out).not.toContain('mt-4')
  })

  it('Button keeps the classes that are real rules', () => {
    // `btn`, `btn-link`, `btn-default` are selectors in the shipped stylesheet;
    // converting them away would unstyle every host that hooks them.
    const out = html(<Button variant="link" className="w-full">go</Button>)
    expect(classes(out, 'button')).toContain('btn')
    expect(classes(out, 'button')).toContain('btn-link')
  })

  it('Badge does too', () => {
    expect(html(<Badge className="w-full">new</Badge>)).not.toContain('w-full')
  })
})
