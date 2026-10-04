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
import { CREDITS_TERMS, PLAN_TERMS, PlanUsage } from './PlanUsage'
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

  it('offers See usage only when the host has a usage page', () => {
    expect(words(html(<LimitedBanner message="m" actions={actions} />))).not.toContain('See usage')
    let seen = 0
    const { host, unmount } = mount(<LimitedBanner message="m" actions={actions} onUsage={() => seen++} />)
    const button = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('See usage'))!
    act(() => button.click())
    expect(seen).toBe(1)
    unmount()
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
        notice={{ reason: 'plan_allowance_used', classes: ['premium'], message: 'Premium models are paused until Oct 31.', actions: limitsOf(LIMITED)!.actions, resets_at: null, fallback: null, refused: false }}
        now={NOW}
      />,
    )
    expect(m.indexOf('limited-banner')).toBeGreaterThan(-1)
    expect(m.indexOf('limited-banner')).toBeLessThan(m.indexOf('usage-meter'))
  })
})

describe('the free plan as the API names it', () => {
  it('reads the free terms for plan "free", with its upgrade', () => {
    const live = { plan: 'free', state: 'ok', classes: {}, actions: [{ kind: 'upgrade', label: 'Upgrade to Pro', url: 'https://hanzo.ai/pay/cart?plan=dev', plan: 'dev' }, { kind: 'topup', label: 'Add prepaid credit', url: 'https://hanzo.ai/pay' }], upgrade: 'dev' }
    const text = words(html(<PlanUsage limits={limitsOf(live)!} now={NOW} />))
    expect(text).toContain('Free plan')
    expect(text).toContain('The free plan includes limited usage of free models.')
    expect(text).not.toContain(PLAN_TERMS[0])
    expect(text).toContain('Upgrade to Pro')
  })
})

describe('the credits choice and the server actions', () => {
  const CREDITS = [
    { kind: 'credits', label: 'Continue with credits', url: '/v1/ai/limits' },
    { kind: 'upgrade', label: 'Upgrade', url: 'https://hanzo.ai/pricing' },
    { kind: 'switch', label: 'Try Enso', model: 'enso' },
  ]

  it('offers only the pages when the host takes no action', () => {
    const text = words(html(<LimitedBanner message="m" actions={limitsOf({ plan: 'dev', actions: CREDITS })!.actions} />))
    expect(text).toContain('Upgrade')
    expect(text).not.toContain('Continue with credits')
    expect(text).not.toContain('Try Enso')
  })

  it('draws every action in server order, the first one filled, when the host acts', () => {
    const m = html(<LimitedBanner message="m" actions={limitsOf({ plan: 'dev', actions: CREDITS })!.actions} onAction={() => {}} />)
    const kinds = [...m.matchAll(/data-kind="(\w+)"/g)].map((x) => x[1])
    expect(kinds).toEqual(['credits', 'upgrade', 'switch'])
    const variants = [...m.matchAll(/data-variant="(\w+)"/g)].map((x) => x[1])
    expect(variants.slice(0, 3)).toEqual(['primary', 'default', 'default'])
  })

  it('shows the opt-in only when the limits carry it and the host can write it', async () => {
    const on = limitsOf({ ...LIMITED, state: 'ok', limited: undefined, credits_after_allowance: false })!
    expect(words(html(<PlanUsage limits={on} now={NOW} />))).not.toContain(CREDITS_TERMS)
    expect(words(html(<PlanUsage limits={limitsOf({ ...LIMITED, state: 'ok', limited: undefined })!} onCredits={async () => {}} now={NOW} />))).not.toContain(CREDITS_TERMS)
    const wrote: boolean[] = []
    const { host, unmount } = mount(<PlanUsage limits={on} onCredits={async (v) => void wrote.push(v)} addCreditsHref="https://hanzo.ai/billing" now={NOW} />)
    expect(host.textContent).toContain(CREDITS_TERMS)
    expect(host.textContent).toContain('Add credits')
    const toggle = host.querySelector('[aria-label="Continue with credits"]') as HTMLElement
    await act(async () => toggle.click())
    expect(wrote).toEqual([true])
    unmount()
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

  it('keeps a refusal once the limits read again and still say limited', async () => {
    let got: UseLimits | null = null
    const { unmount } = mount(<Probe read={async () => LIMITED} onRead={(u) => (got = u)} />)
    await flush()
    expect(got!.notice?.refused).toBe(false)
    await act(async () => {
      observe(
        new Response(JSON.stringify({ error: { type: 'billing_error', code: 'plan_allowance_used', message: 'm', class: 'premium' } }), {
          status: 402,
          headers: { 'content-type': 'application/json' },
        }),
      )
      await new Promise((r) => setTimeout(r, 0))
    })
    await flush()
    await flush()
    expect(got!.notice?.refused).toBe(true)
    unmount()
  })

  it('keeps a refusal the limits cannot unsay, until an answer comes back', async () => {
    const OK = { plan: 'max-5x', state: 'ok', classes: { premium: { percent: 10, state: 'ok', paying: 'plan' } }, actions: [] }
    let got: UseLimits | null = null
    const { unmount } = mount(<Probe read={async () => OK} onRead={(u) => (got = u)} />)
    await flush()
    await act(async () => {
      observe(
        new Response(JSON.stringify({ error: { type: 'billing_error', code: 'paid_plan_required', message: 'Premium models need a paid plan.', class: 'premium' } }), {
          status: 402,
          headers: { 'content-type': 'application/json' },
        }),
      )
      await new Promise((r) => setTimeout(r, 0))
    })
    await flush()
    await flush()
    expect(got!.notice?.message).toBe('Premium models need a paid plan.')
    // An answer with no usage header it may read still ends the refusal.
    await act(async () => observe(new Response('{}', { status: 200 })))
    await flush()
    expect(got!.notice).toBeNull()
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
