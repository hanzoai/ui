import { describe, expect, it } from 'vitest'
import { classOf, limitsOf, nearOf, noticeOf, overlay, refusalOf, servedOf, when } from './limits'

const NOW = Date.parse('2026-10-03T12:00:00Z')

const OK = {
  plan: 'max-20x',
  period_start: '2026-10-01T00:00:00Z',
  period_end: '2026-10-31T00:00:00Z',
  state: 'ok',
  classes: {
    premium: { percent: 35, state: 'ok', paying: 'plan', resets_at: '2026-10-31T00:00:00Z' },
    ours: { percent: 10, state: 'ok', paying: 'plan', resets_at: '2026-10-31T00:00:00Z', window: { percent: 5, state: 'ok', resets_at: '2026-10-03T17:00:00Z' } },
  },
  actions: [],
}

const NEAR = {
  ...OK,
  state: 'near',
  classes: { ...OK.classes, premium: { percent: 85, state: 'near', paying: 'plan', resets_at: '2026-10-31T00:00:00Z' } },
}

const LIMITED = {
  ...OK,
  state: 'limited',
  classes: { ...OK.classes, premium: { percent: 100, state: 'limited', paying: 'none', resets_at: '2026-10-31T00:00:00Z' } },
  limited: { reason: 'plan_allowance_used', classes: ['premium'], message: "You've used this period's included premium usage." },
  actions: [
    { kind: 'upgrade', label: 'Upgrade', plan: 'team', url: 'https://hanzo.ai/pricing' },
    { kind: 'topup', label: 'Add prepaid credit', url: 'https://hanzo.ai/billing/credit' },
  ],
}

const headers = (h: Record<string, string>) => new Headers(h)

describe('limitsOf', () => {
  it('reads every field of an answer', () => {
    const l = limitsOf(OK)!
    expect(l.plan).toBe('max-20x')
    expect(l.state).toBe('ok')
    expect(l.classes.premium).toEqual({ percent: 35, state: 'ok', paying: 'plan', resets_at: '2026-10-31T00:00:00Z' })
    expect(l.classes.ours?.window).toEqual({ percent: 5, state: 'ok', resets_at: '2026-10-03T17:00:00Z' })
    expect(l.actions).toEqual([])
  })

  it('is not an answer without a string plan', () => {
    expect(limitsOf({ classes: {} })).toBeNull()
    expect(limitsOf(null)).toBeNull()
    expect(limitsOf('nope')).toBeNull()
  })

  it('leaves out a class with no percent rather than drawing it', () => {
    const l = limitsOf({ plan: 'dev', classes: { premium: { state: 'ok' }, ours: { percent: 20 } } })!
    expect(l.classes.premium).toBeUndefined()
    expect(l.classes.ours).toEqual({ percent: 20, state: 'ok', paying: 'plan', resets_at: null })
  })

  it('clamps a percent and derives a state the body omitted', () => {
    const l = limitsOf({ plan: 'dev', classes: { premium: { percent: 140 }, ours: { percent: 82 } } })!
    expect(l.classes.premium?.percent).toBe(100)
    expect(l.classes.ours?.state).toBe('near')
    expect(l.state).toBe('near')
  })

  it('keeps only actions with a kind and a url', () => {
    const l = limitsOf({ ...LIMITED, actions: [...LIMITED.actions, { kind: 'sell', url: 'x' }, { kind: 'topup' }] })!
    expect(l.actions.map((a) => a.kind)).toEqual(['upgrade', 'topup'])
    expect(l.limited).toEqual({ reason: 'plan_allowance_used', classes: ['premium'], message: LIMITED.limited.message })
  })
})

describe('servedOf', () => {
  it('reads the usage headers of a served call', () => {
    expect(servedOf(headers({ 'X-Hanzo-Usage': 'near', 'X-Hanzo-Usage-Class': 'premium', 'X-Hanzo-Paid-By': 'plan' }))).toEqual({
      state: 'near',
      class: 'premium',
      paidBy: 'plan',
      fallback: null,
      reason: null,
    })
  })

  it('reads a fallback reply', () => {
    const s = servedOf(
      headers({
        'X-Hanzo-Usage': 'limited',
        'X-Hanzo-Usage-Class': 'premium',
        'X-Hanzo-Paid-By': 'free',
        'X-Hanzo-Fallback': 'zen-free',
        'X-Hanzo-Usage-Reason': 'plan_allowance_used',
      }),
    )
    expect(s).toEqual({ state: 'limited', class: 'premium', paidBy: 'free', fallback: 'zen-free', reason: 'plan_allowance_used' })
  })

  it('is null for a call with no usage headers', () => {
    expect(servedOf(headers({ 'content-type': 'application/json' }))).toBeNull()
  })
})

describe('refusalOf', () => {
  it('reads each billing refusal', () => {
    for (const [status, code] of [
      [402, 'plan_allowance_used'],
      [402, 'paid_plan_required'],
      [429, 'free_plan_cap'],
      [402, 'insufficient_balance'],
    ] as const) {
      const r = refusalOf(
        { error: { type: 'billing_error', code, message: `m-${code}`, class: 'premium', resets_at: '2026-10-31T00:00:00Z', actions: LIMITED.actions } },
        status,
        status === 429 ? '3600' : null,
      )!
      expect(r.status).toBe(status)
      expect(r.code).toBe(code)
      expect(r.message).toBe(`m-${code}`)
      expect(r.class).toBe('premium')
      expect(r.actions).toHaveLength(2)
      expect(r.retry).toBe(status === 429 ? 3600 : null)
    }
  })

  it('is null for any other error', () => {
    expect(refusalOf({ error: { type: 'invalid_request_error', message: 'x' } }, 400)).toBeNull()
    expect(refusalOf({ message: 'x' }, 402)).toBeNull()
  })
})

describe('classOf', () => {
  it('sorts models into the three classes', () => {
    for (const id of ['zen-4', 'enso-auto', 'kai', 'kai-pro', 'jev-1', 'hanzo/zen3-nano', 'zen']) expect(classOf(id), id).toBe('ours')
    for (const id of ['zen-free', 'enso-free', 'free', 'hanzo/enso-free']) expect(classOf(id), id).toBe('free')
    for (const id of ['claude-opus-4.8', 'gpt-5', 'gemini-3-pro', 'kaiju-7b', 'zenith-1']) expect(classOf(id), id).toBe('premium')
  })
})

describe('noticeOf', () => {
  const none = { served: null, refusal: null }

  it('says nothing while usage is ok or near', () => {
    expect(noticeOf(limitsOf(OK), none, undefined, NOW)).toBeNull()
    expect(noticeOf(limitsOf(NEAR), none, undefined, NOW)).toBeNull()
  })

  it('pauses a used-up class until its reset, with the server actions', () => {
    const n = noticeOf(limitsOf(LIMITED), none, undefined, NOW)!
    expect(n.message).toBe('Premium models are paused until Oct 31.')
    expect(n.classes).toEqual(['premium'])
    expect(n.actions.map((a) => a.label)).toEqual(['Upgrade', 'Add prepaid credit'])
  })

  it('names the free model a fallback reply was answered on', () => {
    const served = servedOf(
      headers({ 'X-Hanzo-Usage': 'limited', 'X-Hanzo-Usage-Class': 'premium', 'X-Hanzo-Fallback': 'zen-free', 'X-Hanzo-Usage-Reason': 'plan_allowance_used' }),
    )
    const n = noticeOf(limitsOf(LIMITED), { served, refusal: null }, (id) => (id === 'zen-free' ? 'Zen Free' : id), NOW)!
    expect(n.message).toBe("Premium models are paused until Oct 31. You're chatting on Zen Free.")
    expect(n.fallback).toBe('zen-free')
  })

  it('carries a refusal with no limits read', () => {
    const refusal = refusalOf({ error: { type: 'billing_error', code: 'paid_plan_required', message: 'Premium models need a paid plan.', class: 'premium', actions: LIMITED.actions } }, 402)
    const n = noticeOf(null, { served: null, refusal }, undefined, NOW)!
    expect(n.message).toBe('Premium models need a paid plan.')
    expect(n.actions).toHaveLength(2)
  })

  it('says the free plan cap in the server words', () => {
    const refusal = refusalOf({ error: { type: 'billing_error', code: 'free_plan_cap', message: "You've reached the free plan's limit for now." } }, 429, '600')
    expect(noticeOf(null, { served: null, refusal }, undefined, NOW)?.message).toBe("You've reached the free plan's limit for now.")
  })

  it('reads a window reset as a time', () => {
    const l = limitsOf({
      ...OK,
      state: 'limited',
      classes: { ours: { percent: 40, state: 'ok', paying: 'plan', resets_at: '2026-10-31T00:00:00Z', window: { percent: 100, state: 'limited', resets_at: '2026-10-03T17:00:00Z' } } },
      limited: { reason: 'plan_allowance_used', classes: ['ours'], message: '' },
    })
    expect(noticeOf(l, none, undefined, NOW)?.message).toBe(`Hanzo models are paused until ${when('2026-10-03T17:00:00Z', NOW)}.`)
  })
})

describe('nearOf', () => {
  it('is one line for a class near its included usage', () => {
    expect(nearOf(limitsOf(NEAR), NOW)).toBe("You're close to your plan's included premium model usage. Resets Oct 31.")
    expect(nearOf(limitsOf(OK), NOW)).toBeNull()
    expect(nearOf(limitsOf(LIMITED), NOW)).toBeNull()
  })
})

describe('overlay', () => {
  it('lays a served state over the class it names', () => {
    const served = servedOf(headers({ 'X-Hanzo-Usage': 'near', 'X-Hanzo-Usage-Class': 'premium' }))
    const l = overlay(limitsOf(OK), { served, refusal: null })!
    expect(l.classes.premium?.state).toBe('near')
    expect(l.state).toBe('near')
  })

  it('marks a refused class limited', () => {
    const refusal = refusalOf({ error: { type: 'billing_error', code: 'plan_allowance_used', message: '', class: 'ours', resets_at: '2026-10-31T00:00:00Z' } }, 402)
    const l = overlay(limitsOf(OK), { served: null, refusal })!
    expect(l.classes.ours?.state).toBe('limited')
    expect(l.classes.ours?.paying).toBe('none')
    expect(l.state).toBe('limited')
  })
})

describe('no figures', () => {
  it('never says an amount, a count or a cap', () => {
    const said = [
      noticeOf(limitsOf(LIMITED), { served: null, refusal: null }, undefined, NOW)!.message,
      nearOf(limitsOf(NEAR), NOW)!,
    ].join(' ')
    expect(said).not.toMatch(/\$\s?\d|\d+\s*(requests?|messages?|tokens?|credits?)\b/i)
  })
})
