'use client'

import { Label, RadioGroup, RadioGroupItem } from '@hanzo/ui/primitives'
import type { Product } from '../types'
import { formatPrice } from '../util'

const ProductSelectionRadioGroup: React.FC<{
  products: Product[]
  selectedSku: string | undefined
  onValueChange: (v: string) => void
  groupClx?: string
  itemClx?: string
}> = ({
  products,
  selectedSku,
  onValueChange,
  groupClx='',
  itemClx=''
}) => (
  <RadioGroup
    className={groupClx}
    onValueChange={onValueChange}
    value={selectedSku}
  >
  {products.map((prod) => (
    <div className={itemClx} key={prod.sku}>
      <RadioGroupItem value={prod.sku} id={prod.sku} />
      <Label htmlFor={prod.sku}>{prod.titleAsOption + ', ' + formatPrice(prod.price)}</Label>
    </div>
  ))}
  </RadioGroup>
)

export default ProductSelectionRadioGroup
