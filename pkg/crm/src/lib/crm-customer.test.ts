import { describe, expect, it } from 'vitest'

import { cartsOf, confers, CrmApi, money, monthly, ordersOf, plansOf } from './crm'
import { configureCrm } from './host'

const answer = {
  count: 3,
  subscriptions: [
    { id: 's1', userId: 'hanzo/ada', planId: 'max-20x', plan: { name: 'Max 20x', currency: 'USD' }, status: 'active', quantity: 1, mrrCents: 20000, chargedCents: 20000, currentPeriodEnd: '2026-12-01T00:00:00Z', cancelAtPeriodEnd: false },
    { id: 's2', userId: 'hanzo/cy', planId: 'pro', status: 'trialing', quantity: 3, mrrCents: 6000, currentPeriodEnd: '2026-12-05T00:00:00Z', cancelAtPeriodEnd: true },
    { id: 's3', userId: 'hanzo/di', planId: 'pro', status: 'canceled', mrrCents: 2000 },
    { id: 's4', userId: 'hanzo/ed', planId: 'pro', status: 'active', mrrCents: 2000, test: true },
  ],
}

describe("a customer's plans as billing answers them", () => {
  const plans = plansOf(answer)

  it('reads the plan by its name, else its id, and the money in the plan\'s currency', () => {
    expect(plans[0]).toMatchObject({ plan: 'Max 20x', currency: 'usd', monthly: 20000, paid: 20000, seats: 1, ends: false })
    expect(plans[1]).toMatchObject({ plan: 'pro', currency: 'usd', seats: 3, ends: true, paid: 0 })
  })

  it('counts only an active or trialing plan that is not a sandbox one as held', () => {
    expect(plans.map(confers)).toEqual([true, true, false, false])
  })

  it('sums what held plans contribute a month, by currency', () => {
    expect(monthly(plans)).toEqual({ usd: 26000 })
    expect(monthly(plansOf({ subscriptions: [{ ...answer.subscriptions[0], plan: { currency: 'eur' } }, answer.subscriptions[1]] }))).toEqual({ eur: 20000, usd: 6000 })
  })

  it('reads nothing as no plans', () => {
    expect(plansOf(null)).toEqual([])
    expect(plansOf({ subscriptions: 'x' })).toEqual([])
  })

  it('writes an amount in its currency', () => {
    expect(money(20000, 'usd')).toMatch(/200\.00/)
    expect(money(1250, 'xx9')).toBe('12.50 XX9')
  })
})

describe('what the CRM asks for a customer', () => {
  it('reads one billing account by its user, and the whole org with none', async () => {
    const asked: string[] = []
    configureCrm({ v1Url: (path: string) => `https://api.test/v1/${path}`, get: async (url: string) => (asked.push(url), answer) } as never)
    expect(await CrmApi.plans('hanzo/ada')).toHaveLength(4)
    await CrmApi.plans()
    expect(asked).toEqual(['https://api.test/v1/billing/subscriptions?userId=hanzo%2Fada', 'https://api.test/v1/billing/subscriptions'])
  })

  it('finds the commerce user the cloud linked to a person, and none for a person who never paid', async () => {
    const filters: string[] = []
    let rows: unknown[] = [{ data: { user: 'hanzo/ada' } }]
    configureCrm({
      base: () => ({ listRecords: async (_c: string, q: { filter: string }) => (filters.push(q.filter), { items: rows }) }),
    } as never)
    expect(await CrmApi.customerOf('p1')).toBe('hanzo/ada')
    rows = []
    expect(await CrmApi.customerOf('p2')).toBe('')
    expect(filters[0]).toBe('kind = "system" && channel = "commerce" && person = "p1"')
  })
})

describe("a customer's orders and carts as commerce answers them", () => {
  const orders = {
    count: 2,
    revenue: [{ currency: 'USD', cents: 6500 }],
    orders: [
      { id: 'o2', number: 7, status: 'completed', paymentStatus: 'paid', currency: 'usd', totalCents: 2500, paidCents: 2500, refundedCents: 0, createdAt: '2026-11-02T10:00:00Z', items: [{ name: 'Mug', quantity: 2 }] },
      { id: 'o1', status: 'completed', paymentStatus: 'refunded', totalCents: 5000, paidCents: 5000, refundedCents: 1000, items: [{ name: 'Cap' }] },
    ],
  }

  it('reads each order with what was bought, what it came to and what came back, and the revenue of all of them', () => {
    const r = ordersOf(orders)
    expect(r.count).toBe(2)
    expect(r.revenue).toEqual([{ currency: 'usd', cents: 6500 }])
    expect(r.orders[0]).toMatchObject({ number: 7, total: 2500, paid: 2500, refunded: 0, items: [{ name: 'Mug', quantity: 2 }] })
    expect(r.orders[1]).toMatchObject({ number: 0, currency: 'usd', refunded: 1000, items: [{ name: 'Cap', quantity: 0 }] })
  })

  it('reads each cart with how many were left', () => {
    const r = cartsOf({ count: 2, left: 1, carts: [{ id: 'c1', status: 'active', currency: 'usd', totalCents: 900, updatedAt: '2026-11-03T10:00:00Z', items: [{ name: 'Mug', quantity: 1 }] }, { id: 'c2', status: 'ordered' }] })
    expect(r).toMatchObject({ count: 2, left: 1 })
    expect(r.carts[0]).toMatchObject({ status: 'active', total: 900, updated: '2026-11-03T10:00:00Z' })
    expect(r.carts[1]).toMatchObject({ status: 'ordered', total: 0, items: [] })
  })

  it('reads nothing as none', () => {
    expect(ordersOf(null)).toEqual({ orders: [], count: 0, revenue: [] })
    expect(cartsOf({ carts: 'x' })).toEqual({ carts: [], count: 0, left: 0 })
  })

  it("asks commerce for one buyer's by address, and for the org's with none", async () => {
    const asked: string[] = []
    configureCrm({ v1Url: (path: string) => `https://api.test/v1/${path}`, get: async (url: string) => (asked.push(url), orders) } as never)
    await CrmApi.orders('ada@example.com')
    await CrmApi.carts('ada@example.com')
    await CrmApi.orders()
    expect(asked).toEqual(['https://api.test/v1/commerce/order?email=ada%40example.com', 'https://api.test/v1/commerce/cart?email=ada%40example.com', 'https://api.test/v1/commerce/order'])
  })
})
