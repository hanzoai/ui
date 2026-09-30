// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { item, lines, OFFERS, period, saving, unit } from './plans'
import { chatStep, step } from './state'
import { ROLES } from './roles'

describe('plans', () => {
  it('prices Dev and Max from @hanzo/plans and a seat at plan + $5', () => {
    expect(OFFERS.dev.monthly).toBe(19)
    expect(OFFERS.max.monthly).toBe(99)
    expect(OFFERS.team_standard.monthly).toBe(24)
    expect(OFFERS.team_premium.monthly).toBe(104)
  })

  it('a year is the month times 0.82, paid at once, and saves 18%', () => {
    expect(unit('dev', 'annual')).toBe(15.58)
    expect(period('dev', 'annual')).toBe(186.96)
    expect(saving).toBe(18)
    expect(period('team_standard', 'annual')).toBe(236.16)
  })

  it('a team has two seats at least and a person has one', () => {
    expect(lines('team_standard', 'monthly', 1).seats).toBe(2)
    expect(lines('team_standard', 'monthly', 2).subtotal).toBe(48)
    expect(lines('team_premium', 'monthly', 3).subtotal).toBe(312)
    expect(lines('dev', 'monthly', 9).seats).toBe(1)
  })

  it('states a commerce item in the GA4 shape', () => {
    expect(item('team_standard', 'annual', 3)).toEqual({ item_id: 'team_standard', item_name: 'Standard seat', item_category: 'team', item_variant: 'annual', price: 236.16, quantity: 3 })
  })
})

describe('steps', () => {
  it('walks use, then plans or team, then done, and resumes where it stopped', () => {
    expect(step({})).toBe('use')
    expect(step({ use: 'personal' })).toBe('plans')
    expect(step({ use: 'personal', plan: 'free' })).toBe('done')
    expect(step({ use: 'team' })).toBe('team')
    expect(step({ use: 'team', team: 'acme' })).toBe('seats')
    expect(step({ use: 'team', team: 'acme', plan: 'team_standard' })).toBe('done')
    expect(step({ use: 'enterprise' })).toBe('enterprise')
    expect(step({ use: 'enterprise', sales: true })).toBe('done')
  })

  it('asks before a first chat: notice, name unless IAM has one, role', () => {
    expect(chatStep({}, true)).toBe('notice')
    expect(chatStep({ notice: true }, false)).toBe('name')
    expect(chatStep({ notice: true }, true)).toBe('role')
    expect(chatStep({ notice: true, named: true }, false)).toBe('role')
    expect(chatStep({ notice: true, role: 'Founder' }, true)).toBe('done')
  })
})

describe('roles', () => {
  it('are the owner’s twenty, three prompts each, each a full prompt', () => {
    expect(ROLES).toHaveLength(20)
    expect(ROLES[0]!.role).toBe('Product management')
    expect(ROLES[19]!.role).toBe('Other')
    for (const r of ROLES) {
      expect(r.prompts).toHaveLength(3)
      for (const p of r.prompts) expect(p.prompt.length).toBeGreaterThan(p.label.length + 20)
    }
    expect(ROLES[1]!.prompts[0]).toMatchObject({ label: 'Review my PR diff', prompt: 'Review this pull request diff for bugs, risky changes and missing tests. I\'ll paste it next.' })
  })
})

