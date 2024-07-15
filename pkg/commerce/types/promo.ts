interface Promo {
  type: 'percent' | 'amount'
  code: string
  value: number,
  skus?: string[]
}

export {
  type Promo as default
}