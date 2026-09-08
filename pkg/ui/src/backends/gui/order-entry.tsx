'use client'

/**
 * OrderEntry — a trading ticket: buying power, buy/sell side, market/limit
 * type, a share count and, for a limit order, a limit price, ending in one
 * submit button that reads the side and the ticker back to the trader.
 *
 * The two segmented rows (side, order type) are `Grid` with two equal tracks
 * rather than a stack, matching the two-dimensional layout the original
 * markup used (`grid-cols-2`) instead of approximating it with flex.
 */
import { SizableText, YStack } from '@hanzo/gui'
import { useState } from 'react'
import { Grid, Cell } from '../../grid'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { slot } from './slot'

export type OrderSide = 'buy' | 'sell'
export type OrderKind = 'market' | 'limit'

export interface PlacedOrder {
  symbol: string
  side: OrderSide
  orderType: OrderKind
  shares: number
  limitPrice?: number
}

export interface OrderEntryProps {
  /** Trading symbol, e.g. `"NASDAQ:AAPL"`. The part after `:` is the ticker shown on the submit button. */
  symbol?: string
  /** Buying power shown at the top of the ticket. */
  accountBalance?: number
  /** Fired with the composed order when the trader submits it; the form then clears. */
  onPlaceOrder?: (order: PlacedOrder) => void
  disabled?: boolean
}

const ticker = (symbol: string) => symbol.split(':')[1] || symbol

const SIDE_ON = { buy: '$green9', sell: '$red9' } as const

function OrderEntry({
  symbol = 'NASDAQ:AAPL',
  accountBalance = 10000,
  onPlaceOrder = () => {},
  disabled = false,
}: OrderEntryProps) {
  const [orderType, setOrderType] = useState<OrderKind>('market')
  const [orderSide, setOrderSide] = useState<OrderSide>('buy')
  const [shares, setShares] = useState('')
  const [limitPrice, setLimitPrice] = useState('')

  const canSubmit = !disabled && !!shares && (orderType !== 'limit' || !!limitPrice)

  const submit = () => {
    if (!canSubmit) return
    onPlaceOrder({
      symbol,
      side: orderSide,
      orderType,
      shares: parseInt(shares, 10),
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
    })
    setShares('')
    setLimitPrice('')
  }

  return (
    <YStack {...slot('order-entry')} p="$4" gap="$4">
      <YStack {...slot('order-entry-balance')} bg="$hover" rounded="$3" p="$3">
        <SizableText size="$1" color="$quiet" mb="$1">
          Buying Power
        </SizableText>
        <SizableText size="$5" fontWeight="600" color="$ink">
          ${accountBalance.toLocaleString()}
        </SizableText>
      </YStack>

      <Grid {...slot('order-entry-side')} columns={2} gap="$2">
        {(['buy', 'sell'] as const).map((side) => (
          <Cell key={side}>
            <Button
              {...slot('order-entry-side-option')}
              data-state={orderSide === side ? 'on' : 'off'}
              role="radio"
              aria-checked={orderSide === side}
              variant="ghost"
              width="100%"
              disabled={disabled}
              onPress={() => setOrderSide(side)}
              bg={orderSide === side ? SIDE_ON[side] : ('$hover' as const)}
              // `color` reaches Button.Frame through gui's own text-context —
              // applied at runtime but never declared on the Frame's own prop
              // type, the same gap `toggle-group.tsx` casts around elsewhere.
              // @ts-expect-error color is a real, working prop the Frame's type omits
              color={orderSide === side ? '$white1' : '$quiet'}
              hoverStyle={orderSide === side ? { bg: SIDE_ON[side] } : { bg: '$edge' }}
              fontWeight="600"
            >
              {side === 'buy' ? 'Buy' : 'Sell'}
            </Button>
          </Cell>
        ))}
      </Grid>

      <YStack {...slot('order-entry-type')} gap="$2">
        <Label>Order Type</Label>
        <Grid columns={2} gap="$2">
          {(['market', 'limit'] as const).map((kind) => (
            <Cell key={kind}>
              <Button
                {...slot('order-entry-type-option')}
                data-state={orderType === kind ? 'on' : 'off'}
                role="radio"
                aria-checked={orderType === kind}
                variant="ghost"
                size="sm"
                width="100%"
                disabled={disabled}
                onPress={() => setOrderType(kind)}
                bg={orderType === kind ? ('$rim' as const) : ('$hover' as const)}
                // @ts-expect-error color is a real, working prop the Frame's type omits
                color={orderType === kind ? '$ink' : '$quiet'}
                hoverStyle={orderType === kind ? { bg: '$rim' } : { bg: '$edge' }}
              >
                {kind === 'market' ? 'Market' : 'Limit'}
              </Button>
            </Cell>
          ))}
        </Grid>
      </YStack>

      <YStack {...slot('order-entry-shares')} gap="$2">
        <Label htmlFor="order-entry-shares-input">Shares</Label>
        <Input
          id="order-entry-shares-input"
          type="number"
          placeholder="0"
          value={shares}
          onChangeText={setShares}
          disabled={disabled}
        />
      </YStack>

      {orderType === 'limit' && (
        <YStack {...slot('order-entry-limit-price')} gap="$2">
          <Label htmlFor="order-entry-limit-price-input">Limit Price</Label>
          <Input
            id="order-entry-limit-price-input"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={limitPrice}
            onChangeText={setLimitPrice}
            disabled={disabled}
          />
        </YStack>
      )}

      <Button
        {...slot('order-entry-submit')}
        variant="ghost"
        size="lg"
        width="100%"
        disabled={!canSubmit}
        onPress={submit}
        bg={SIDE_ON[orderSide]}
        // @ts-expect-error color is a real, working prop the Frame's type omits
        color="$white1"
        fontWeight="600"
        hoverStyle={{ bg: SIDE_ON[orderSide], opacity: 0.9 }}
      >
        {orderSide === 'buy' ? 'Buy' : 'Sell'} {ticker(symbol)}
      </Button>
    </YStack>
  )
}

export { OrderEntry }
