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
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  required: {
    label: 'Required',
    className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  },
  review: {
    label: 'Review',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-zinc-100 text-zinc-700 ring-zinc-600/20',
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
        <div className="xl:col-span-2 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-4">
            <h3 className="text-lg font-semibold text-zinc-900">Tax settings</h3>
            <p className="text-sm text-zinc-500">Manage registrations, nexus, and tax collection behavior</p>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">Automatic tax</p>
                <p className="text-xs text-zinc-500">Calculate and collect tax where required</p>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  automaticTax ? 'bg-zinc-900' : 'bg-zinc-300'
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
              <p className="mb-2 text-sm font-medium text-zinc-900">Registrations</p>
              <div className="space-y-2">
                {taxSettings.registrations.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500">
                    No tax registrations configured.
                  </p>
                ) : (
                  taxSettings.registrations.map((registration) => (
                    <div key={registration.id} className="rounded-lg border border-zinc-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-900">{registration.region}</p>
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-700">
                          {registration.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {registration.type.toUpperCase()} · {registration.registrationId}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-4">
            <h3 className="text-lg font-semibold text-zinc-900">Compliance checklist</h3>
            <p className="text-sm text-zinc-500">Track KYC/KYB, tax filings, and policy requirements</p>
          </div>

          <div className="divide-y divide-zinc-200">
            {complianceItems.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">No compliance tasks yet.</div>
            ) : (
              complianceItems.map((item) => (
                <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Category: {item.category.toUpperCase()}
                      {item.owner ? ` · Owner: ${item.owner}` : ''}
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
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
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
