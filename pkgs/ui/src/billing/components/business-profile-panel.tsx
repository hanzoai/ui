'use client'

import * as React from 'react'

import type { BusinessProfile } from '../types'

export interface BusinessProfilePanelProps {
  profile: BusinessProfile
  onSave?: (profile: BusinessProfile) => Promise<void>
}

const INPUT_CLASS = 'w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text outline-none transition focus:border-brand'

export function BusinessProfilePanel(props: BusinessProfilePanelProps) {
  const { profile, onSave } = props
  const [draft, setDraft] = React.useState<BusinessProfile>(profile)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setDraft(profile)
  }, [profile])

  const hasFinanceAndLegal = (draft.contacts || []).some((contact) =>
    contact.role === 'finance' || contact.role === 'legal',
  )

  const handleSave = React.useCallback(async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(draft)
    } finally {
      setSaving(false)
    }
  }, [draft, onSave])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-lg font-semibold text-text">Business profile</h3>
          <p className="text-sm text-text-muted">
            Keep your legal and support details accurate for invoices, tax, and compliance workflows.
          </p>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-secondary">Legal name</span>
            <input
              value={draft.legalName}
              onChange={(e) => setDraft((prev) => ({ ...prev, legalName: e.target.value }))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-secondary">Display name</span>
            <input
              value={draft.displayName}
              onChange={(e) => setDraft((prev) => ({ ...prev, displayName: e.target.value }))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-secondary">Website</span>
            <input
              value={draft.website || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, website: e.target.value }))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-secondary">Support email</span>
            <input
              value={draft.supportEmail || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, supportEmail: e.target.value }))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-secondary">Statement descriptor</span>
            <input
              value={draft.statementDescriptor || ''}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, statementDescriptor: e.target.value }))
              }
              className={INPUT_CLASS}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-secondary">Tax ID</span>
            <input
              value={draft.taxId || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, taxId: e.target.value }))}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <div className="border-t border-border bg-bg-elevated p-4">
          <p className="mb-2 text-sm font-medium text-text-secondary">Registered address</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={draft.registeredAddress.line1}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  registeredAddress: { ...prev.registeredAddress, line1: e.target.value },
                }))
              }
              placeholder="Line 1"
              className={`${INPUT_CLASS} text-sm`}
            />
            <input
              value={draft.registeredAddress.line2 || ''}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  registeredAddress: { ...prev.registeredAddress, line2: e.target.value },
                }))
              }
              placeholder="Line 2"
              className={`${INPUT_CLASS} text-sm`}
            />
            <input
              value={draft.registeredAddress.city}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  registeredAddress: { ...prev.registeredAddress, city: e.target.value },
                }))
              }
              placeholder="City"
              className={`${INPUT_CLASS} text-sm`}
            />
            <input
              value={draft.registeredAddress.state || ''}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  registeredAddress: { ...prev.registeredAddress, state: e.target.value },
                }))
              }
              placeholder="State/Province"
              className={`${INPUT_CLASS} text-sm`}
            />
            <input
              value={draft.registeredAddress.zip}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  registeredAddress: { ...prev.registeredAddress, zip: e.target.value },
                }))
              }
              placeholder="Postal code"
              className={`${INPUT_CLASS} text-sm`}
            />
            <input
              value={draft.registeredAddress.country}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  registeredAddress: { ...prev.registeredAddress, country: e.target.value },
                }))
              }
              placeholder="Country"
              className={`${INPUT_CLASS} text-sm`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <p className="text-xs text-text-muted">
            {hasFinanceAndLegal
              ? 'Finance and legal contacts are configured.'
              : 'Tip: add at least one finance or legal contact for smooth audits.'}
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={!onSave || saving}
            className="rounded-lg bg-text px-3 py-2 text-sm font-medium text-bg transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving\u2026' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
