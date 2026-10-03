// @vitest-environment jsdom

/**
 * The usage surface mounts, says only shares, and follows served calls.
 */
import type { ReactNode } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { limitsOf, type LimitAction } from './limits'
import { LimitedBanner } from './LimitedBanner'
import { UsageMeter } from './UsageMeter'
import { PLAN_TERMS, PlanUsage } from './PlanUsage'
import { forget, observe, useLimits, type UseLimits } from './useLimits'

const NOW = Date.parse('2026-10-03T12:00:00Z')

const LIMITED = {
  plan: 'max-20x',
  period_start: '2026-10-01T00:00:00Z',
  period_end: '2026-10-31T00:00:00Z',
  state: 'limited',
  classes: {
    premium: { percent: 100, state: 'limited', paying: 'none', resets_at: '2026-10-31T00:00:00Z' },
    ours: { percent: 85, state: 'near', paying: 'plan', resets_at: '2026-10-31T00:00:00Z', window: { percent: 40, state: 'ok', resets_at: '2026-10-03T17:00:00Z' } },
  },
  limited: { reason: 'plan_allowance_used', classes: ['premium'], message: "You've used this period's included premium usage." },
  actions: [
    { kind: 'upgrade', label: 'Upgrade', plan: 'team', url: 'https://hanzo.ai/pricing' },
    { kind: 'topup', label: 'Add prepaid credit', url: 'https://hanzo.ai/billing/credit' },
  ],
}

const wrap = (node: ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)
const els = (markup: string) => markup.replace(/<style[\s\S]*?<\/style>/g, '')
const html = (node: ReactNode) => els(renderToStaticMarkup(wrap(node)))
const words = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

const mount = (node: ReactNode) => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    unmount: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('UsageMeter', () => {
  it('draws one row per class with its percent, state and reset', () => {
    const m = html(<UsageMeter limits={limitsOf(LIMITED)!} now={NOW} />)
    const text = words(m)
    expect(text).toContain('Premium models')
    expect(text).toContain('100% used')
    expect(text).toContain('Hanzo models')
    expect(text).toContain('85% used')
    expect(text).toContain('Resets Oct 31')
    expect(text).toContain('Paused')
    expect(text).toContain('Session')
    expect(m).toContain('data-state="limited"')
    expect(m).toContain('data-state="near"')
    expect(m).toContain('aria-label="Premium models: 100% used"')
    expect(m).toContain('data-slot="usage-meter"')
  })

  it('never draws a figure other than a percent', () => {
    expect(words(html(<UsageMeter limits={limitsOf(LIMITED)!} now={NOW} />))).not.toMatch(/\$\s?\d|\d+\s*(requests?|messages?|tokens?)\b/i)
  })

  it('draws nothing for a reader whose limits name no class', () => {
    expect(html(<UsageMeter limits={limitsOf({ plan: '' })!} />)).not.toContain('usage-meter')
  })
})

describe('LimitedBanner', () => {
  const actions = limitsOf(LIMITED)!.actions

  it('says the message and offers each action', () => {
    const m = html(<LimitedBanner message="Premium models are paused until Oct 31." actions={actions} />)
    const text = words(m)
    expect(text).toContain('Premium models are paused until Oct 31.')
    expect(text).toContain('Upgrade')
    expect(text).toContain('Add prepaid credit')
    expect(m).toContain('data-slot="limited-banner"')
    expect(m).toContain('role="status"')
  })

  it('hands a pressed action to the host', () => {
    const took: LimitAction[] = []
    const { host, unmount } = mount(<LimitedBanner message="m" actions={actions} onAction={(a) => took.push(a)} />)
    const button = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Add prepaid credit'))!
    act(() => button.click())
    expect(took.map((a) => a.kind)).toEqual(['topup'])
    unmount()
  })
})

describe('PlanUsage', () => {
  it('names the plan and period, says what it includes, and offers the actions', () => {
    const text = words(html(<PlanUsage limits={limitsOf({ ...LIMITED, state: 'ok', limited: undefined })!} now={NOW} />))
    expect(text).toContain('Max 20x plan')
    expect(text).toContain('Current period Oct 1 – Oct 31')
    for (const line of PLAN_TERMS) expect(text).toContain(line)
    expect(text).toContain('Premium models')
    expect(text).toContain('Upgrade')
    expect(text).toContain('Add prepaid credit')
    expect(text).not.toMatch(/\$\s?\d|\d+\s*(requests?|messages?|tokens?)\b/i)
  })

  it('leads with the pause when a class is paused', () => {
    const m = html(
      <PlanUsage
        limits={limitsOf(LIMITED)!}
        notice={{ reason: 'plan_allowance_used', classes: ['premium'], message: 'Premium models are paused until Oct 31.', actions: limitsOf(LIMITED)!.actions, resets_at: null, fallback: null }}
        now={NOW}
      />,
    )
    expect(m.indexOf('limited-banner')).toBeGreaterThan(-1)
    expect(m.indexOf('limited-banner')).toBeLessThan(m.indexOf('usage-meter'))
  })
})

describe('useLimits', () => {
  afterEach(() => forget())

  function Probe({ read, onRead }: { read: (s: AbortSignal) => Promise<unknown>; onRead: (u: UseLimits) => void }) {
    onRead(useLimits(read, 'org', (id) => (id === 'zen-free' ? 'Zen Free' : id)))
    return null
  }

  const flush = () => act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })

  it('reads the limits and pauses a used-up class', async () => {
    let got: UseLimits | null = null
    const { unmount } = mount(<Probe read={async () => LIMITED} onRead={(u) => (got = u)} />)
    await flush()
    expect(got!.answered).toBe(true)
    expect(got!.notice?.message).toMatch(/^Premium models are paused until /)
    expect(got!.notice?.actions).toHaveLength(2)
    unmount()
  })

  it('names the fallback model from a served reply and reads again', async () => {
    const read = vi.fn(async () => LIMITED)
    let got: UseLimits | null = null
    const { unmount } = mount(<Probe read={read} onRead={(u) => (got = u)} />)
    await flush()
    const calls = read.mock.calls.length
    await act(async () => {
      observe(
        new Response('{}', {
          status: 200,
          headers: { 'X-Hanzo-Usage': 'limited', 'X-Hanzo-Usage-Class': 'premium', 'X-Hanzo-Paid-By': 'free', 'X-Hanzo-Fallback': 'zen-free', 'X-Hanzo-Usage-Reason': 'plan_allowance_used' },
        }),
      )
    })
    await flush()
    expect(got!.notice?.message).toMatch(/You're chatting on Zen Free\.$/)
    expect(read.mock.calls.length).toBeGreaterThan(calls)
    unmount()
  })

  it('takes a refusal even when the limits could not be read', async () => {
    let got: UseLimits | null = null
    const { unmount } = mount(<Probe read={async () => Promise.reject(new Error('503'))} onRead={(u) => (got = u)} />)
    await flush()
    expect(got!.limits).toBeNull()
    await act(async () => {
      observe(
        new Response(JSON.stringify({ error: { type: 'billing_error', code: 'paid_plan_required', message: 'Premium models need a paid plan.', class: 'premium', actions: LIMITED.actions } }), {
          status: 402,
          headers: { 'content-type': 'application/json' },
        }),
      )
      await new Promise((r) => setTimeout(r, 0))
    })
    await flush()
    expect(got!.notice?.message).toBe('Premium models need a paid plan.')
    unmount()
  })

  it('clears the notice once the limits say usage is back', async () => {
    let body: unknown = LIMITED
    let got: UseLimits | null = null
    const { unmount } = mount(<Probe read={async () => body} onRead={(u) => (got = u)} />)
    await flush()
    expect(got!.notice).not.toBeNull()
    body = { ...LIMITED, state: 'ok', limited: undefined, classes: { premium: { percent: 0, state: 'ok', paying: 'plan', resets_at: '2026-11-30T00:00:00Z' } } }
    await act(async () => got!.reload())
    await flush()
    expect(got!.notice).toBeNull()
    unmount()
  })
})
