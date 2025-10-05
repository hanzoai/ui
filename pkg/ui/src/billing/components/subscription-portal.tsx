'use client'

import type {
  Subscription,
  SubscriptionPlan,
  RetentionOffer,
  SubscriptionHistory,
} from '../types'

export interface SubscriptionPortalProps {
  subscription: Subscription
  availablePlans: SubscriptionPlan[]
  retentionOffers?: RetentionOffer[]
  subscriptionHistory?: SubscriptionHistory[]
  onUpgrade?: (planId: string) => Promise<void>
  onDowngrade?: (planId: string) => Promise<void>
  onCancel?: (reason: string, feedback?: string) => Promise<void>
  onAcceptOffer?: (offerId: string) => Promise<void>
  showHistory?: boolean
  defaultView?: 'overview' | 'plans' | 'history'
}

export function SubscriptionPortal(props: SubscriptionPortalProps) {
  const { subscription, availablePlans } = props

  return (
    <div className="space-y-6">
      <div className="text-2xl font-bold">Subscription Portal</div>
      <div className="text-muted-foreground">
        Current Plan: {availablePlans.find(p => p.id === subscription.planId)?.name}
      </div>
      <div className="text-sm">Status: {subscription.status}</div>
    </div>
  )
}
