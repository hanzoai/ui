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
import { Pagination } from './Pagination'
import { SecretInput } from './SecretInput'
import { FieldText } from './Field'
import { UserMenu, displayName } from './UserMenu'

const html = (node: ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

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
