// @vitest-environment jsdom

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { IntervalToggle, Page } from './frame'
import { CATALOG } from './catalog.fixture'
import { adopt } from './plans'
import { CreateAccount } from './account'
import { Plans, Pro, Seats, UseCards } from './screens'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="light">
      {node}
    </GuiProvider>,
  )

const noop = () => {}

beforeAll(() => adopt(CATALOG))

describe('Page', () => {
  it('has a title and no progress bar or step counter', () => {
    const out = html(<Page site="Hanzo" title="How are you planning to use Hanzo?" />).replace(/<style[\s\S]*?<\/style>/g, '')
    expect(out).toContain('How are you planning to use Hanzo?')
    expect(out).not.toMatch(/progress|step \d|of \d/i)
    expect(out).toContain('<h1')
  })

  it('offers a labelled way back only when there is one', () => {
    expect(html(<Page site="Hanzo" title="x" back={noop} />)).toContain('aria-label="Back"')
    expect(html(<Page site="Hanzo" title="x" />)).not.toContain('aria-label="Back"')
  })
})

describe('use', () => {
  it('asks personal or team first, and shows Team and Enterprise only after "With my team"', () => {
    const out = html(<UseCards onPick={noop} />)
    expect(out).toContain('For personal use')
    expect(out).toContain('With my team')
    expect(out).toContain('For individuals who want to build and experiment with their own projects')
    expect(out).not.toContain('Enterprise')
  })
})

describe('plans', () => {
  it('lists Free, Pro and Max at the catalog prices, Free chat only, with the yearly toggle on Pro', () => {
    const out = html(<Plans interval="monthly" setInterval={noop} onFree={noop} onPick={noop} />)
    expect(out).toContain('Use Hanzo for free')
    expect(out).toContain('Get Pro plan')
    expect(out).toContain('Get Max plan')
    expect(out).toContain('$20')
    expect(out).toContain('From')
    expect(out).toContain('$100')
    expect(out).toContain('aria-label="Billing interval for Pro"')
    expect(out).toContain('Save 17%')
    expect(out.match(/No commitment · Cancel anytime/g)).toHaveLength(2)
    expect(out).not.toMatch(/Max 5x|Upgrade to Pro|\$19|\$99/)
  })

  it('shows the annual price as the catalog’s year over twelve', () => {
    expect(html(<Plans interval="annual" setInterval={noop} onFree={noop} onPick={noop} />)).toContain('$16.67')
  })

  it('names the interval toggle for screen readers', () => {
    expect(html(<IntervalToggle interval="monthly" onChange={noop} name="Pro" save={17} />)).toContain('aria-label="Billing interval for Pro"')
  })
})

describe('pro', () => {
  it('recommends one plan at the catalog price, with the way to stay free and the way to see the rest', () => {
    const out = html(<Pro interval="monthly" setInterval={noop} onPro={noop} onFree={noop} onAll={noop} />)
    expect(out).toContain('Recommended')
    expect(out).toContain('Get Pro plan')
    expect(out).toContain('Use Hanzo for free')
    expect(out).toContain('View all plans')
    expect(out).toContain('No commitment · Cancel anytime')
    expect(out).toContain('$20')
    expect(out).toContain('Yearly · Save 17%')
    expect(out).not.toMatch(/Max|Free plan|Max 5x/)
  })

  it('prints a line ending in a colon as a heading, not a ticked feature', () => {
    const out = html(<Pro interval="monthly" setInterval={noop} onPro={noop} onFree={noop} onAll={noop} />)
    expect(out).toContain('Everything in Free and:')
    expect(out.match(/Everything in Free and:/g)).toHaveLength(1)
  })

  it('shows the annual price as the catalog’s year over twelve', () => {
    expect(html(<Pro interval="annual" setInterval={noop} onPro={noop} onFree={noop} onAll={noop} />)).toContain('$16.67')
  })
})

describe('create account', () => {
  const out = html(<CreateAccount email="a@b.co" onCreate={noop} onOther={noop} />)

  it('asks one unticked box, names both documents and the age, and offers Create account', () => {
    expect(out).toContain('Let’s create your account')
    expect(out).toContain('A few things for you to review')
    expect(out).toContain('href="/terms"')
    expect(out).toContain('href="/aup"')
    expect(out).toContain('at least 18 years of age')
    expect(out).not.toMatch(/aria-checked="true"|data-state="checked"/)
    expect(out).toContain('Create account')
  })

  it('keeps the button off until the box is ticked', () => {
    const open = out.replace(/<style[\s\S]*?<\/style>/g, '').match(/(<button\b[^>]*>)(?:(?!<\/button>)[\s\S])*?Create account/)
    expect(open?.[1]).toMatch(/disabled/)
  })

  it('says which address was verified and offers another', () => {
    expect(out).toContain('Email verified as a@b.co')
    expect(out).toContain('Use a different email')
  })
})

describe('seats', () => {
  it('prices two Standard seats at the catalog’s Team price and shows what is due today', () => {
    const out = html(<Seats interval="monthly" setInterval={noop} value={{ plan: 'team_standard', seats: 2 }} setValue={noop} onContinue={noop} onEnterprise={noop} />)
    expect(out).toContain('2 Standard seats')
    expect(out).toContain('$50.00')
    expect(out).toContain('$25.00 per seat /month')
    expect(out).toContain('Total due today')
    expect(out).toContain('Adjust seats')
    expect(out).toContain('role="radiogroup"')
  })
})

describe('components, not a stylesheet', () => {
  const dir = dirname(fileURLToPath(import.meta.url))
  const files = [...readdirSync(dir), ...readdirSync(join(dir, '../auth')).map((f) => `../auth/${f}`)].filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))

  it('carries no class vocabulary, no className and no stylesheet', () => {
    expect(files.length).toBeGreaterThan(5)
    for (const f of files) {
      const src = readFileSync(join(dir, f), 'utf8')
      expect(src, f).not.toMatch(/className|hz-[a-z]/)
    }
    expect(readdirSync(dir).filter((f) => f.endsWith('.css'))).toEqual([])
    expect(readdirSync(join(dir, '../auth')).filter((f) => f.endsWith('.css'))).toEqual([])
  })

  it('draws no hz- class on the page', () => {
    const out = html(<Plans interval="monthly" setInterval={noop} onFree={noop} onPick={noop} />)
    expect(out).not.toMatch(/class="[^"]*\bhz-/)
  })
})
