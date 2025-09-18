import React, { PropsWithChildren } from 'react'

import { cn, containsToken } from '../../../util'
import type { GridBlock } from '../../def'
import type { GridColumnSpec } from '../../../types'

import Content from '../content'
import type BlockComponentProps from '../block-component-props'

import getMutator from './mutator-registry'

  // These must be / are safelisted in tailwind.config
const gridClx = (d: GridColumnSpec, prefix?: string ): string => (
  (typeof d === 'number') ? 
    `${(prefix ?? '')}grid-cols-${d} ` 
    : 
    `${(prefix ?? '')}grid-cols-${d.columns} ${(prefix ?? '')}gap-${d.gap} ` 
)

  /**
   * A component that lays out the Blocks in 'cells' on a grid.  
   * If invoked directly, and children are supplied, 
   * block.cells is ignore and the children are rendered.
   */
const GridBlockComponent: React.FC<
  BlockComponentProps & PropsWithChildren
> = ({
  block,
  className='',
  agent,
  children
}) => {

  if (block.blockType !== 'grid') {
    return <>grid block required</>
  }

  const { cells, grid, specifiers } = block as GridBlock
  const specified = (s: string) => (containsToken(specifiers, s))
  const mutator = specified('style-table-borders') ? getMutator('style-table-borders') : undefined

    // https://tailwindcss.com/docs/content-configuration#dynamic-class-names
    // All variants in use MUST be in style/safelist.tailwind.js
  let clx = 'grid '
  if (agent === 'phone') {
    const d = (grid.mobile) ? grid.mobile : (grid.at.xs ? grid.at.xs : (grid.at.sm ?? 1))
    clx += gridClx(d)
  }
  else {
    let defaultSet = false
    for (const [key, value] of Object.entries(grid.at)) {
      if (!defaultSet) {
          // ts brain fart!
        clx += gridClx(value as GridColumnSpec)
        defaultSet = true
      }
      else {
          // ts brain fart!
        clx += gridClx(value  as GridColumnSpec, `${key}:`)
      }
    }   
  }

  let getMutatorCellClx = (ignore: number): string => ('')
  if (mutator?.getCellClx) {
    const colCount = (typeof grid.at.md! === 'number') ? grid.at.md! as number : grid.at.md!.columns
    const cellCount = cells?.length  
    if (!colCount || !cellCount) {
      throw new Error('GridBlockComponent: using mutator, but colCount and / or cellCount is invalid!')
    }
    getMutatorCellClx = (cellIndex: number) => ( mutator!.getCellClx!(cellIndex, cellCount, colCount) )
  }
  
  return (
    <div className={cn('grid gap-2 md:gap-4 xl:gap-6', clx, (mutator?.gapClx ?? ''), className)}>
    {React.Children.count(children) > 0 ? children : cells?.map((cell, index) => (
      <Content blocks={cell} agent={agent} key={`cell-${index}`} className={getMutatorCellClx(index)}/>
    ))}
    </div>
  )
}

export default GridBlockComponent
