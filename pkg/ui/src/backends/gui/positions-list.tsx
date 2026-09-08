'use client'

/**
 * PositionsList — a list of open trading positions, each row showing its
 * ticker, share count, average and current price, total value and P&L, with
 * the P&L sign colouring the row's trend icon. Clicking a row is optional; it
 * only becomes a button when `onPositionClick` is given.
 *
 * The two price stats and the two value stats sit in `@hanzo/ui`'s own `Grid`
 * — a real CSS grid, so both pairs of columns stay even regardless of how wide
 * any one value is.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import { TrendingDown, TrendingUp } from '@hanzogui/lucide-icons-2'
import * as React from 'react'
import { Cell, Grid } from '../../grid'
import { ink } from './ink'
import { slot } from './slot'

export interface Position {
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number
}

export interface PositionsListProps {
  positions: Position[]
  onPositionClick?: (position: Position) => void
}

/** The ticker half of an exchange-qualified symbol, e.g. `NASDAQ:AAPL` -> `AAPL`. */
const ticker = (symbol: string) => symbol.split(':')[1] || symbol

const RowFrame = styled(YStack, {
  name: 'PositionsListRow',
  bg: '$hover',
  rounded: '$4',
  p: '$3',
  gap: '$2',

  variants: {
    clickable: { true: { cursor: 'pointer', hoverStyle: { bg: '$edge' } } },
  } as const,
})

function PositionRow({
  position,
  onPositionClick,
}: {
  position: Position
  onPositionClick?: (position: Position) => void
}) {
  const pl = (position.currentPrice - position.avgPrice) * position.shares
  const plPercent = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100
  const totalValue = position.currentPrice * position.shares
  const gain = pl >= 0

  return (
    <RowFrame
      {...slot('positions-list-row')}
      data-trend={gain ? 'up' : 'down'}
      clickable={!!onPositionClick}
      onPress={onPositionClick ? () => onPositionClick(position) : undefined}
    >
      <XStack justify="space-between" items="center">
        {ink(ticker(position.symbol), SizableText, { fontWeight: '600' })}
        <XStack items="center" gap="$1">
          {gain ? <TrendingUp size={14} color="$green9" /> : <TrendingDown size={14} color="$red9" />}
          {ink(`${gain ? '+' : ''}${plPercent.toFixed(2)}%`, SizableText, {
            size: '$1',
            fontWeight: '600',
            color: gain ? '$green9' : '$red9',
          })}
        </XStack>
      </XStack>

      <Grid columns={2} gap="$2">
        <Cell>
          <YStack gap="$1">
            {ink('Shares', SizableText, { size: '$1', color: '$quiet' })}
            {ink(String(position.shares), SizableText, { size: '$1', fontWeight: '500' })}
          </YStack>
        </Cell>
        <Cell>
          <YStack gap="$1">
            {ink('Avg Price', SizableText, { size: '$1', color: '$quiet' })}
            {ink(`$${position.avgPrice.toFixed(2)}`, SizableText, {
              size: '$1',
              fontWeight: '500',
            })}
          </YStack>
        </Cell>
      </Grid>

      <Grid columns={2} gap="$2">
        <Cell>
          <YStack gap="$1">
            {ink('Current Price', SizableText, { size: '$1', color: '$quiet' })}
            {ink(`$${position.currentPrice.toFixed(2)}`, SizableText, {
              size: '$1',
              fontWeight: '500',
            })}
          </YStack>
        </Cell>
        <Cell>
          <YStack gap="$1">
            {ink('Total Value', SizableText, { size: '$1', color: '$quiet' })}
            {ink(`$${totalValue.toFixed(2)}`, SizableText, { size: '$1', fontWeight: '500' })}
          </YStack>
        </Cell>
      </Grid>

      <XStack {...slot('positions-list-pnl')} justify="space-between" items="center">
        {ink('P&L', SizableText, { size: '$1', color: '$quiet' })}
        {ink(`${gain ? '+' : ''}$${pl.toFixed(2)}`, SizableText, {
          size: '$1',
          fontWeight: '600',
          color: gain ? '$green9' : '$red9',
        })}
      </XStack>
    </RowFrame>
  )
}

export function PositionsList({ positions = [], onPositionClick }: Partial<PositionsListProps>) {
  if (positions.length === 0) {
    return (
      <YStack {...slot('positions-list-empty')} items="center" py="$8">
        {ink('No open positions', SizableText, { size: '$2', color: '$quiet' })}
      </YStack>
    )
  }

  return (
    <YStack {...slot('positions-list')} gap="$2" p="$4">
      {positions.map((position) => (
        <PositionRow key={position.symbol} position={position} onPositionClick={onPositionClick} />
      ))}
    </YStack>
  )
}

export default PositionsList
