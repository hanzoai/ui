import React, { useState } from 'react'
import Picker from 'react-mobile-picker'

import type { Product } from '../types'
import { formatPrice } from '../util'
import { cn } from '@hanzo/ui/util'

  // from source code
interface PickerItemRenderProps {
  selected: boolean;
}

function renderOptions(options: string[], selectedColor: string) {
  return options.map((option) => (
    <Picker.Item key={option} value={option}>
      {({ selected }: PickerItemRenderProps) => (
        <div className={selected ? `font-semibold ${selectedColor}` : 'text-neutral-400'}>{option}</div>
      )}
    </Picker.Item>
  ))
}

// const DEFAULT_HEIGHT = 216
// const DEFAULT_ITEM_HEIGHT = 36


const ProductSelectionMobilePicker: React.FC<{
  products: Product[]
  selectedSku: string | undefined
  onValueChange: (v: string) => void
  height?: number
  itemHeight?: number
  outerClx?: string
  itemClx?: string
}> = ({
  products,
  selectedSku,
  onValueChange,
  height,
  itemHeight,
  outerClx='',
  itemClx=''
}) => {

    // @ts-ignore
  const onChange = (val, ignore) => {
    console.log("VAL", val)
    console.log("key")
    onValueChange(val.item)
  }

return (
  <div className={cn('border border-muted-4 rounded-lg px-2', outerClx)}>
    <Picker
      className=''
      value={selectedSku ? {item: selectedSku} : {item: undefined}}
      onChange={onChange}
      wheelMode="natural"
      height={height}
      itemHeight={itemHeight}
    >
      <Picker.Column name="item">
      {products.map((prod) => (
        <Picker.Item key={prod.sku} value={prod.sku}>
        {({ selected }: PickerItemRenderProps) => (
          <div className={cn(selected ? 'font-semibold text-accent' : 'text-muted', itemClx)}>
            {prod.titleAsOption + ', ' + formatPrice(prod.price)}
          </div>
        )}
        </Picker.Item>
      ))}
      </Picker.Column>
    </Picker>
  </div>
)
}

export default ProductSelectionMobilePicker
