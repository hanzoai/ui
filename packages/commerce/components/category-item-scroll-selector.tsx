'use client'
import React from 'react'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import { ScrollArea } from '@hanzo/ui/primitives'

import type { ItemSelector } from '../types'
import { formatCurrencyValue } from '../util'


const CategoryItemScrollSelector: React.FC<ItemSelector & {
  outerClx?: string
  itemClx?: string
}> = observer(({
  category,
  selectedItemRef: iRef,
  selectSku,
  outerClx='',
  itemClx=''
}) => {

  return (
    <ScrollArea className={cn('border border-muted-4 rounded-lg', outerClx)}>
      {category.products.map((prod) => (
        <div key={prod.sku} onClick={() => {selectSku(prod.sku)}}>
          <div className={cn(
            'h-10 border-b flex flex-col justify-center px-4',
            (iRef.item?.sku === prod.sku) ? 'font-semibold text-accent' : 'text-muted', 
            itemClx
          )}>
            {prod.titleAsOption + ', ' + formatCurrencyValue(prod.price)}
          </div>
        </div>
      ))}
    </ScrollArea>
  )
})

export default CategoryItemScrollSelector
