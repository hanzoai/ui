'use client'

import * as React from 'react'

import type { ComplianceItem, TaxSettings } from '../types'

export interface TaxCompliancePanelProps {
  taxSettings: TaxSettings
  complianceItems: ComplianceItem[]
  onToggleAutomaticTax?: (enabled: boolean) => Promise<void>
}

const complianceTone: Record<
  ComplianceItem['status'],
  { label: string; className: string }
> = {
  complete: {
    label: 'Complete',
    className: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
  },
  required: {
    label: 'Required',
    className: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
  },
  review: {
    label: 'Review',
    className: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-text-dim/10 text-text-muted ring-text-dim/20',
  },
}

export function TaxCompliancePanel(props: TaxCompliancePanelProps) {
  const { taxSettings, complianceItems, onToggleAutomaticTax } = props

  const [automaticTax, setAutomaticTax] = React.useState(
    taxSettings.automaticCollection,
  )
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setAutomaticTax(taxSettings.automaticCollection)
  }, [taxSettings.automaticCollection])

  const handleToggle = React.useCallback(async () => {
    const next = !automaticTax
    setAutomaticTax(next)
    setSaving(true)
    try {
      await onToggleAutomaticTax?.(next)
    } finally {
      setSaving(false)
    }
  }, [automaticTax, onToggleAutomaticTax])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-2 overflow-hidden rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border p-4">
            <h3 className="text-lg font-semibold text-text">Tax settings</h3>
            <p className="text-sm text-text-muted">Manage registrations, nexus, and tax collection behavior</p>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-text">Automatic tax</p>
                <p className="text-xs text-text-muted">Calculate and collect tax where required</p>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  automaticTax ? 'bg-brand' : 'bg-border-strong'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    automaticTax ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-text">Registrations</p>
              <div className="space-y-2">
                {taxSettings.registrations.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-3 text-sm text-text-muted">
                    No tax registrations configured.
                  </p>
                ) : (
                  taxSettings.registrations.map((registration) => (
                    <div key={registration.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-text">{registration.region}</p>
                        <span className="rounded-full bg-bg-elevated px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                          {registration.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        {registration.type.toUpperCase()} {'\u00b7'} {registration.registrationId}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 overflow-hidden rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border p-4">
            <h3 className="text-lg font-semibold text-text">Compliance checklist</h3>
            <p className="text-sm text-text-muted">Track KYC/KYB, tax filings, and policy requirements</p>
          </div>

          <div className="divide-y divide-border">
            {complianceItems.length === 0 ? (
              <div className="p-6 text-sm text-text-muted">No compliance tasks yet.</div>
            ) : (
              complianceItems.map((item) => (
                <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium text-text">{item.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      Category: {item.category.toUpperCase()}
                      {item.owner ? ` \u00b7 Owner: ${item.owner}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${complianceTone[item.status].className}`}
                    >
                      {complianceTone[item.status].label}
                    </span>
                    {item.actionLabel ? (
                      <button
                        type="button"
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-elevated"
                      >
                        {item.actionLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
