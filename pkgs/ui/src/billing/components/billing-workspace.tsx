'use client'

import * as React from 'react'

import { InvoiceManager } from './invoice-manager'
import { PaymentMethodManager } from './payment-manager'
import { SubscriptionPortal } from './subscription-portal'
import { BusinessProfilePanel } from './business-profile-panel'
import { TaxCompliancePanel } from './tax-compliance-panel'
import type {
  BillingMetric,
  BusinessProfile,
  ComplianceItem,
  Invoice,
  PaymentMethod,
  Subscription,
  SubscriptionHistory,
  SubscriptionPlan,
  TaxSettings,
  RetentionOffer,
} from '../types'

type WorkspaceTab =
  | 'overview'
  | 'payment'
  | 'invoices'
  | 'business'
  | 'compliance'

export interface BillingWorkspaceProps {
  subscription: Subscription
  plans: SubscriptionPlan[]
  usageMetrics?: BillingMetric[]
  retentionOffers?: RetentionOffer[]
  subscriptionHistory?: SubscriptionHistory[]
  paymentMethods?: PaymentMethod[]
  invoices?: Invoice[]
  businessProfile: BusinessProfile
  taxSettings: TaxSettings
  complianceItems: ComplianceItem[]
  defaultTab?: WorkspaceTab

  onUpgrade?: (planId: string) => Promise<void>
  onDowngrade?: (planId: string) => Promise<void>
  onCancel?: (reason: string, feedback?: string) => Promise<void>
  onAcceptOffer?: (offerId: string) => Promise<void>

  onAddPaymentMethod?: (method: PaymentMethod) => Promise<void>
  onRemovePaymentMethod?: (id: string) => Promise<void>
  onSetDefaultPaymentMethod?: (id: string) => Promise<void>

  onDownloadInvoice?: (invoice: Invoice) => Promise<void>
  onSaveBusinessProfile?: (profile: BusinessProfile) => Promise<void>
  onToggleAutomaticTax?: (enabled: boolean) => Promise<void>
}

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'payment', label: 'Payment methods' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'business', label: 'Business info' },
  { id: 'compliance', label: 'Tax & compliance' },
]

export function BillingWorkspace(props: BillingWorkspaceProps) {
  const {
    subscription,
    plans,
    usageMetrics,
    retentionOffers,
    subscriptionHistory,
    paymentMethods,
    invoices,
    businessProfile,
    taxSettings,
    complianceItems,
    defaultTab = 'overview',

    onUpgrade,
    onDowngrade,
    onCancel,
    onAcceptOffer,

    onAddPaymentMethod,
    onRemovePaymentMethod,
    onSetDefaultPaymentMethod,

    onDownloadInvoice,
    onSaveBusinessProfile,
    onToggleAutomaticTax,
  } = props

  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>(defaultTab)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
        <div className="border-b border-zinc-200 px-4 py-4">
          <h2 className="text-2xl font-semibold text-zinc-900">Billing workspace</h2>
          <p className="text-sm text-zinc-500">
            Run subscription, invoicing, payment, business profile, and compliance operations from one surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 p-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <SubscriptionPortal
          subscription={subscription}
          availablePlans={plans}
          usageMetrics={usageMetrics}
          retentionOffers={retentionOffers}
          subscriptionHistory={subscriptionHistory}
          onUpgrade={onUpgrade}
          onDowngrade={onDowngrade}
          onCancel={onCancel}
          onAcceptOffer={onAcceptOffer}
        />
      ) : null}

      {activeTab === 'payment' ? (
        <PaymentMethodManager
          paymentMethods={paymentMethods}
          onAdd={onAddPaymentMethod}
          onRemove={onRemovePaymentMethod}
          onSetDefault={onSetDefaultPaymentMethod}
        />
      ) : null}

      {activeTab === 'invoices' ? (
        <InvoiceManager invoices={invoices} onDownload={onDownloadInvoice} />
      ) : null}

      {activeTab === 'business' ? (
        <BusinessProfilePanel profile={businessProfile} onSave={onSaveBusinessProfile} />
      ) : null}

      {activeTab === 'compliance' ? (
        <TaxCompliancePanel
          taxSettings={taxSettings}
          complianceItems={complianceItems}
          onToggleAutomaticTax={onToggleAutomaticTax}
        />
      ) : null}
    </div>
  )
}
