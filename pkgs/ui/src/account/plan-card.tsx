'use client'
/**
 * PlanCard + PlansGrid — pricing / plan selection.
 *
 * PlansGrid renders the standard 3-tier layout ($20 / $100 / $200-style)
 * straight from a Plan[]. Monochrome: the recommended tier is set apart by a
 * ring and lift, never a color. Current plan is a settled, non-interactive
 * state.
 */
import * as React from 'react'
import { Check } from 'lucide-react'

import { Badge } from '../../primitives/badge'
import { Button } from '../../primitives/button'
import { cn } from '../utils'
import { formatCurrency } from './format'
import type { Plan } from './types'

export interface PlanCardProps {
  plan: Plan
  /** Marks this as the org's active plan (CTA becomes a settled label). */
  current?: boolean
  onSelect?: (planId: string) => void
  className?: string
}

export const PlanCard = React.forwardRef<HTMLDivElement, PlanCardProps>(
  ({ plan, current = false, onSelect, className }, ref) => {
    const {
      id,
      name,
      priceMonthly,
      currency = 'USD',
      description,
      features,
      highlighted,
      ctaLabel,
    } = plan
    const price = formatCurrency(priceMonthly, currency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })

    return (
      <div
        ref={ref}
        data-highlighted={highlighted || undefined}
        data-current={current || undefined}
        className={cn(
          'group relative flex flex-col rounded-xl border bg-card p-5 text-card-foreground transition-all duration-200',
          'hover:-translate-y-0.5 hover:shadow-md',
          highlighted
            ? 'border-foreground/20 shadow-md ring-1 ring-foreground/15'
            : 'shadow-sm',
          current && 'ring-2 ring-foreground',
          className,
        )}
      >
        {highlighted && !current && (
          <Badge
            variant="secondary"
            className="absolute -top-2.5 right-4 uppercase tracking-wide"
          >
            Recommended
          </Badge>
        )}

        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold tracking-tight">{name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold tabular-nums tracking-tight">
              {price}
            </span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <ul className="mt-4 flex flex-1 flex-col gap-2.5">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check
                className="mt-0.5 size-4 shrink-0 text-foreground/70"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="mt-5 w-full"
          variant={current ? 'outline' : highlighted ? 'default' : 'secondary'}
          disabled={current}
          aria-current={current ? 'true' : undefined}
          onClick={() => onSelect?.(id)}
        >
          {current ? 'Current plan' : (ctaLabel ?? `Choose ${name}`)}
        </Button>
      </div>
    )
  },
)
PlanCard.displayName = 'PlanCard'

export interface PlansGridProps {
  plans: Plan[]
  /** Id of the active plan; that card renders in its current state. */
  currentPlanId?: string
  onSelect?: (planId: string) => void
  className?: string
}

export const PlansGrid = React.forwardRef<HTMLDivElement, PlansGridProps>(
  ({ plans, currentPlanId, onSelect, className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          current={plan.id === currentPlanId}
          onSelect={onSelect}
        />
      ))}
    </div>
  ),
)
PlansGrid.displayName = 'PlansGrid'
