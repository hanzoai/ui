'use client'
import React from 'react'
import { cn } from '../util'

function Item<T>({
  value,
  label,
  className,
  onClick,
  first=false,
  last=false,
  selected=false
}:{
  value: T
  label: string
  className: string
  onClick: (val: T) => void
  first?: boolean
  last?: boolean
  selected?: boolean
}) {

  return (
    <div 
      className={cn(
        'font-normal text-muted-1 px-3 py-1 cursor-pointer hover:text-foreground ', 
        last ? '' : 'border-b', 
        selected ? 'font-semibold text-accent hover:text-accent' : '', 
        className
      )} 
      onClick={() => {onClick(value)}}
    >
      <span>{label}</span>
    </div>
  )
}

function ListBox<T>({
  values,
  labels,
  onValueChange,
  value,
  isEqual,
  clx = '',
  itemClx = '' 
}:{
  values: T[]
  labels: string[]
  onValueChange: (val: T) => void
  value: T | undefined
  isEqual: (v1: T, v2: T) => boolean
  clx?: string
  itemClx?: string 
}): React.ReactElement {

  return (
    <div className={cn('border rounded-md select-none', clx)} >
    {values.map((val, i) => (
      <Item<T> 
        value={val} 
        label={labels[i]} 
        onClick={onValueChange} 
        className={itemClx}
        first={i === 0}
        last={i === values.length - 1}
        selected={value && isEqual(val, value)}
        key={labels[i]}
      />
    ))}
    </div>
  )
}

export default ListBox
