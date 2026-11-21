import { describe, expect, it } from 'vitest'

import { betaMembersOf, CrmApi } from './crm'
import { configureCrm } from './host'

describe('the beta signups as the cloud answers them', () => {
  const answer = {
    data: [
      {
        person: 'p1',
        email: 'ada@example.com',
        user: 'ada',
        program: 'beta',
        applied: '2026-11-01T10:00:00Z',
        betas: [
          { id: 'crm', name: 'CRM', requested: '2026-11-01T10:00:00Z', enabled: true },
          { id: 'erp', name: 'ERP', requested: '2026-11-02T10:00:00Z', enabled: false },
        ],
      },
      { person: 'p2', email: 'cy@example.com', user: 'cy', betas: [{ id: 'sign', enabled: true }] },
    ],
  }

  it('reads each member with its asked and enabled betas, a field left out as empty', () => {
    const [ada, cy] = betaMembersOf(answer)
    expect(ada.betas.map((b) => [b.id, b.enabled, b.requested !== ''])).toEqual([
      ['crm', true, true],
      ['erp', false, true],
    ])
    expect(cy).toMatchObject({ program: '', applied: '', betas: [{ id: 'sign', name: 'sign', requested: '', enabled: true }] })
  })

  it('reads nothing as nobody', () => {
    expect(betaMembersOf(null)).toEqual([])
    expect(betaMembersOf({ data: 'x' })).toEqual([])
  })

  it('asks the SuperAdmin route', async () => {
    const asked: string[] = []
    configureCrm({ v1Url: (path: string) => `https://api.test/v1/${path}`, get: async (url: string) => (asked.push(url), answer) } as never)
    expect(await CrmApi.marketing.betaMembers()).toHaveLength(2)
    expect(asked).toEqual(['https://api.test/v1/admin/marketing/beta'])
  })
})
