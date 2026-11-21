import { describe, expect, it } from 'vitest'

import { OBJECTS, TABS } from './crm/objects'
import { CRM_PAGES } from './nav'

describe("the CRM's pages, as a host's navigation lists them", () => {
  it('opens on People and names every object once, with Sequences before Candidates and the SuperAdmin\'s Beta last', () => {
    expect(CRM_PAGES.map((p) => p.slug)).toEqual(['', 'companies', 'deals', 'fundraising', 'tasks', 'lists', 'sequences', 'candidates', 'beta'])
    const objects = CRM_PAGES.map((p) => p.slug || 'people').filter((s) => s !== 'sequences' && s !== 'beta')
    expect([...objects].sort()).toEqual([...TABS].sort())
  })

  it('lists Beta for a SuperAdmin alone', () => {
    expect(CRM_PAGES.filter((p) => p.superAdmin).map((p) => p.slug)).toEqual(['beta'])
  })

  it('names each page as its own screen does', () => {
    expect(CRM_PAGES.find((p) => p.slug === 'deals')?.label).toBe(OBJECTS.deals.plural)
    expect(CRM_PAGES[0].label).toBe('People')
  })
})
