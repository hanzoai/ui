import React, { type PropsWithChildren } from 'react'

import { cn, containsToken } from '../../util'

import type { GridBlock } from '../def'
import Content from './content'

import type BlockComponentProps from './block-component-props'

const gridClx = (d: number | { columns: number, gap: number}, prefix?: string ): string => (
  (typeof d === 'number') ? 
    `${(prefix ?? '')}grid-cols-${d} ` 
    : 
    `${(prefix ?? '')}grid-cols-${d.columns} ${(prefix ?? '')}gap-${d.gap} ` 
)

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
  const styleTable = specified('style-table-borders')

    // https://tailwindcss.com/docs/content-configuration#dynamic-class-names
    // All variants in use MUST be in style/safelist.tailwind.js
  let clx = 'grid '
  if (agent === 'phone') {
    const d = (grid.mobile) ? grid.mobile : (grid.at.xs ? grid.at.xs : grid.at.sm ?? 1);
    clx += gridClx(d)
  }
  else {
    let defaultSet = false
    for (const [key, value] of Object.entries(grid.at)) {
      if (!defaultSet) {
        clx += gridClx(value)
        defaultSet = true
      }
      else {
        clx += gridClx(value, `${key}:`)
      }
    }   
  }

  

  const getCellClx = (index: number): string => {

    if (!styleTable) return ''
      // assume grid-cols is define in md
    const COL = (typeof grid.at.md! === 'number') ? grid.at.md! : grid.at.md!.columns  

    const isFirstRow = (): boolean  => (index < COL)
    const isFirstColumn = (): boolean  => (index % COL === 0)
    const isTLCorner = (): boolean  => (index === 0)
    const isTRCorner = (): boolean  => (index === COL -1 )
    const isBLCorner = (): boolean  => (index === cells!.length - COL)
    const isBRCorner = (): boolean  => (index === cells!.length - 1)

      // all get a right and bottom border and padding, 
      // other borders are a special base
    let clx = 'border-b md:border-r p-4 md:p-8 lg:p-12 '
    if (isFirstRow()) {
      clx += 'border-t '
    }
    if (isFirstColumn()) {
      clx += 'md:border-l '
    }
      // on mobile this will be the first (top) cell
    if (isTLCorner()) {
      clx += 'border-t md:rounded-tl-lg '
    }
    else if (isTRCorner()) {
      clx += 'md:rounded-tr-lg '
    }
    else if (isBLCorner()) {
      clx += 'md:rounded-bl-lg '
    }
    else if (isBRCorner()) {
      clx += 'md:rounded-br-lg '
    }

    return clx
  } 

  const defaultGapClx = (styleTable) ? 'gap-0' : 'gap-2' 

  return (
    <div className={cn('grid md:gap-4 xl:gap-6', clx, defaultGapClx, className)}>
    {cells?.length ? (
      cells.map((cell, index) => (
        <Content blocks={cell} agent={agent} key={`cell-${index}`} className={getCellClx(index)}/>
      ))) : children
    }
    </div>
  )
}

export default GridBlockComponent
