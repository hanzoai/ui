'use client'

import * as React from 'react'
import { cn } from '../../utils'
import { DashDataTable, type DashColumn, type DashDataTableProps } from './dash-data-table'
import { DashForm, type DashFieldDef } from './dash-form'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface DashCrudProps<T> {
  /** Resource name (e.g. "User", "API Key") used in UI labels */
  resourceName: string
  /** Plural resource name (defaults to resourceName + "s") */
  resourceNamePlural?: string
  /** Column definitions for the list table */
  columns: DashColumn<T>[]
  /** Row data */
  data: T[]
  /** Unique key extractor per row */
  rowKey: (row: T) => string
  /** Field definitions for create/edit form */
  fields: DashFieldDef[]
  /** Convert a row to form values for editing */
  rowToValues?: (row: T) => Record<string, unknown>
  /** Called when creating a new record */
  onCreate?: (values: Record<string, unknown>) => Promise<void>
  /** Called when updating an existing record */
  onUpdate?: (key: string, values: Record<string, unknown>) => Promise<void>
  /** Called when deleting a record */
  onDelete?: (key: string) => Promise<void>
  /** Whether create is available */
  canCreate?: boolean
  /** Whether edit is available */
  canEdit?: boolean
  /** Whether delete is available */
  canDelete?: boolean
  /** Pass-through DataTable props */
  tableProps?: Partial<DashDataTableProps<T>>
  /** Loading state */
  loading?: boolean
  className?: string
}

type View = 'list' | 'create' | 'edit'

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function DashCrud<T>({
  resourceName,
  resourceNamePlural,
  columns,
  data,
  rowKey,
  fields,
  rowToValues,
  onCreate,
  onUpdate,
  onDelete,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  tableProps,
  loading = false,
  className,
}: DashCrudProps<T>) {
  const plural = resourceNamePlural ?? `${resourceName}s`
  const [view, setView] = React.useState<View>('list')
  const [editingKey, setEditingKey] = React.useState<string | null>(null)
  const [editValues, setEditValues] = React.useState<Record<string, unknown>>({})
  const [deleteKey, setDeleteKey] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  /* ------ edit ------ */
  function handleEdit(row: T) {
    const key = rowKey(row)
    setEditingKey(key)
    setEditValues(rowToValues ? rowToValues(row) : (row as Record<string, unknown>))
    setView('edit')
  }

  /* ------ delete confirm ------ */
  function handleDeleteConfirm(row: T) {
    setDeleteKey(rowKey(row))
  }

  async function confirmDelete() {
    if (!deleteKey || !onDelete) return
    setSubmitting(true)
    try {
      await onDelete(deleteKey)
    } finally {
      setSubmitting(false)
      setDeleteKey(null)
    }
  }

  /* ------ actions column ------ */
  function actionsRenderer(row: T) {
    return (
      <div className="flex items-center justify-end gap-1">
        {canEdit && onUpdate && (
          <button
            type="button"
            onClick={() => handleEdit(row)}
            className="rounded-[var(--dash-radius-sm)] px-2 py-1 text-xs text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface-hover)] hover:text-[var(--dash-text)] transition-colors"
          >
            Edit
          </button>
        )}
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => handleDeleteConfirm(row)}
            className="rounded-[var(--dash-radius-sm)] px-2 py-1 text-xs text-[var(--dash-error)] hover:bg-[var(--dash-error-dim)] transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    )
  }

  /* ------ list view ------ */
  if (view === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--dash-text)]">{plural}</h2>
          {canCreate && onCreate && (
            <button
              type="button"
              onClick={() => {
                setEditingKey(null)
                setEditValues({})
                setView('create')
              }}
              className={cn(
                'rounded-[var(--dash-radius)] px-3 py-1.5 text-sm font-medium transition-colors',
                'bg-[var(--dash-primary)] text-[var(--dash-primary-text)]',
                'hover:bg-[var(--dash-primary-hover)]',
              )}
            >
              Create {resourceName}
            </button>
          )}
        </div>

        <DashDataTable
          columns={columns}
          data={data}
          rowKey={rowKey}
          actions={(canEdit || canDelete) ? actionsRenderer : undefined}
          loading={loading}
          searchable
          emptyMessage={`No ${plural.toLowerCase()} found`}
          {...tableProps}
        />

        {/* Delete confirmation dialog */}
        {deleteKey !== null && (
          <DeleteDialog
            resourceName={resourceName}
            loading={submitting}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteKey(null)}
          />
        )}
      </div>
    )
  }

  /* ------ create / edit view ------ */
  return (
    <div className={cn('space-y-4', className)}>
      <button
        type="button"
        onClick={() => setView('list')}
        className="inline-flex items-center gap-1 text-sm text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to {plural}
      </button>

      <DashForm
        title={view === 'create' ? `Create ${resourceName}` : `Edit ${resourceName}`}
        fields={fields}
        values={view === 'edit' ? editValues : undefined}
        loading={submitting}
        submitLabel={view === 'create' ? 'Create' : 'Save changes'}
        onCancel={() => setView('list')}
        onSubmit={async (vals) => {
          setSubmitting(true)
          try {
            if (view === 'create' && onCreate) {
              await onCreate(vals)
            } else if (view === 'edit' && editingKey && onUpdate) {
              await onUpdate(editingKey, vals)
            }
            setView('list')
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  DeleteDialog (internal)                                           */
/* ------------------------------------------------------------------ */

function DeleteDialog({
  resourceName,
  loading,
  onConfirm,
  onCancel,
}: {
  resourceName: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-[var(--dash-radius-lg)] border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-[var(--dash-text)]">Delete {resourceName}?</h3>
        <p className="mt-2 text-sm text-[var(--dash-text-muted)]">
          This action cannot be undone. The {resourceName.toLowerCase()} will be permanently removed.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
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
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'rounded-[var(--dash-radius)] px-4 py-2 text-sm font-medium transition-colors',
              'bg-[var(--dash-error)] text-white',
              'hover:bg-red-600',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
