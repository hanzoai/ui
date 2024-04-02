'use client'
import React from 'react'
import { observer } from 'mobx-react-lite'

import { 
  Label, 
  RadioGroup, 
  RadioGroupItem,
  ScrollArea 
} from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import type { ItemSelectorProps, LineItem } from '../../types'
import { formatCurrencyValue } from '../../util'

const RadioItemSelector: React.FC<ItemSelectorProps> = observer(({
  items,
  selectedItemRef: itemRef,
  selectSku,
  clx='',
  itemClx='',
  soleItemClx='',
  showCategory=false,
  showQuantity=false,
  scrollList=false
}) => {

  const LabelText: React.FC<{item: LineItem}> = ({item}) => (
    (showCategory ? (item.categoryTitle + ', ' + item.optionLabel) : item.optionLabel) + 
    (showCategory ? ': ' : ', ') + formatCurrencyValue(item.price)
  )

  const ItemAndPrice: React.FC<{
    item: LineItem
    listBoxMode: boolean
    selected: boolean
    className?: string
  }> = ({
    item,
    listBoxMode,
    selected,
    className=''
  }) => (
    <div className={cn(
      'flex items-center', 
      className, 
      itemClx,
    )}>
      <RadioGroupItem
        value={item.sku} 
        larger
        id={item.sku} 
        className={'mr-2 ' + (listBoxMode ?  'hidden' : '')}
      />
      <Label htmlFor={item.sku} className={selected ? 'text-accent' : ''}>
        <LabelText item={item} />
      </Label>
    </div>
  )
 
  const Item: React.FC<{
    item: LineItem
    selected: boolean
    listBoxMode: boolean
    clx?: string
  }> = ({
    item,
    selected,
    listBoxMode,
    clx=''
  }) => {

    const outClx = [
      'h-10',
      (listBoxMode ? 'border-b border-muted-3 py-1 pl-2' : 'mb-3'),
      (selected && listBoxMode ? 'border border-foreground rounded-sm' : ''),
    ]

    return (showQuantity ? (
      <div key={item.sku} className={cn('flex flex-row items-center', ...outClx, clx )}>
        <ItemAndPrice item={item} selected={selected} listBoxMode={listBoxMode} className='grow'/>
        <div className='grow-0 shrink-0 font-semibold text-sm leading-none px-2'>{ item.quantity > 0 ? `(${item.quantity})` : ' '}</div>
      </div>
    ) : (
      <ItemAndPrice 
        key={item.sku} 
        item={item} 
        selected={selected} 
        listBoxMode={listBoxMode} 
        className={cn(...outClx, 
        listBoxMode ? '' : 'mb-1',
        clx)} 
      />
    ))
  }

  return items.length > 1 ? (
    <RadioGroup
      className={cn('flex flex-col gap-0', 
        (scrollList ? 'shrink min-h-0' : ''), 
        clx,
      )}
      onValueChange={selectSku}
      value={itemRef.item ? itemRef.item.sku : ''}
    >
      {scrollList ? (
        <ScrollArea className='mt-2 w-full h-full py-0 border border-muted-2 rounded-sm '>
          {items.map((item) => (
            <Item item={item} listBoxMode={true} selected={itemRef.item?.sku === item.sku}/>
          ))}
        </ScrollArea>
      ) : (<>
        {items.map((item) => (
          <Item item={item} listBoxMode={false} selected={itemRef.item?.sku === item.sku}/>
        ))}
      </>)}
    </RadioGroup>
  ) : (
    <div className={soleItemClx}>
      <LabelText item={items[0]} />
    </div>
  )
})

export default RadioItemSelector
