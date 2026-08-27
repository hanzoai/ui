'use client'
import React, { useState } from 'react'

import {
  ToggleGroup,
  ToggleGroupItem,
  cn,
  type ToggleGroupSize,
} from '@hanzo/ui'
import type { CategoryNode, StringMutator, StringArrayMutator } from '../../types'
import NodeImage from './node-image'

const NodeTabs: React.FC<{
  levelNodes: CategoryNode[]
  mutator: StringMutator | StringArrayMutator
  multiple?: boolean
  className?: string
  /** Layout the caller computes from data. A column count is a number, and a
   *  number cannot be a class name — Tailwind reads source text, so a template
   *  literal never becomes a rule. */
  style?: React.CSSProperties
  buttonClx?: string
  itemClx?: string
  mobile?: boolean
  tabSize?: ToggleGroupSize
  show?: 'image' | 'label' | 'image-and-label'
}> = ({
  levelNodes,
  mutator,
  multiple=false,
  buttonClx='',
  itemClx='',
  className='',
  style,
  mobile=false,
  tabSize,
  show='image-and-label'
}) => {

  const [last, setLast] = useState<string | undefined>(undefined)

  const handleChangeMultiple = (selected: string[]) => {
    (mutator as StringArrayMutator).set(selected)
    setLast(selected.length === 1 ? selected[0] : undefined)
  }

  const handleChangeSingle = (selected: string) => {
    (mutator as StringMutator).set(selected)
    if (selected) { setLast(selected) }
  }

  const val = multiple
    ? (mutator as StringArrayMutator).get()
    : (mutator as StringMutator).get()

  // The per-item `rounded` that used to ride here named a 5.x variant. The
  // group owns the segmented look now, so passing it did nothing but say it did.
  return (
    <ToggleGroup
      type={multiple ? 'multiple' : 'single'}
      value={val}
      variant='default'
      size={tabSize ? tabSize : (mobile ? 'sm' : 'default')}
      onValueChange={multiple ? handleChangeMultiple : handleChangeSingle}
      className={className}
      // The two type systems meet here. gui types `style` as a native view
      // style; on web it hands the object straight to the DOM element, and a
      // `grid-template-columns` written this way arrives as inline CSS
      // (measured). The cast says which of the two platforms this is.
      style={style as React.ComponentProps<typeof ToggleGroup>['style']}
    >
    {levelNodes.map((treeNode) => (
      <ToggleGroupItem
        key={treeNode.skuToken}
        value={treeNode.skuToken}
        disabled={(last && last === treeNode.skuToken || treeNode.skuToken === mutator.get())}
        aria-label={`Select ${treeNode.label}`}
        className={buttonClx}
      >
        <span className={cn('flex flex-row justify-center gap-1 h-6 items-center', itemClx)} >
          {!(show === 'label') && (<NodeImage treeNode={treeNode} />) }
          {(!(show === 'image') || !treeNode.img) && (<span className='whitespace-nowrap'>{treeNode.label}</span>)}
        </span>
      </ToggleGroupItem>
    ))}
    </ToggleGroup>
  )
}

export default NodeTabs
