'use server'

import type { Promo } from '../types'

const PROMO_CODES: Promo[] = [
  {
    type: 'percent',
    code: 'ANGEL',
    value: 20
  },
  {
    type: 'percent',
    code: 'NASSER',
    value: 20
  },
  {
    type: 'percent',
    code: 'DARA',
    value: 20
  },
  {
    type: 'percent',
    code: 'ROSEY',
    value: 20
  },
  {
    type: 'percent',
    code: 'IYKYK',
    value: 20
  },
  {
    type: 'percent',
    code: 'GENESIS',
    value: 99,
    skus: ['LXM-PS-PS']
  }
]

// TODO: implement a real API call
const getPromoFromApi = async (code: string) => {
  return PROMO_CODES.find(promo => promo.code === code)
}

export {
  getPromoFromApi as default
}