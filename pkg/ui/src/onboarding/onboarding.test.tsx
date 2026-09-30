// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from 'vitest'
import { CATALOG } from './catalog.fixture'
import { adopt, has, item, lines, offer, period, saving, unit } from './plans'
import { chatStep, step } from './state'
import { ROLES } from './roles'

describe('plans', () => {
  beforeAll(() => adopt(CATALOG))

  it('prices every plan from the catalog and lists only what it lists', () => {
    expect(offer('dev').monthly).toBe(20)
    expect(offer('dev').name).toBe('Pro')
    expect(offer('max_5x').monthly).toBe(100)
    expect(offer('max_20x').monthly).toBe(200)
    expect(offer('team_standard').monthly).toBe(25)
    expect(has('team_premium')).toBe(false)
    expect(() => offer('team_premium')).toThrow(/no team_premium/)
  })

  it('a year is what the catalog charges once, not the month times anything', () => {
    expect(period('dev', 'annual')).toBe(200)
    expect(unit('dev', 'annual')).toBe(16.67)
    expect(saving('dev')).toBe(17)
    expect(period('team_standard', 'annual')).toBe(240)
    expect(saving('team_standard')).toBe(20)
  })

  it('a team has two seats at least and a person has one', () => {
    expect(lines('team_standard', 'monthly', 1).seats).toBe(2)
    expect(lines('team_standard', 'monthly', 2).subtotal).toBe(50)
    expect(lines('team_standard', 'annual', 3).subtotal).toBe(720)
    expect(lines('dev', 'monthly', 9).seats).toBe(1)
  })

  it('states a commerce item in the GA4 shape, both Max tiers as max', () => {
    expect(item('team_standard', 'annual', 3)).toEqual({ item_id: 'team_standard', item_name: 'Standard seat', item_category: 'team', item_variant: 'annual', price: 240, quantity: 3 })
    expect(item('max_20x', 'monthly')).toMatchObject({ item_id: 'max', item_name: 'Max 20x', price: 200 })
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

