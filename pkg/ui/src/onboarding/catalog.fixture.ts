import type { Row } from './plans'

/** The live catalog's rows (GET /v1/billing/plans), as commerce sends them. */
export const CATALOG: Row[] = [
  { slug: 'free', name: 'Free', description: 'Meet Hanzo.', price: 0, features: ['Chat'] },
  { slug: 'dev', name: 'Pro', description: 'For one person.', price: 2000, annualTotal: 20000, features: ['Every room'] },
  { slug: 'max-5x', name: 'Max 5x', description: 'Five times Pro.', price: 10000, annualTotal: 100000, features: ['Enso'] },
  { slug: 'max-20x', name: 'Max 20x', description: 'Twenty times Pro.', price: 20000, annualTotal: 200000, features: ['Enso'] },
  { slug: 'team', name: 'Team', description: 'Per seat.', price: 2500, annualTotal: 24000, features: ['SSO'] },
]
