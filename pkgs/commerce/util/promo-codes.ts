import type { Promo } from '../types'

const referallCodeDiscountedSkus = [
  'LXM-CR-B-ABT', 'LXM-CR-B-GM', 'LXM-CR-F-CC', 'LXM-CR-F-IC', 'LXM-CR-E-24G', 'LXM-CR-E-SS', 'LXM-CR-S-RT', // credit cards
  'LXM-VL-GN', 'LXM-VL-VL', 'LXM-VL-MI', 'LXM-VL-NA', // validators
  'LXM-PS-PS',  // pass
  'LXM-AG-B-1_OZ', // silver
]

const PROMO_CODES: Promo[] = [
  {
    type: 'percent',
    code: 'ANGEL',
    value: 22
  },
  {
    type: 'percent',
    code: 'NASSER',
    value: 11.11
  },
  {
    type: 'percent',
    code: 'ROSEY',
    value: 20
  },
  {
    type: 'percent',
    code: 'IYKYK',
    value: 11.1
  },
  {
    type: 'percent',
    code: 'GENESIS',
    value: 99,
    skus: ['LXM-PS-PS']
  },
  {
    type: 'percent',
    code: 'ANTJE',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  },
  {
    type: 'percent',
    code: 'ASHLEY',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  },
  {
    type: 'percent',
    code: 'CALE',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  },
  {
    type: 'percent',
    code: 'DARA',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  },
  {
    type: 'percent',
    code: 'KENJI',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  },
  {
    type: 'percent',
    code: 'MAJOR',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  },
  {
    type: 'percent',
    code: 'CYRUS',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  },
  {
    type: 'percent',
    code: 'STOBIE',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  },
  {
    type: 'percent',
    code: 'SKYLER',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  },
  {
    type: 'percent',
    code: 'ZEEKAY',
    value: 33.3,
    skus: referallCodeDiscountedSkus
  }
]

// TODO: implement a real API call
const getPromoFromApi = async (code: string) => {
  return PROMO_CODES.find(promo => promo.code === code)
}

export {
  getPromoFromApi as default
}
