'use client'

/**
 * List — a vertical group of rows: a real `<ul>` (`List`) whose rows are real
 * `<li>`s (`ListItem`), spaced by gap rather than a margin hack so the first
 * and last row carry no stray space.
 */
import { YStack, styled } from '@hanzo/gui'
import type * as React from 'react'
import { slot } from './slot'

const ListFrame = styled(YStack, {
  name: 'List',
  gap: '$2',
})

const ListItemFrame = styled(YStack, {
  name: 'ListItem',
})

export type ListProps = React.ComponentProps<typeof ListFrame>
export type ListItemProps = React.ComponentProps<typeof ListItemFrame>

export function List({ children, ...props }: ListProps) {
  return (
    <ListFrame {...slot('list')} render="ul" {...props}>
      {children}
    </ListFrame>
  )
}

export function ListItem({ children, ...props }: ListItemProps) {
  return (
    <ListItemFrame {...slot('list-item')} render="li" {...props}>
      {children}
    </ListItemFrame>
  )
}
