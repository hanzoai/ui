'use client'

/**
 * Comparison — a plan/feature grid: one column per plan, one row per feature.
 *
 * Columns are laid out with `Grid`/`Cell` (real CSS grid, tracks owned by the
 * container) rather than a row of stacks, so every column stays the same
 * width regardless of its content. A boolean item renders as a check or an
 * cross; a string item renders as text.
 */
import { SizableText, YStack, XStack, styled } from '@hanzo/gui'
import { Check, X } from '@hanzogui/lucide-icons-2'
import type { ReactNode } from 'react'
import { Grid, Cell, type GridProps } from '../../grid'
import { ink } from './ink'
import { slot } from './slot'

export interface ComparisonItem {
  label: string
  value: boolean | string
}

export interface ComparisonColumn {
  title: string
  items: ComparisonItem[]
  highlighted?: boolean
}

const ColumnFrame = styled(YStack, {
  name: 'ComparisonColumn',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$4',
  p: '$5',
  gap: '$4',

  variants: {
    highlighted: {
      true: { borderColor: '$color', shadowColor: '$shadowColor', shadowRadius: 12, shadowOpacity: 0.15 },
    },
  } as const,
})

const Title = styled(SizableText, { name: 'ComparisonTitle', size: '$5', fontWeight: '600' })
const Label = styled(SizableText, { name: 'ComparisonLabel', size: '$2' })
const Value = styled(SizableText, { name: 'ComparisonValue', size: '$2', fontWeight: '600' })

const Row = styled(XStack, { name: 'ComparisonRow', items: 'center', gap: '$3' })

const mark = (value: boolean | string): ReactNode =>
  typeof value === 'boolean' ? (
    value ? (
      <Check {...slot('comparison-item-check')} size={18} color="$green9" />
    ) : (
      <X {...slot('comparison-item-cross')} size={18} color="$red9" />
    )
  ) : (
    <Value>{value}</Value>
  )

export type ComparisonProps = Omit<GridProps, 'columns' | 'children'> & {
  columns: ComparisonColumn[]
}

export function Comparison({ columns, gap = '$4', ...props }: ComparisonProps) {
  return (
    <Grid {...slot('comparison')} columns={columns.length || 1} gap={gap} {...props}>
      {columns.map((column, i) => (
        <Cell key={i}>
          <ColumnFrame
            {...slot('comparison-column')}
            data-highlighted={column.highlighted ? '' : undefined}
            highlighted={column.highlighted}
          >
            {ink(column.title, Title)}
            <YStack gap="$3">
              {column.items.map((item, j) => (
                <Row key={j} {...slot('comparison-item')}>
                  {mark(item.value)}
                  <Label>{item.label}</Label>
                </Row>
              ))}
            </YStack>
          </ColumnFrame>
        </Cell>
      ))}
    </Grid>
  )
}
