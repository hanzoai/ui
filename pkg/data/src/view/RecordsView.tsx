'use client'

// RecordsView — the one shell that makes any Base collection an Airtable/Twenty-
// class surface: a toolbar (view switch, search, filter, sort, group) over a
// DataTable OR a BoardView, driven by a single ViewConfig applied through the pure
// view/logic. Presentational + data-injected: the host supplies raw records and
// the persistence callbacks (open / create / inline-edit / move); RecordsView owns
// only the view state (or reflects a controlled one) and re-applies it. Optional
// saved views let a host persist named configurations. CRM, CMS, commerce — every
// business app is a curated set of these views over the same components.
import { useMemo, useState, type ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Plus, X } from '@hanzogui/lucide-icons-2'
import type { FieldDefinition, SelectOption } from '../field/types'
import { DataTable } from '../table/DataTable'
import { BoardView } from '../board/BoardView'
import { defaultGroupField, movePatch } from '../board/logic'
import { tokens } from '../theme'
import type { ViewConfig, ViewKind } from './types'
import { applyView, emptyView, setSorts } from './logic'
import { RecordsToolbar } from './Toolbar'

type Record_ = Record<string, unknown>

/** Optional saved-view persistence (the host owns the store). */
export interface SavedViews {
  views: ViewConfig[]
  activeId?: string
  onSelect: (id: string) => void
  onSave: (view: ViewConfig) => void
  onDelete?: (id: string) => void
}

export interface RecordsViewProps {
  fields: FieldDefinition[]
  /** Raw records; RecordsView applies search + filter + sort from the view. */
  records: Record_[]
  loading?: boolean
  empty?: ReactNode

  // view state — controlled (view + onViewChange) or internal (defaultKind)
  view?: ViewConfig
  onViewChange?: (v: ViewConfig) => void
  defaultKind?: ViewKind

  // saved views (optional)
  savedViews?: SavedViews

  // header + actions
  title?: ReactNode
  onOpen?: (record: Record_) => void
  onCreate?: () => void
  createLabel?: string
  /** Persist an inline cell/field edit (table + board). */
  onEditCommit?: (record: Record_, field: FieldDefinition, value: unknown) => void | Promise<void>
  /** Persist a board card move; defaults to onEditCommit over the group field. */
  onRecordChange?: (record: Record_, patch: Record<string, unknown>) => void | Promise<void>
  fieldOptions?: (field: FieldDefinition) => SelectOption[] | undefined

  selectable?: boolean
  editable?: boolean
  bulkActions?: (ids: string[]) => ReactNode
  /** Toolbar extra (e.g. Refresh). */
  toolbarExtra?: ReactNode
  boardDisabled?: boolean
  titleField?: string
  /** Fields shown on board cards (defaults to all but the group field). */
  cardFields?: FieldDefinition[]
}

export function RecordsView(props: RecordsViewProps) {
  const {
    fields, records, loading, empty,
    view: controlledView, onViewChange, defaultKind = 'table',
    savedViews, title, onOpen, onCreate, createLabel,
    onEditCommit, onRecordChange, fieldOptions,
    selectable = true, editable = true, bulkActions, toolbarExtra, boardDisabled, titleField, cardFields,
  } = props

  const [internalView, setInternalView] = useState<ViewConfig>(() => {
    const v = emptyView(defaultKind)
    return defaultKind === 'board' ? { ...v, groupField: defaultGroupField(fields) } : v
  })
  const view = controlledView ?? internalView
  const setView = (v: ViewConfig) => {
    // Entering board without a group field → pick a sensible default.
    const next = v.kind === 'board' && !v.groupField ? { ...v, groupField: defaultGroupField(fields) } : v
    onViewChange ? onViewChange(next) : setInternalView(next)
  }

  const visible = useMemo(() => applyView(records, view, fields), [records, view, fields])

  const boardChange = onRecordChange
    ?? (onEditCommit
      ? (record: Record_, patch: Record<string, unknown>) => {
          const [name] = Object.keys(patch)
          const f = fields.find((ff) => ff.name === name)
          if (f) return onEditCommit(record, f, patch[name])
        }
      : undefined)

  return (
    <YStack gap={12}>
      {title ? (typeof title === 'string' ? <Text fontSize={20} fontWeight="800" style={{ color: tokens.text }}>{title}</Text> : title) : null}

      {savedViews ? <SavedViewsBar saved={savedViews} current={view} onLoad={setView} /> : null}

      <RecordsToolbar
        fields={fields}
        view={view}
        onView={setView}
        onCreate={onCreate}
        createLabel={createLabel}
        fieldOptions={fieldOptions}
        extra={toolbarExtra}
        boardDisabled={boardDisabled}
      />

      {view.kind === 'board' ? (
        <BoardView
          fields={fields}
          records={visible}
          groupField={view.groupField ?? defaultGroupField(fields) ?? ''}
          titleField={titleField}
          cardFields={cardFields}
          onOpen={onOpen}
          onRecordChange={boardChange}
          onCreate={onCreate ? () => onCreate() : undefined}
        />
      ) : (
        <DataTable
          fields={fields}
          records={visible}
          loading={loading}
          empty={empty}
          sorts={view.sorts}
          onSortChange={(sorts) => setView(setSorts(view, sorts))}
          onOpen={onOpen}
          selectable={selectable}
          bulkActions={bulkActions}
          editable={editable}
          onEditCommit={onEditCommit}
          fieldOptions={fieldOptions}
          hiddenFields={view.hiddenFields}
          columnOrder={view.columnOrder}
          onColumnOrderChange={(columnOrder) => setView({ ...view, columnOrder })}
          pageSize={view.pageSize ?? 25}
        />
      )}
    </YStack>
  )
}

function SavedViewsBar({ saved, current, onLoad }: { saved: SavedViews; current: ViewConfig; onLoad: (v: ViewConfig) => void }) {
  return (
    <XStack items="center" gap={4} style={{ flexWrap: 'wrap' }}>
      {saved.views.map((v) => {
        const active = v.id === (saved.activeId ?? current.id)
        return (
          <XStack
            key={v.id}
            items="center"
            gap={6}
            px={10}
            py={6}
            rounded={8}
            cursor="pointer"
            onPress={() => { saved.onSelect(v.id); onLoad(v) }}
            style={{ backgroundColor: active ? tokens.hover : 'transparent', borderBottomWidth: 2, borderBottomColor: active ? tokens.accent : 'transparent' }}
            hoverStyle={active ? undefined : { bg: tokens.surfaceRaised }}
          >
            <Text fontSize={13} fontWeight={active ? '700' : '500'} style={{ color: active ? tokens.text : tokens.textMuted }}>{v.name}</Text>
            {saved.onDelete && saved.views.length > 1 ? (
              <YStack cursor="pointer" onPress={() => saved.onDelete?.(v.id)}><X size={12} color={tokens.textFaint} /></YStack>
            ) : null}
          </XStack>
        )
      })}
      <XStack
        items="center"
        gap={4}
        px={10}
        py={6}
        rounded={8}
        cursor="pointer"
        hoverStyle={{ bg: tokens.surfaceRaised }}
        onPress={() => saved.onSave({ ...current, id: `view-${Date.now()}`, name: `View ${saved.views.length + 1}` })}
      >
        <Plus size={13} color={tokens.textFaint} />
        <Text fontSize={13} style={{ color: tokens.textFaint }}>New view</Text>
      </XStack>
    </XStack>
  )
}
