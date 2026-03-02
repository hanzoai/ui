'use client'

import { useState } from 'react'
import { SpendAlertsPanel } from './spend-alerts'
import { AccountMembers } from './account-members'
import { BusinessProfilePanel } from './business-profile-panel'
import { TaxCompliancePanel } from './tax-compliance-panel'
import { SupportTiersPanel } from './support-tiers-panel'
import { PromotionsPanel } from './promotions-panel'
import type {
  SpendAlert,
  BillingAccountMember,
  BillingRole,
  BusinessProfile,
  TaxSettings,
  ComplianceItem,
  SubscriptionDiscount,
  DiscountCode,
} from '../types'

type SubTab = 'alerts' | 'team' | 'business' | 'tax' | 'support' | 'promotions'

export interface BillingSettingsProps {
  spendAlerts: SpendAlert[]
  onCreateSpendAlert?: (title: string, threshold: number) => Promise<void>
  onUpdateSpendAlert?: (id: string, title: string, threshold: number) => Promise<void>
  onDeleteSpendAlert?: (id: string) => Promise<void>
  accountMembers: BillingAccountMember[]
  userRole: BillingRole
  onInviteMember?: (email: string, role: BillingRole) => Promise<void>
  onChangeMemberRole?: (memberId: string, role: BillingRole) => Promise<void>
  onRemoveMember?: (memberId: string) => Promise<void>
  businessProfile: BusinessProfile
  onSaveBusinessProfile?: (profile: BusinessProfile) => Promise<void>
  taxSettings: TaxSettings
  complianceItems: ComplianceItem[]
  onToggleAutomaticTax?: (enabled: boolean) => Promise<void>
  currentSupportTier?: string
  onSubscribeSupport?: (tierId: string) => Promise<void>
  discount?: SubscriptionDiscount | null
  onApplyDiscount?: (code: string) => Promise<DiscountCode | null>
  defaultSubTab?: SubTab
}

const subTabs: Array<{ id: SubTab; label: string }> = [
  { id: 'alerts', label: 'Spend Alerts' },
  { id: 'team', label: 'Team' },
  { id: 'business', label: 'Business Info' },
  { id: 'tax', label: 'Tax & Compliance' },
  { id: 'support', label: 'Support' },
  { id: 'promotions', label: 'Promotions' },
]

export function BillingSettings(props: BillingSettingsProps) {
  const [active, setActive] = useState<SubTab>(props.defaultSubTab ?? 'alerts')

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-bg-card p-1 border border-border">
        {subTabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active === t.id
                ? 'bg-bg-elevated text-text'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'alerts' && (
        <SpendAlertsPanel
          alerts={props.spendAlerts}
          onCreateAlert={props.onCreateSpendAlert}
          onUpdateAlert={props.onUpdateSpendAlert}
          onDeleteAlert={props.onDeleteSpendAlert}
        />
      )}
      {active === 'team' && (
        <AccountMembers
          members={props.accountMembers}
          userRole={props.userRole}
          onInvite={props.onInviteMember}
          onChangeRole={props.onChangeMemberRole}
          onRemove={props.onRemoveMember}
        />
      )}
      {active === 'business' && (
        <BusinessProfilePanel profile={props.businessProfile} onSave={props.onSaveBusinessProfile} />
      )}
      {active === 'tax' && (
        <TaxCompliancePanel
          taxSettings={props.taxSettings}
          complianceItems={props.complianceItems}
          onToggleAutomaticTax={props.onToggleAutomaticTax}
        />
      )}
      {active === 'support' && (
        <SupportTiersPanel currentTier={props.currentSupportTier} onSubscribe={props.onSubscribeSupport} />
      )}
      {active === 'promotions' && (
        <PromotionsPanel discount={props.discount ?? null} onApplyDiscount={props.onApplyDiscount} />
      )}
    </div>
  )
}
