'use client'
/**
 * PaymentMethodRow + PaymentMethodsList — stored card management.
 *
 * Monochrome by design: brands read as a typeset chip, never a color logo, so
 * the list stays neutral. Row actions live in a DropdownMenu; the list owns the
 * add-method CTA and empty state.
 */
import * as React from 'react'
import { CreditCard, MoreHorizontal, Plus } from 'lucide-react'

import { Badge } from '../../primitives/badge'
import { Button } from '../../primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../primitives/dropdown-menu'
import { cn } from '../utils'
import type { CardBrand, PaymentMethod } from './types'

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  diners: 'Diners',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  unknown: 'Card',
}

function BrandChip({ brand }: { brand: CardBrand }) {
  return (
    <span className="inline-flex h-7 min-w-[3rem] items-center justify-center rounded-md border bg-muted px-2 text-[0.65rem] font-semibold uppercase tracking-wide text-foreground/80">
      {BRAND_LABEL[brand] ?? BRAND_LABEL.unknown}
    </span>
  )
}

function formatExp(month?: number, year?: number): string | null {
  if (!month || !year) return null
  const mm = String(month).padStart(2, '0')
  const yy = String(year).slice(-2)
  return `${mm}/${yy}`
}

export interface PaymentMethodRowProps {
  method: PaymentMethod
  onSetDefault?: (id: string) => void
  onRemove?: (id: string) => void
  className?: string
}

export const PaymentMethodRow = React.forwardRef<
  HTMLDivElement,
  PaymentMethodRowProps
>(({ method, onSetDefault, onRemove, className }, ref) => {
  const { id, brand, last4, expMonth, expYear, isDefault } = method
  const exp = formatExp(expMonth, expYear)
  const hasActions = Boolean(onSetDefault || onRemove)

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40',
        className,
      )}
    >
      <BrandChip brand={brand} />
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tabular-nums">
            <span aria-hidden="true">•••• </span>
            <span className="sr-only">ending in </span>
            {last4}
          </span>
          {isDefault && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[0.65rem]">
              Default
            </Badge>
          )}
        </div>
        {exp && (
          <span className="text-xs tabular-nums text-muted-foreground">
            Expires {exp}
          </span>
        )}
      </div>

      {hasActions && (
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Manage card ending in ${last4}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onSetDefault && !isDefault && (
                <DropdownMenuItem onSelect={() => onSetDefault(id)}>
                  Set as default
                </DropdownMenuItem>
              )}
              {onSetDefault && !isDefault && onRemove && (
                <DropdownMenuSeparator />
              )}
              {onRemove && (
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => onRemove(id)}
                >
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
})
PaymentMethodRow.displayName = 'PaymentMethodRow'

export interface PaymentMethodsListProps {
  methods: PaymentMethod[]
  onSetDefault?: (id: string) => void
  onRemove?: (id: string) => void
  /** When provided, an add-method CTA is rendered in the footer. */
  onAdd?: () => void
  addLabel?: string
  emptyState?: React.ReactNode
  className?: string
}

export const PaymentMethodsList = React.forwardRef<
  HTMLDivElement,
  PaymentMethodsListProps
>(
  (
    { methods, onSetDefault, onRemove, onAdd, addLabel = 'Add payment method', emptyState, className },
    ref,
  ) => {
    const isEmpty = methods.length === 0
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm',
          className,
        )}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
            <CreditCard className="mb-1 size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {emptyState ?? 'No payment methods on file.'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {methods.map((m) => (
              <PaymentMethodRow
                key={m.id}
                method={m}
                onSetDefault={onSetDefault}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
        {onAdd && (
          <div className={cn('p-3', !isEmpty && 'border-t')}>
            <Button
              variant="outline"
              className="w-full"
              onClick={onAdd}
            >
              <Plus className="size-4" />
              {addLabel}
            </Button>
          </div>
        )}
      </div>
    )
  },
)
PaymentMethodsList.displayName = 'PaymentMethodsList'
