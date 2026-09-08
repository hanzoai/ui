'use client'

/**
 * OrdersHistory — a list of trading orders, each row showing its symbol, time,
 * status, side, share count and price, with an optional cancel action on the
 * still-open ones and an optional click-through to the order.
 *
 * `showFilters` adds a status filter row above the list (All / Open / Filled /
 * Cancelled / Pending) that narrows which orders render; the filter is local
 * state, since it changes what is SHOWN and not the data itself. The three
 * stats in a row (side, shares, price) sit in `@hanzo/ui`'s own `Grid` — a real
 * CSS grid, so the columns stay even regardless of how wide any one value is.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import * as React from 'react'
import { Badge } from './badge'
import { Button } from './button'
import { Cell, Grid } from '../../grid'
import { ink } from './ink'
import { slot } from './slot'

export type OrdersHistorySide = 'buy' | 'sell'
export type OrdersHistoryStatus = 'open' | 'filled' | 'cancelled' | 'pending'
export type OrdersHistoryOrderType = 'market' | 'limit'

export interface Order {
  id: string
  symbol: string
  type: OrdersHistorySide
  shares: number
  price: number
  status: OrdersHistoryStatus
  timestamp: number
  orderType?: OrdersHistoryOrderType
}

export interface OrdersHistoryProps {
  orders: Order[]
  onCancelOrder?: (orderId: string) => void
  onOrderClick?: (order: Order) => void
  /** Shows the status filter row above the list. Defaults to true. */
  showFilters?: boolean
}

const STATUS_COLOR: Record<OrdersHistoryStatus, string> = {
  open: '$blue9',
  filled: '$green9',
  cancelled: '$quiet',
  pending: '$yellow9',
}

const SIDE_COLOR: Record<OrdersHistorySide, string> = {
  buy: '$green9',
  sell: '$red9',
}

const FILTERS = ['all', 'open', 'filled', 'cancelled', 'pending'] as const
type Filter = (typeof FILTERS)[number]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** The ticker half of an exchange-qualified symbol, e.g. `NASDAQ:AAPL` -> `AAPL`. */
const ticker = (symbol: string) => symbol.split(':')[1] || symbol

const RowFrame = styled(YStack, {
  name: 'OrdersHistoryRow',
  bg: '$hover',
  rounded: '$4',
  p: '$3',
  gap: '$2',

  variants: {
    clickable: { true: { cursor: 'pointer', hoverStyle: { bg: '$edge' } } },
  } as const,
})

function OrderRow({
  order,
  onCancelOrder,
  onOrderClick,
}: {
  order: Order
  onCancelOrder?: (orderId: string) => void
  onOrderClick?: (order: Order) => void
}) {
  return (
    <RowFrame
      {...slot('orders-history-row')}
      data-status={order.status}
      clickable={!!onOrderClick}
      onPress={onOrderClick ? () => onOrderClick(order) : undefined}
    >
      <XStack justify="space-between" items="flex-start">
        <YStack>
          {ink(ticker(order.symbol), SizableText, { fontWeight: '600' })}
          {ink(new Date(order.timestamp).toLocaleString(), SizableText, {
            size: '$1',
            color: '$quiet',
          })}
        </YStack>
        <Badge
          {...slot('orders-history-status')}
          variant="outline"
          style={{ borderColor: STATUS_COLOR[order.status], color: STATUS_COLOR[order.status] }}
        >
          {cap(order.status)}
        </Badge>
      </XStack>

      <Grid columns={3} gap="$2">
        <Cell>
          <YStack gap="$1">
            {ink('Side', SizableText, { size: '$1', color: '$quiet' })}
            {ink(order.type.toUpperCase(), SizableText, {
              size: '$1',
              fontWeight: '500',
              color: SIDE_COLOR[order.type],
            })}
          </YStack>
        </Cell>
        <Cell>
          <YStack gap="$1">
            {ink('Shares', SizableText, { size: '$1', color: '$quiet' })}
            {ink(String(order.shares), SizableText, { size: '$1', fontWeight: '500' })}
          </YStack>
        </Cell>
        <Cell>
          <YStack gap="$1">
            {ink('Price', SizableText, { size: '$1', color: '$quiet' })}
            {ink(order.price > 0 ? `$${order.price.toFixed(2)}` : 'Market', SizableText, {
              size: '$1',
              fontWeight: '500',
            })}
          </YStack>
        </Cell>
      </Grid>

      {order.orderType ? (
        <XStack gap="$1">
          {ink('Type:', SizableText, { size: '$1', color: '$quiet' })}
          {ink(cap(order.orderType), SizableText, { size: '$1', fontWeight: '500' })}
        </XStack>
      ) : null}

      {order.status === 'open' && onCancelOrder ? (
        <Button
          {...slot('orders-history-cancel')}
          variant="outline"
          size="sm"
          onPress={(e) => {
            e.stopPropagation()
            onCancelOrder(order.id)
          }}
        >
          Cancel Order
        </Button>
      ) : null}
    </RowFrame>
  )
}

export function OrdersHistory({
  orders = [],
  onCancelOrder,
  onOrderClick,
  showFilters = true,
}: OrdersHistoryProps) {
  const [filter, setFilter] = React.useState<Filter>('all')
  const shown = filter === 'all' ? orders : orders.filter((order) => order.status === filter)

  return (
    <YStack {...slot('orders-history')} gap="$3" p="$4">
      {showFilters ? (
        <XStack {...slot('orders-history-filters')} gap="$2" flexWrap="wrap">
          {FILTERS.map((f) => (
            <Badge
              key={f}
              {...slot('orders-history-filter')}
              data-active={filter === f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              style={{ cursor: 'pointer' }}
            >
              {cap(f)}
            </Badge>
          ))}
        </XStack>
      ) : null}

      {shown.length === 0 ? (
        <YStack {...slot('orders-history-empty')} items="center" py="$8">
          {ink('No orders yet', SizableText, { size: '$2', color: '$quiet' })}
        </YStack>
      ) : (
        <YStack gap="$2">
          {shown.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onCancelOrder={onCancelOrder}
              onOrderClick={onOrderClick}
            />
          ))}
        </YStack>
      )}
    </YStack>
  )
}

export default OrdersHistory
