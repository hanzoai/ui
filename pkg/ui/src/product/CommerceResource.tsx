'use client'

/**
 * CommerceResource — the ONE list surface every Commerce store page renders (Products,
 * Orders, Customers, Inventory, Promotions). It owns the fetch → honest loading / empty
 * / error lifecycle (identical to the Subscriptions/Functions modules) so each page is
 * just a title + a `load()` + its columns; there is one way to render a store list.
 *
 * `load` is held in a ref so a page can pass an inline `() => CommerceApi.products()`
 * without re-triggering the mount effect — the list fetches once and on explicit
 * Refresh. Every row is real (the caller's org-scoped `/v1` fetch); an empty store
 * shows the honest empty copy, never a placeholder row. Both the console's Store
 * category and the standalone Commerce admin render THIS.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, XStack } from '@hanzo/gui'
import { RefreshCw } from '@hanzogui/lucide-icons-2'

import { PageHeader } from './PageHeader'
import { DataTable, type Column } from './DataTable'
import { BackendStateCard, classifyBackend, type BackendState } from './BackendState'

/** A commerce list page — the rows on this page plus the total the backend reports. */
export type CommerceList<T> = { rows: T[]; count: number }

type Async<T> = { phase: 'loading' } | { phase: 'error'; error: BackendState } | { phase: 'ready'; data: T }

export function CommerceResource<T>({
  title,
  subtitle,
  load,
  columns,
  rowKey,
  empty,
  hint,
  actions,
}: {
  title: string
  subtitle: string
  /** Real per-org fetch (via the `/commerce` proxy). Identity may change per render. */
  load: () => Promise<CommerceList<T>>
  columns: Column<T>[]
  rowKey: (row: T) => string
  empty: string
  /** BackendStateCard hint — the real endpoint, e.g. `GET /v1/product`. */
  hint: string
  /** Optional extra header actions (given the reload fn), left of Refresh. */
  actions?: (reload: () => void) => ReactNode
}) {
  const [state, setState] = useState<Async<T[]>>({ phase: 'loading' })
  const loadRef = useRef(load)
  loadRef.current = load

  const reload = useCallback(() => {
    setState({ phase: 'loading' })
    loadRef
      .current()
      .then((r) => setState({ phase: 'ready', data: r.rows }))
      .catch((e) => setState({ phase: 'error', error: classifyBackend(e) }))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <XStack gap="$2">
            {actions?.(reload)}
            <Button size="$2" icon={<RefreshCw size={16} />} onPress={reload}>
              Refresh
            </Button>
          </XStack>
        }
      />

      {state.phase === 'error' ? (
        <BackendStateCard state={state.error} onRetry={reload} hint={hint} />
      ) : (
        <DataTable
          columns={columns}
          rows={state.phase === 'ready' ? state.data : []}
          loading={state.phase === 'loading'}
          rowKey={rowKey}
          empty={empty}
        />
      )}
    </>
  )
}
