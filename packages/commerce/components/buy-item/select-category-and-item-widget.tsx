'use client'
import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { ApplyTypography, ListBox } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import type { FacetValueDesc, FacetsValue, LineItem } from '../../types'
import { useCommerce } from '../../service/context'
import { formatCurrencyValue } from '../../util'

import FacetTogglesWidget from '../facet-values-widget'

const formatItem = (item: LineItem, withQuantity: boolean = false): string => (
  `${item.titleAsOption}, ${formatCurrencyValue(item.price)}${(withQuantity && item.quantity > 0) ? `  (${item.quantity})` : ''}`
)

const SelectCategoryAndItemWidget: React.FC<{
  categoryLevel: number
  parentLevelToken: string
  categoryLevelValues: FacetValueDesc[]
  className?: string
}> = observer(({
  categoryLevel, 
  parentLevelToken,
  categoryLevelValues,
  className=''
}) => {
  const comm = useCommerce()

  useEffect(() => {
    const facets: FacetsValue = {}
    facets[categoryLevel - 1] = [parentLevelToken]
    facets[categoryLevel] = [categoryLevelValues[0].value]
    comm.setFacets(facets)
    comm.setCurrentItem(comm.specifiedCategories[0].products[0].sku)
  }, [])

  const onFacetTokenChanged = (token: string): void => {
    const facets: FacetsValue = {}
    facets[categoryLevel - 1] = [parentLevelToken]
    facets[categoryLevel] = [token]
    comm.setFacets(facets)
  }

  const currentFacetToken = (): string | null => {
    if (comm.specifiedCategories.length === 0) return null
    const skuPath = comm.specifiedCategories[0].id
    const skuPathTokens = skuPath.split('-')
    return skuPathTokens.length > 0 ? skuPathTokens[skuPathTokens.length - 1] : null
  }

  return (
    <div className={cn('flex flex-col justify-start gap-4 items-start pt-3', className)}>
      <FacetTogglesWidget 
        facetValues={categoryLevelValues} 
        mutator={{
          get: currentFacetToken, // computed's are accessed through their get()
          set: onFacetTokenChanged
        }} 
      />
      {comm.specifiedItems.length === 0 ? (
        <ApplyTypography>
          <h3>No Items</h3>
        </ApplyTypography>
      ) : comm.specifiedItems.length === 1 ? (
        <ApplyTypography>
          <h4>{formatItem(comm.specifiedItems[0])}</h4>
        </ApplyTypography>
      ) : (
        <ListBox<string> 
          values={comm.specifiedItems.map((it) => (it.sku))}   
          labels={comm.specifiedItems.map((it) => (formatItem(it)))}   
          isEqual={(v1: string, v2: string) => (v1 === v2)}
          value={comm.currentItem?.sku}
          onValueChange={comm.setCurrentItem.bind(comm)}
        />
      )}
    </div>
  )
})

export default SelectCategoryAndItemWidget
