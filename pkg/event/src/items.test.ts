import { describe, expect, it } from 'vitest'
import { commerceItem, worth } from './items'

describe('commerceItem', () => {
  it('names an individual plan by its id, term and price', () => {
    expect(commerceItem({ id: 'dev', name: 'Dev', interval: 'month', price: 19 })).toEqual({
      item_id: 'dev', item_name: 'Dev', item_category: 'individual', item_variant: 'monthly', price: 19, quantity: 1,
    })
  })

  it('names a team plan by its seats, and an annual term however commerce spells it', () => {
    for (const interval of ['year', 'yearly', 'annual', 'Year']) {
      const i = commerceItem({ id: 'team_standard', team: true, interval, price: 24, quantity: 3 })
      expect(i).toMatchObject({ item_category: 'team', item_variant: 'annual', quantity: 3 })
      expect(worth(i)).toBe(72)
    }
  })

  it('a plan with no price is free, not unknown', () => {
    expect(commerceItem({ id: 'free', interval: 'month', price: null }).price).toBe(0)
  })
})
