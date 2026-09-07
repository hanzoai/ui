'use client'

/**
 * Comparison — a pricing/feature table laid out as one column per plan.
 *
 * Each column lists the same rows in the same order; a row's value is either a
 * boolean (rendered as a check or a cross) or a string (rendered as text), so
 * a caller mixes "Users: 25" with "Support: yes" in one column without two
 * component shapes. `highlighted` marks the plan the table wants to sell.
 *
 * Layout is `../../grid`'s real CSS grid — equal tracks, one per column — with
 * `YStack`/`XStack` for the card and its rows.
 */
import { SizableText, YStack, XStack, styled } from '@hanzo/gui'
import { Check, X } from '@hanzogui/lucide-icons-2'
import type { ReactNode } from 'react'
import { Grid } from '../../grid'
import { slot } from './slot'

export interface ComparisonItem {
  label: string
  value: boolean | string
}

export interface ComparisonColumn {
  title: string
  items: ComparisonItem[]
  /** Marks the plan the table wants to sell: a raised border and shadow. */
  highlighted?: boolean
}

export interface ComparisonProps {
  columns: ComparisonColumn[]
  children?: never
}

const ICON = 20

const Card = styled(YStack, {
  name: 'ComparisonColumn',
  p: '$5',
  rounded: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  gap: '$4',

  variants: {
    highlighted: {
      true: {
        borderColor: '$color9',
        shadowColor: '$shadowColor',
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    },
  } as const,
})

const Row = ({ item }: { item: ComparisonItem }): ReactNode => (
  <XStack {...slot('comparison-item')} items="center" gap="$3">
    {typeof item.value === 'boolean' ? (
      item.value ? (
        <Check
          {...slot('comparison-item-check')}
          size={ICON}
          color="$green9"
        />
      ) : (
        <X {...slot('comparison-item-cross')} size={ICON} color="$red9" />
      )
    ) : (
      <SizableText {...slot('comparison-item-value')} fontWeight="600">
        {item.value}
      </SizableText>
    )}
    <SizableText size="$3">{item.label}</SizableText>
  </XStack>
)

export function Comparison({ columns }: ComparisonProps) {
  return (
    <div {...slot('comparison')} style={{ overflowX: 'auto' }}>
      <Grid columns={columns.length} gap="$4">
        {columns.map((column, index) => (
          <Card
            key={column.title || index}
            {...slot('comparison-column')}
            data-highlighted={column.highlighted ? '' : undefined}
            highlighted={column.highlighted}
          >
            <SizableText size="$6" fontWeight="600">
              {column.title}
            </SizableText>
            <YStack gap="$3">
              {column.items.map((item, itemIndex) => (
                <Row key={item.label || itemIndex} item={item} />
              ))}
            </YStack>
          </Card>
        ))}
      </Grid>
    </div>
  )
}
