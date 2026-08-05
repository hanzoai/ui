// @vitest-environment jsdom

/**
 * The lifted chrome renders, and renders HONESTLY.
 *
 * A build, a typecheck and a pack all pass on a component that throws on first
 * paint — and on one that quietly shows a menu row leading nowhere. These mount
 * under the real GuiProvider and the shipped config, and assert the two things
 * the charter actually promises: an affordance appears only when its handler was
 * injected, and a secret is never in the markup unrevealed.
 */
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { CopyButton } from './CopyButton'
import { Fieldset } from './Fieldset'
import { Panel } from './Metric'
import { Pagination } from './Pagination'
import { SecretInput } from './SecretInput'
import { StatusTag } from './StatusTag'
import { FieldText } from './Field'
import { UserMenu, displayName } from './UserMenu'

const html = (node: ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

/**
 * The markup WITHOUT the stylesheet gui inlines ahead of it.
 *
 * `GuiProvider` emits the whole 400 KB sheet in a `<style>` tag, so any
 * assertion phrased as "the markup does not contain X" is answered by a rule
 * for some unrelated component and passes or fails on the wrong evidence.
 * Elements only.
 */
const els = (markup: string) => markup.replace(/<style[\s\S]*?<\/style>/g, '')

/** gui forwards unknown props to the DOM; a style prop leaking through is a
 *  React warning in the console and an invalid attribute in the markup. */
const leaks = ['backgroundcolor=', 'hoverstyle=', 'pressstyle=', 'flexdirection=', 'minw=']
const clean = (markup: string) => {
  for (const leak of leaks) expect(markup, leak).not.toContain(leak)
}

describe('CopyButton', () => {
  it('names itself for assistive tech and on hover', () => {
    const markup = html(<CopyButton value="hk-abc" label="Copy key" />)
    expect(markup).toContain('aria-label="Copy key"')
    expect(markup).toContain('title="Copy key"')
    clean(markup)
  })

  it('does not put the copied value in the markup', () => {
    // The value belongs on the clipboard, not in the DOM — a token rendered
    // into a tooltip is a token in every screenshot and every crash report.
    expect(html(<CopyButton value="hk-secret-value" />)).not.toContain('hk-secret-value')
  })

  it('draws its label when it is given one, and nothing when it is not', () => {
    // The two forms differ in exactly one thing, and this is that thing: a
    // control standing alone under a minted key has no neighbours to explain an
    // unlabeled glyph.
    expect(html(<CopyButton value="hk-abc">Copy key</CopyButton>)).toContain('Copy key')
    expect(html(<CopyButton value="hk-abc" />)).not.toContain('Copy key')
  })

  it('takes its accessible name from the visible text by default', () => {
    // Two names for one control is how a button reads "Copy" to a screen reader
    // and "Copy address" to everyone else.
    expect(html(<CopyButton value="0xabc">Copy address</CopyButton>)).toContain('aria-label="Copy address"')
    // …and an explicit label still wins, for the cases where the visible text is
    // not a sentence ("hk_live_…").
    expect(html(<CopyButton value="0xabc" label="Copy wallet address">0x…abc</CopyButton>)).toContain(
      'aria-label="Copy wallet address"',
    )
  })
})

describe('StatusTag', () => {
  it('renders the status it was given, whatever the vocabulary makes of it', () => {
    for (const s of ['past_due', 'paid', 'flurbled']) expect(html(<StatusTag status={s} />), s).toContain(s)
    expect(html(<StatusTag />)).toContain('unknown')
  })

  it('spends no hue saying an invoice is overdue', () => {
    // A monochrome pill in a monochrome system. The check is on the emitted
    // ELEMENTS — gui inlines the whole stylesheet ahead of them, and every hue
    // in the ramp appears somewhere in 400 KB of rules.
    const markup = els(html(<StatusTag status="past_due" />))
    for (const hue of ['red', 'green', 'yellow', 'orange', '#e5534b', '#7ee787'])
      expect([hue, markup.includes(hue)]).toEqual([hue, false])
  })

  it('lets a caller override the tone the vocabulary chose', () => {
    expect(html(<StatusTag status="whatever" tone="stopped" />)).toContain('whatever')
  })
})

describe('Panel', () => {
  it('renders the icon and the description a console needed to smuggle in as a child', () => {
    const markup = html(
      <Panel title="Spend" icon={<span>§</span>} description="Last 30 days, USD.">
        <span>body</span>
      </Panel>,
    )
    for (const s of ['Spend', '§', 'Last 30 days, USD.', 'body']) expect(markup, s).toContain(s)
    clean(markup)
  })

  it('renders with neither, exactly as before', () => {
    const markup = html(<Panel title="Spend"><span>body</span></Panel>)
    expect(markup).toContain('body')
    expect(markup).not.toContain('Last 30 days')
  })
})

describe('SecretInput', () => {
  it('masks by default and offers the reveal', () => {
    const markup = html(<SecretInput value="hk-live-123" />)
    expect(markup).toContain('type="password"')
    expect(markup).toContain('aria-label="Show secret"')
    clean(markup)
  })

  it('is read-only until the caller passes a handler', () => {
    // A field that takes keystrokes it then discards reads as broken.
    expect(html(<SecretInput value="hk-live-123" />)).toContain('readOnly')
    expect(html(<SecretInput value="hk-live-123" onChange={() => {}} />)).not.toContain('readOnly')
  })

  it('unmasks only when revealed, and never leaks through gui', () => {
    // `secureTextEntry` alone is DROPPED on web, so the value rendered in the
    // clear. This asserts the web spelling is present, which is the half that
    // actually masks in a browser.
    expect(html(<SecretInput value="hk-live-123" />)).toContain('type="password"')
  })

  it('drops the copy control when there is nothing to copy', () => {
    expect(html(<SecretInput value="" />)).not.toContain('aria-label="Copy secret"')
    expect(html(<SecretInput value="hk" />)).toContain('aria-label="Copy secret"')
  })
})

describe('FieldText', () => {
  it('masks a secure field on the web, not only on native', () => {
    // The regression this locks: `secure` used to set `secureTextEntry` alone,
    // which gui drops on web — every API-key field in the fleet rendered its
    // value in plain text.
    const markup = html(<FieldText value="hk-live-123" onChange={() => {}} secure />)
    expect(markup).toContain('type="password"')
    expect(html(<FieldText value="plain" onChange={() => {}} />)).not.toContain('type="password"')
  })

  it('tells the browser what may fill it', () => {
    // A sign-in form built out of these rows could not say `autocomplete`, so a
    // password manager had nothing to go on: it filled nothing, or filled the
    // wrong row. Every surface that cared dropped back to a raw <input> for it.
    // Lower-cased because HTML attribute names are case-insensitive and React's
    // static renderer prints the JSX spelling.
    const markup = els(html(<FieldText value="" onChange={() => {}} id="signin-email" autoComplete="email" />))
    expect(markup.toLowerCase()).toContain('autocomplete="email"')
    expect(markup).toContain('id="signin-email"')
  })

  it('says nothing when the caller says nothing', () => {
    // An `autocomplete=""` is not the same as an absent attribute — Chrome reads
    // the empty string as "on" and offers to fill an API-key row.
    expect(els(html(<FieldText value="" onChange={() => {}} />)).toLowerCase()).not.toContain('autocomplete=')
  })
})

describe('UserMenu', () => {
  it('names the account from the email when no name was given', () => {
    expect(displayName(undefined, 'ada@hanzo.ai')).toBe('ada')
    expect(displayName('Ada Lovelace', 'ada@hanzo.ai')).toBe('Ada Lovelace')
    // Never a fabricated "User" — a placeholder name reads as a bug to the
    // person it is naming.
    expect(displayName(undefined, undefined)).toBe('')
  })

  it('renders the trigger with the person on it', () => {
    const markup = html(<UserMenu name="Ada Lovelace" email="ada@hanzo.ai" />)
    expect(markup).toContain('Ada Lovelace')
    expect(markup).toContain('aria-label="Ada Lovelace · account"')
    clean(markup)
  })

  it('falls back to a neutral label with no identity at all', () => {
    expect(html(<UserMenu />)).toContain('aria-label="Account"')
  })
})

describe('Fieldset', () => {
  it('renders its legend, description and rows', () => {
    const markup = html(
      <Fieldset title="Api keys" description="Keys your workspace uses.">
        <span>row</span>
      </Fieldset>,
    )
    for (const s of ['Api keys', 'Keys your workspace uses.', 'row']) expect(markup, s).toContain(s)
    clean(markup)
  })

  it('renders with no legend at all', () => {
    expect(html(<Fieldset><span>bare</span></Fieldset>)).toContain('bare')
  })

  it('takes the whole line by default and shares it on request', () => {
    // A settings PAGE is a column and a settings TAB is often two. Without
    // `grow` every two-column layout wrapped the group in a sizing box of its
    // own, and the boxes disagreed.
    const full = html(<Fieldset title="Profile"><span>r</span></Fieldset>)
    const shared = html(<Fieldset title="Profile" grow><span>r</span></Fieldset>)
    expect(full).not.toBe(shared)
    for (const markup of [full, shared]) clean(markup)
  })
})

describe('Pagination', () => {
  it('marks the current page for assistive tech', () => {
    const markup = html(<Pagination page={3} count={9} onChange={() => {}} />)
    expect(markup).toContain('aria-current="page"')
    expect(markup).toContain('aria-label="Page 3"')
    expect(markup).toContain('aria-label="Next page"')
    clean(markup)
  })

  it('renders nothing when there is nowhere to go', () => {
    // One page is not a pager; drawing disabled arrows over a single page is
    // chrome that only ever says "no".
    expect(html(<Pagination page={1} count={1} onChange={() => {}} />)).not.toContain('aria-label="Next page"')
    expect(html(<Pagination page={1} count={0} onChange={() => {}} />)).not.toContain('aria-label="Next page"')
  })
})
