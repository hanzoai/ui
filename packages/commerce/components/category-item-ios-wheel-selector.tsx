'use client'
import React from 'react'
import Picker from 'react-mobile-picker'

import type { ItemSelector } from '../types'
import { formatPrice } from '../util'
import { cn } from '@hanzo/ui/util'

  // from source code
interface PickerItemRenderProps {
  selected: boolean;
}

const CategoryItemIOSWheelSelector: React.FC<ItemSelector & {
  height?: number
  itemHeight?: number
  outerClx?: string
  itemClx?: string
}> = ({
  category,
  selectedItemRef: iRef,
  selectSku,
  height,
  itemHeight,
  outerClx='',
  itemClx=''
}) => {

    // @ts-ignore
  const onChange = (val, ignore) => {
    selectSku(val.item)
  }

  return (
    <div className={cn('border border-muted-4 rounded-lg px-2', outerClx)}>
      <Picker
        className=''
        value={iRef.item ? {item: iRef.item.sku} : {item: undefined}}
        onChange={onChange}
        wheelMode="natural"
        height={height}
        itemHeight={itemHeight}
      >
        <Picker.Column name="item">
        {category.products.map((prod) => (
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

export default CategoryItemIOSWheelSelector
