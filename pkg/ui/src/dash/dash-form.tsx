'use client'

import * as React from 'react'
import { cn } from '../../utils'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type DashFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'select'
  | 'toggle'
  | 'textarea'
  | 'json'
  | 'relation'
  | 'file'

export interface DashFieldOption {
  label: string
  value: string
}

export interface DashFieldDef {
  /** Field key (maps to form value key) */
  name: string
  /** Display label */
  label: string
  /** Field type */
  type: DashFieldType
  /** Placeholder text */
  placeholder?: string
  /** Description shown below field */
  description?: string
  /** Whether the field is required */
  required?: boolean
  /** Select options (for type=select or type=relation) */
  options?: DashFieldOption[]
  /** Default value */
  defaultValue?: unknown
  /** Disabled */
  disabled?: boolean
  /** File accept pattern (for type=file) */
  accept?: string
  /** Number of textarea rows */
  rows?: number
  /** Zod-style validation function. Return error string or null. */
  validate?: (value: unknown) => string | null
}

export interface DashFormProps {
  /** Form title */
  title?: string
  /** Field definitions */
  fields: DashFieldDef[]
  /** Initial values */
  values?: Record<string, unknown>
  /** Called on submit with validated values */
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  /** Called on cancel */
  onCancel?: () => void
  /** Submit button label */
  submitLabel?: string
  /** Cancel button label */
  cancelLabel?: string
  /** Loading state */
  loading?: boolean
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function DashForm({
  title,
  fields,
  values: initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  className,
}: DashFormProps) {
  const [values, setValues] = React.useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {}
    for (const f of fields) {
      init[f.name] = initialValues?.[f.name] ?? f.defaultValue ?? (f.type === 'toggle' ? false : '')
    }
    return init
  })

  const [errors, setErrors] = React.useState<Record<string, string>>({})

  function setValue(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate
    const errs: Record<string, string> = {}
    for (const f of fields) {
      const v = values[f.name]
      if (f.required && (v === '' || v === null || v === undefined)) {
        errs[f.name] = `${f.label} is required`
      }
      if (f.validate) {
        const err = f.validate(v)
        if (err) errs[f.name] = err
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    await onSubmit(values)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-[var(--dash-radius-lg)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6',
        className,
      )}
    >
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-[var(--dash-text)]">{title}</h3>
      )}

      <div className="space-y-4">
        {fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(v) => setValue(field.name, v)}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'rounded-[var(--dash-radius)] px-4 py-2 text-sm font-medium transition-colors',
            'bg-[var(--dash-primary)] text-[var(--dash-primary-text)]',
            'hover:bg-[var(--dash-primary-hover)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={cn(
              'rounded-[var(--dash-radius)] px-4 py-2 text-sm font-medium transition-colors',
              'border border-[var(--dash-border)] text-[var(--dash-text-muted)]',
              'hover:bg-[var(--dash-surface-hover)] hover:text-[var(--dash-text)]',
            )}
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  FieldRenderer (internal)                                          */
/* ------------------------------------------------------------------ */

const inputBase = cn(
  'w-full rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2 text-sm text-[var(--dash-text)]',
  'placeholder:text-[var(--dash-text-dim)]',
  'focus:border-[var(--dash-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-primary)]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors',
)

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: DashFieldDef
  value: unknown
  error?: string
  onChange: (value: unknown) => void
}) {
  const id = `dash-field-${field.name}`

  const labelEl = (
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-[var(--dash-text)]">
      {field.label}
      {field.required && <span className="ml-0.5 text-[var(--dash-error)]">*</span>}
    </label>
  )

  const descEl = field.description ? (
    <p className="mt-1 text-xs text-[var(--dash-text-dim)]">{field.description}</p>
  ) : null

  const errEl = error ? (
    <p className="mt-1 text-xs text-[var(--dash-error)]">{error}</p>
  ) : null

  switch (field.type) {
    case 'text':
    case 'email':
    case 'password':
    case 'number':
      return (
        <div>
          {labelEl}
          <input
            id={id}
            type={field.type}
            value={String(value ?? '')}
            placeholder={field.placeholder}
            disabled={field.disabled}
            onChange={(e) =>
              onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)
            }
            className={cn(inputBase, error && 'border-[var(--dash-error)]')}
          />
          {descEl}
          {errEl}
        </div>
      )

    case 'textarea':
      return (
        <div>
          {labelEl}
          <textarea
            id={id}
            value={String(value ?? '')}
            placeholder={field.placeholder}
            disabled={field.disabled}
            rows={field.rows ?? 3}
            onChange={(e) => onChange(e.target.value)}
            className={cn(inputBase, 'resize-y', error && 'border-[var(--dash-error)]')}
          />
          {descEl}
          {errEl}
        </div>
      )

    case 'select':
    case 'relation':
      return (
        <div>
          {labelEl}
          <select
            id={id}
            value={String(value ?? '')}
            disabled={field.disabled}
            onChange={(e) => onChange(e.target.value)}
            className={cn(inputBase, error && 'border-[var(--dash-error)]')}
          >
            <option value="">{field.placeholder ?? 'Select...'}</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {descEl}
          {errEl}
        </div>
      )

    case 'toggle':
      return (
        <div className="flex items-center gap-3">
          <button
            id={id}
            type="button"
            role="switch"
            aria-checked={Boolean(value)}
            disabled={field.disabled}
            onClick={() => onChange(!value)}
            className={cn(
              'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-[var(--dash-primary)] focus:ring-offset-2 focus:ring-offset-[var(--dash-surface)]',
              value ? 'bg-[var(--dash-primary)]' : 'bg-[var(--dash-border)]',
              field.disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                value ? 'translate-x-4' : 'translate-x-0.5',
                'mt-0.5',
              )}
            />
          </button>
          <label htmlFor={id} className="text-sm text-[var(--dash-text)]">
            {field.label}
          </label>
          {descEl}
          {errEl}
        </div>
      )

    case 'json':
      return (
        <div>
          {labelEl}
          <textarea
            id={id}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            placeholder={field.placeholder ?? '{}'}
            disabled={field.disabled}
            rows={field.rows ?? 6}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value))
              } catch {
                onChange(e.target.value)
              }
            }}
            className={cn(inputBase, 'font-mono text-xs resize-y', error && 'border-[var(--dash-error)]')}
          />
          {descEl}
          {errEl}
        </div>
      )

    case 'file':
      return (
        <div>
          {labelEl}
          <input
            id={id}
            type="file"
            accept={field.accept}
            disabled={field.disabled}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onChange(file)
            }}
            className={cn(
              'w-full text-sm text-[var(--dash-text-muted)]',
              'file:mr-3 file:rounded-[var(--dash-radius-sm)] file:border-0 file:bg-[var(--dash-primary)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--dash-primary-text)]',
              'file:cursor-pointer hover:file:bg-[var(--dash-primary-hover)]',
            )}
          />
          {descEl}
          {errEl}
        </div>
      )

    default:
      return null
  }
}
