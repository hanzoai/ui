import type { Dimensions } from '@hanzo/ui/types'

import type { Family } from './family'
import type { ItemSelectorOptions } from './item-selector'
import type { MultiFamilySelectorOptions } from './selection-ui-specifier'
import type { CategoryNode } from './category-node'
import type { LineItem } from './line-item'

interface MultiFamilySelectorProps {
  families: Family[]
  parent: CategoryNode
  clx?: string
  itemClx?: string
  itemOptions?: ItemSelectorOptions
  selectorOptions?: MultiFamilySelectorOptions 
  mediaConstraint?: Dimensions
  mobile?: boolean
}

export { type MultiFamilySelectorProps as default }