// @vitest-environment jsdom

/**
 * The marketing components' contract, asserted on compiled markup: the slot
 * marks, the tokens that became classes, the document a crawler reads. Never on
 * computed style.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { PageLoading } from './PageLoading'

export const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('PageLoading', () => {
  it('is one status region holding one spinner and nothing else', () => {
    const out = html(<PageLoading />)
    expect(out).toMatch(/data-slot="page-loading"/)
    expect(out).toMatch(/role="status"[^>]*aria-label="Loading"|aria-label="Loading"[^>]*role="status"/)
    expect(out.match(/data-slot="spinner"/g)).toHaveLength(1)
    expect(out).not.toMatch(/<(a|button|header|footer|nav)[ >]/)
  })

  it('fills the viewport from tokens, so the frame after it starts the same size', () => {
    const out = html(<PageLoading label="Signing in" />)
    expect(out).toContain('aria-label="Signing in"')
    expect(out).toMatch(/class="[^"]*_minH-100dvh/)
  })
})

import { ClosingCta } from './ClosingCta'
import { Faq } from './Faq'
import { Hero } from './Hero'
import { Media } from './Media'
import { Plans } from './Plans'
import { Feature, FeatureGrid, LogoRow, PageHeader, Quote, Section, Steps } from './blocks'
import { charge, merged, money, saving, seats, way, type PlanRow } from './rows'

const PLANS: PlanRow[] = [
  { id: 'free', name: 'Free', priceMonthly: 0, category: 'personal', features: ['Chat with every model'] },
  { id: 'pro', name: 'Pro', priceMonthly: 20, annualTotal: 200, category: 'personal', popular: true, features: ['Agents', 'Dev'] },
  {
    id: 'team',
    name: 'Team',
    priceMonthly: 24,
    annualTotal: 240,
    category: 'team',
    pricePerUser: true,
    limits: { minSeats: 2 },
    features: ['Shared workspace'],
  },
  { id: 'enterprise', name: 'Enterprise', priceMonthly: null, category: 'enterprise', contactSales: true, features: ['SSO'] },
]

describe('Hero', () => {
  const out = html(
    <Hero
      title="Build what’s next"
      subtitle="Chat to think it through."
      signIn={<form id="signin" />}
      terms="Terms"
      download={{ href: '/download', label: 'Download desktop app' }}
      media={<div id="demo" />}
    />,
  )

  it('carries the page’s one h1, the sign-in, and the download link', () => {
    expect(out.match(/<h1[ >]/g)).toHaveLength(1)
    expect(out).toContain('id="signin"')
    expect(out).toMatch(/<a[^>]*href="\/download"/)
  })

  it('is two columns that stack: a row with a column step at the medium breakpoint', () => {
    expect(out).toMatch(/data-slot="hero"[^>]*class="[^"]*_fd-row/)
    expect(out).toMatch(/_md_fd-column|_fd-column/)
    expect(out).toContain('data-slot="hero-copy"')
    expect(out).toContain('data-slot="hero-media"')
  })

  it('reserves the media card’s shape from tokens before anything loads', () => {
    expect(out).toMatch(/data-slot="hero-media"[^>]*class="[^"]*_aspectRatio-/)
  })

  it('draws no media column when there is no media', () => {
    expect(html(<Hero title="Sign in" />)).not.toContain('data-slot="hero-media"')
  })
})

describe('Media', () => {
  it('is a muted looping video with a poster, autoplay and every source', () => {
    const out = html(
      <Media
        label="The builder at work"
        poster="/demo.jpg"
        sources={[
          { src: '/demo.webm', type: 'video/webm' },
          { src: '/demo.mp4', type: 'video/mp4' },
        ]}
      />,
    )
    expect(out).toMatch(/<video[^>]*autoPlay|<video[^>]*autoplay/i)
    expect(out).toMatch(/<video[^>]*muted/)
    expect(out).toMatch(/<video[^>]*loop/)
    expect(out).toContain('poster="/demo.jpg"')
    expect(out).toContain('<source src="/demo.webm" type="video/webm"')
    expect(out).toContain('<source src="/demo.mp4" type="video/mp4"')
    expect(out).toContain('aria-label="The builder at work"')
  })
})

describe('plans arithmetic', () => {
  it('reads the catalog and types no price of its own', () => {
    expect(money(20)).toBe('$20')
    expect(money(16.67)).toBe('$16.67')
    expect(charge(PLANS[1]!, 'year')).toBe(200)
    expect(saving(PLANS[1]!)).toBe(17)
    expect(seats(PLANS[2]!)).toBe(2)
    expect(way(PLANS[0]!)).toBe('free')
    expect(way(PLANS[3]!)).toBe('sales')
  })
})

describe('Plans', () => {
  const checkout = (p: PlanRow, every: string) => `/pay?plan=${p.id}&interval=${every}`
  const out = html(<Plans plans={PLANS} checkout={checkout} heading="h2" />)

  it('opens on Individual with a tab for Team & Enterprise', () => {
    expect(out).toContain('Individual')
    expect(out).toContain('Team &amp; Enterprise')
    expect(out).toMatch(/<h2[^>]*>Plans that grow with you/)
  })

  it('gives Free its own button and a paid plan the checkout for that plan', () => {
    expect(out).toMatch(/<a[^>]*href="\/login"[^>]*>Try Hanzo/)
    expect(out).toMatch(/<a[^>]*href="\/login\?next=%2Fpay%3Fplan%3Dpro%26interval%3Dmonth"[^>]*>Try Hanzo/)
    expect(out).toContain('No commitment · Cancel anytime')
  })

  it('offers the annual switch only where a year is sold, and names the saving', () => {
    expect(out).toContain('Save 17% with annual')
    expect(html(<Plans plans={[PLANS[0]!]} checkout={checkout} />)).not.toContain('with annual')
  })

  it('sends Enterprise to sales and quotes a seat floor on Team', () => {
    const team = html(<Plans plans={PLANS.filter((p) => p.category !== 'personal')} checkout={checkout} />)
    expect(team).toMatch(/<a[^>]*href="\/contact-sales"[^>]*>Get Enterprise plan/)
    expect(team).toMatch(/<a[^>]*href="\/login\?next=[^"]*"[^>]*>Get Team plan/)
    expect(team).toContain('$24')
    expect(team).toContain('USD/seat/month')
    expect(team).toContain('from 2 seats')
  })
})

describe('merged', () => {
  it('offers the Max tiers as one card priced from the cheaper', () => {
    const rows: PlanRow[] = [
      PLANS[0]!,
      { id: 'max5', name: 'Max 5x', priceMonthly: 100, category: 'personal', features: ['Everything in Pro', "5x Pro's usage"] },
      { id: 'max20', name: 'Max 20x', priceMonthly: 200, category: 'personal', features: ['Everything in Pro', "20x Pro's usage"] },
    ]
    const { plans, from } = merged(rows)
    expect(plans.map((p) => p.name)).toEqual(['Free', 'Max'])
    expect(plans[1]!.priceMonthly).toBe(100)
    expect(plans[1]!.features).toContain('Choose 5x or 20x more usage than Pro')
    expect([...from]).toEqual(['max5'])
  })
})

describe('Faq', () => {
  it('keeps every answer in the document while the rows are closed', () => {
    const out = html(<Faq items={[{ q: 'Is it free?', a: 'The Free plan is.' }, { q: 'Can I cancel?', a: 'Anytime.' }]} />)
    expect(out.match(/<details/g)).toHaveLength(2)
    expect(out).toContain('The Free plan is.')
    expect(out).toContain('Anytime.')
    expect(out).not.toMatch(/<details[^>]* open/)
  })
})

describe('ClosingCta', () => {
  it('ends at sign-in, payment second, with the docs as the second way', () => {
    const out = html(<ClosingCta />)
    expect(out).toMatch(/<a[^>]*href="\/login"[^>]*>Try Hanzo/)
    expect(html(<ClosingCta next="/pay?plan=pro" />)).toMatch(/href="\/login\?next=%2Fpay%3Fplan%3Dpro"/)
    expect(out).toMatch(/<a[^>]*href="https:\/\/docs\.hanzo\.ai"[^>]*>Read the docs/)
    expect(out).not.toContain('Start free')
    expect(out).not.toContain('Choose plan')
  })
})

describe('page blocks', () => {
  it('draw a page from content: one h1, sections with h2, features with h3', () => {
    const out = html(
      <>
        <PageHeader eyebrow="Platform" title="One cloud" lede="Everything runs on it." />
        <Section title="What it does">
          <FeatureGrid>
            <Feature title="Agents" href="/agents">Run them.</Feature>
            <Feature title="Models">Route them.</Feature>
          </FeatureGrid>
        </Section>
        <Steps steps={[{ title: 'Describe', body: 'Say it.' }, { title: 'Ship', body: 'Done.' }]} />
        <Quote quote="It shipped." name="A customer" role="CTO" />
        <LogoRow label="Trusted by" logos={[{ name: 'Acme' }, { name: 'Globex', href: 'https://globex.example' }]} />
      </>,
    )
    expect(out.match(/<h1[ >]/g)).toHaveLength(1)
    expect(out).toMatch(/<h2[^>]*>What it does/)
    expect(out.match(/<h3[ >]/g)?.length).toBeGreaterThanOrEqual(4)
    expect(out).toMatch(/<ol[^>]*data-slot="steps"/)
    expect(out).toMatch(/<figure[^>]*data-slot="quote"/)
    expect(out).toMatch(/<a[^>]*href="\/agents"/)
    expect(out).toContain('Acme')
  })
})

import { TextLink } from './Cta'

describe('TextLink', () => {
  it('is an anchor in the surrounding ink, underlined from tokens', () => {
    const out = html(<TextLink href="/pricing">pricing</TextLink>)
    expect(out).toMatch(/<a[^>]*href="\/pricing"[^>]*data-slot="text-link"|<a[^>]*data-slot="text-link"[^>]*href="\/pricing"/)
    expect(out).toMatch(/_td-underline/)
  })
})
