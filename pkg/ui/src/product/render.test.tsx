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
import { Skeleton } from './Skeleton'
import { TooltipAnchor } from './TooltipAnchor'
import { DialogTemplate } from './DialogTemplate'
import { Dialog } from '../backends/gui/dialog'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

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

  it('says it is invalid, and says what is wrong', () => {
    // A red frame is not a message. Without both attributes a required key
    // announces as an ordinary field and the error text beside it is never
    // read out — which is why a validated form could not use this component.
    const plain = html(<SecretInput value="hk" />)
    expect(plain).not.toContain('aria-invalid')
    expect(plain).not.toContain('aria-describedby')

    const bad = html(<SecretInput value="hk" invalid aria-describedby="key-error" />)
    expect(bad).toContain('aria-invalid="true"')
    expect(bad).toContain('aria-describedby="key-error"')
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

/**
 * The three arrangements added in 8.1: a loading placeholder, a one-string
 * tooltip, and the titled dialog every surface was writing by hand. Each is
 * asserted on the thing it PROMISES, not on its markup shape — a snapshot of
 * gui output tells you a class changed, not whether the component works.
 */
describe('Skeleton', () => {
  it('renders the shimmer handle, not a bare grey box', () => {
    // The animation lives in styles/motion.css as `.hz-skeleton`. A placeholder
    // that misses the class is a static block nobody notices is stuck.
    expect(els(html(<Skeleton width={120} />))).toContain('hz-skeleton')
  })

  it('is hidden from a screen reader', () => {
    // A placeholder is scenery. Announcing "loading" mid-page is worse than
    // silence, because the real content is what should be read when it lands.
    expect(els(html(<Skeleton />))).toContain('aria-hidden')
  })

  it('stands in for as many lines as asked, and ends short', () => {
    // A stack of equal bars reads as a table; a real paragraph ends mid-line.
    // gui compiles a width to an atomic class, so the assertion is that the
    // last line's width DIFFERS from the others — never the literal '60%',
    // which never reaches the markup.
    const markup = els(html(<Skeleton.Text lines={3} />))
    expect(markup.match(/hz-skeleton/g)).toHaveLength(3)
    const widths = [...markup.matchAll(/_width-\S+?(?= )/g)].map((m) => m[0])
    expect(new Set(widths.slice(-3)).size).toBeGreaterThan(1)
  })
})

describe('TooltipAnchor', () => {
  it('names the control it wraps, so an icon button is not anonymous', () => {
    // The reason `description` is a string: it is an accessible name as well as
    // a hint, and markup cannot be one.
    expect(els(html(<TooltipAnchor description="Delete agent"><button /></TooltipAnchor>)))
      .toContain('aria-label="Delete agent"')
  })

  it('does not overwrite a name the child already has', () => {
    // Two names on one control is worse than none.
    const markup = els(html(
      <TooltipAnchor description="Delete agent"><button aria-label="Remove" /></TooltipAnchor>,
    ))
    expect(markup).toContain('aria-label="Remove"')
    expect(markup).not.toContain('aria-label="Delete agent"')
  })

  it('leaves the child alone when there is no hint', () => {
    // An absent description costs nothing and needs no branch at the call site.
    expect(els(html(<TooltipAnchor><button id="bare" /></TooltipAnchor>))).toContain('id="bare"')
  })
})

describe('DialogTemplate', () => {
  /**
   * Mounted, not server-rendered. DialogContent portals, and a portal emits
   * NOTHING from `renderToStaticMarkup` — the SSR output is one empty
   * `t_unmounted` span, so every assertion below would pass or fail on the
   * absence of the whole component rather than on its contents.
   */
  const open = (node: ReactNode): string => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    act(() => {
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <Dialog open>{node}</Dialog>
        </GuiProvider>,
      )
    })
    const markup = els(document.body.innerHTML)
    act(() => root.unmount())
    host.remove()
    return markup
  }

  it('renders the title and the confirm it was given', () => {
    const markup = open(
      <DialogTemplate title="Delete agent" confirm={{ label: 'Delete', tone: 'danger' }} />,
    )
    expect(markup).toContain('Delete agent')
    expect(markup).toContain('Delete')
  })

  it('offers a way out by default — a dialog you cannot leave is a trap', () => {
    expect(open(<DialogTemplate title="Delete agent" />)).toContain('Cancel')
  })

  it('drops cancel only when told to', () => {
    expect(open(<DialogTemplate title="Saved" showCancel={false} />)).not.toContain('Cancel')
  })

  it('disables BOTH actions while busy, not just the confirm', () => {
    // A slow request that can still be cancelled halfway into itself is the
    // failure this prevents.
    const markup = open(
      <DialogTemplate title="Deleting" busy confirm={{ label: 'Delete' }} />,
    )
    expect(markup.match(/disabled/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  })
})
