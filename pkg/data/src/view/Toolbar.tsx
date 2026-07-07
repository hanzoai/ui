'use client'

// RecordsToolbar — the view control surface: switch table ⇆ board, quick search,
// a filter builder, a sort builder, a board group-by picker, and a New action.
// Every control edits the one ViewConfig through the pure view/logic helpers and
// emits it via onView; the shell re-applies the view. Filter VALUES are entered
// with the field's OWN editor (FieldInput) — one editor vocabulary everywhere.
import { Fragment, useState, type ReactNode } from 'react'
import { Button, Input, Text, XStack, YStack } from '@hanzo/gui'
import { ArrowDownUp, ArrowDown, ArrowUp, Columns3, LayoutGrid, ListFilter, Plus, Search, Table2, X } from '@hanzogui/lucide-icons-2'
import type { FieldDefinition, SelectOption } from '../field/types'
import { FieldInput } from '../field/FieldInput'
import { Menu, MenuItem } from '../primitives'
import { tokens } from '../theme'
import { OP_LABELS, operatorsForType, type FilterOp, type SortRule } from '../table/logic'
import { groupFieldCandidates } from '../board/logic'
import type { ViewConfig } from './types'
import { addFilter, defaultRuleFor, removeFilter, setGroupField, setKind, setSearch, setSorts, updateFilter } from './logic'

const byName = (fields: FieldDefinition[], name: string) => fields.find((f) => f.name === name)

export interface RecordsToolbarProps {
  fields: FieldDefinition[]
  view: ViewConfig
  onView: (v: ViewConfig) => void
  onCreate?: () => void
  createLabel?: string
  fieldOptions?: (f: FieldDefinition) => SelectOption[] | undefined
  /** Extra controls (e.g. Refresh), shown at the right. */
  extra?: ReactNode
  /** Hide the board view option (table-only surfaces). */
  boardDisabled?: boolean
}

/** A compact bordered control used as a Menu trigger. */
function Control({ icon, label, count, active }: { icon: ReactNode; label: string; count?: number; active?: boolean }) {
  return (
    <XStack
      items="center"
      gap={6}
      px={10}
      py={7}
      rounded={8}
      borderWidth={1}
      cursor="pointer"
      hoverStyle={{ borderColor: tokens.textMuted }}
      style={{ borderColor: active ? tokens.accent : tokens.border, backgroundColor: active ? tokens.hover : 'transparent' }}
    >
      {icon}
      <Text fontSize={13} fontWeight="600" style={{ color: active ? tokens.text : tokens.textMuted }}>{label}</Text>
      {count ? (
        <XStack items="center" justify="center" width={18} height={18} rounded={9} style={{ backgroundColor: tokens.accent }}>
          <Text fontSize={11} fontWeight="700" style={{ color: '#0b1220' }}>{count}</Text>
        </XStack>
      ) : null}
    </XStack>
  )
}

function Segmented({ view, onView, boardDisabled }: { view: ViewConfig; onView: (v: ViewConfig) => void; boardDisabled?: boolean }) {
  const seg = (kind: 'table' | 'board', icon: ReactNode, label: string) => {
    const active = view.kind === kind
    return (
      <XStack
        items="center"
        gap={6}
        px={10}
        py={6}
        rounded={7}
        cursor="pointer"
        onPress={() => onView(setKind(view, kind))}
        style={{ backgroundColor: active ? tokens.surface : 'transparent' }}
        hoverStyle={active ? undefined : { bg: tokens.hover }}
      >
        {icon}
        <Text fontSize={13} fontWeight="600" style={{ color: active ? tokens.text : tokens.textFaint }}>{label}</Text>
      </XStack>
    )
  }
  return (
    <XStack p={3} gap={2} rounded={9} borderWidth={1} style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceRaised }}>
      {seg('table', <Table2 size={14} color={view.kind === 'table' ? tokens.text : tokens.textFaint} />, 'Table')}
      {boardDisabled ? null : seg('board', <LayoutGrid size={14} color={view.kind === 'board' ? tokens.text : tokens.textFaint} />, 'Board')}
    </XStack>
  )
}

/** A field picker menu (used by filter rows). */
function FieldPicker({ fields, value, onPick, trigger }: { fields: FieldDefinition[]; value?: string; onPick: (name: string) => void; trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Menu open={open} onOpenChange={setOpen} width={220} trigger={trigger}>
      {fields.map((f) => (
        <MenuItem key={f.name} active={f.name === value} onPress={() => { onPick(f.name); setOpen(false) }}>
          <Text fontSize={13} style={{ color: tokens.text }}>{f.label}</Text>
        </MenuItem>
      ))}
    </Menu>
  )
}

function OpPicker({ ops, value, onPick }: { ops: FilterOp[]; value: FilterOp; onPick: (op: FilterOp) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Menu open={open} onOpenChange={setOpen} width={200} trigger={<PillText text={OP_LABELS[value]} />}>
      {ops.map((op) => (
        <MenuItem key={op} active={op === value} onPress={() => { onPick(op); setOpen(false) }}>
          <Text fontSize={13} style={{ color: tokens.text }}>{OP_LABELS[op]}</Text>
        </MenuItem>
      ))}
    </Menu>
  )
}

function PillText({ text }: { text: string }) {
  return (
    <XStack items="center" px={8} py={5} rounded={7} borderWidth={1} cursor="pointer" hoverStyle={{ borderColor: tokens.textMuted }} style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
      <Text fontSize={12} numberOfLines={1} style={{ color: tokens.text }}>{text}</Text>
    </XStack>
  )
}

function FilterBuilder({ fields, view, onView, fieldOptions }: RecordsToolbarProps) {
  const [open, setOpen] = useState(false)
  const active = view.filters.filter((r) => r.op === 'isEmpty' || r.op === 'isNotEmpty' || r.value != null).length
  return (
    <Menu
      open={open}
      onOpenChange={setOpen}
      width={420}
      trigger={<Control icon={<ListFilter size={14} color={tokens.textMuted} />} label="Filter" count={active} active={active > 0} />}
    >
      <YStack gap={8} p={4}>
        {view.filters.length === 0 ? (
          <Text px={6} py={4} fontSize={12} style={{ color: tokens.textFaint }}>No filters yet.</Text>
        ) : null}
        {view.filters.map((rule, i) => {
          const field = byName(fields, rule.field) ?? fields[0]
          const ops = operatorsForType(field.type)
          const needsValue = rule.op !== 'isEmpty' && rule.op !== 'isNotEmpty'
          const valueField: FieldDefinition = rule.op === 'isAnyOf' ? { ...field, type: 'multiSelect' } : field
          const withOpts: FieldDefinition = fieldOptions?.(field)
            ? { ...valueField, metadata: { ...(valueField.metadata as object), options: fieldOptions(field) } as FieldDefinition['metadata'] }
            : valueField
          return (
            <XStack key={i} items="center" gap={6}>
              <Text fontSize={12} width={28} style={{ color: tokens.textFaint }}>{i === 0 ? 'Where' : 'and'}</Text>
              <FieldPicker
                fields={fields}
                value={rule.field}
                onPick={(name) => { const nf = byName(fields, name)!; onView(updateFilter(view, i, { field: name, op: operatorsForType(nf.type)[0], value: undefined })) }}
                trigger={<PillText text={field.label} />}
              />
              <OpPicker ops={ops} value={rule.op} onPick={(op) => onView(updateFilter(view, i, { op }))} />
              {needsValue ? (
                <XStack flex={1} minW={120}>
                  <FieldInput field={withOpts} value={rule.value} onChange={(v) => onView(updateFilter(view, i, { value: v }))} />
                </XStack>
              ) : <XStack flex={1} />}
              <YStack cursor="pointer" p={4} rounded={6} hoverStyle={{ bg: tokens.hover }} onPress={() => onView(removeFilter(view, i))}>
                <X size={14} color={tokens.textFaint} />
              </YStack>
            </XStack>
          )
        })}
        <XStack>
          <Button size="$2" icon={<Plus size={14} />} onPress={() => onView(addFilter(view, defaultRuleFor(fields[0])))}>Add filter</Button>
        </XStack>
      </YStack>
    </Menu>
  )
}

function SortBuilder({ fields, view, onView }: { fields: FieldDefinition[]; view: ViewConfig; onView: (v: ViewConfig) => void }) {
  const [open, setOpen] = useState(false)
  const dirOf = (name: string) => view.sorts.find((s) => s.field === name)?.dir
  const toggle = (name: string) => {
    const cur = view.sorts.find((s) => s.field === name)
    let sorts: SortRule[]
    if (!cur) sorts = [...view.sorts, { field: name, dir: 'asc' }]
    else if (cur.dir === 'asc') sorts = view.sorts.map((s) => (s.field === name ? { ...s, dir: 'desc' } : s))
    else sorts = view.sorts.filter((s) => s.field !== name)
    onView(setSorts(view, sorts))
  }
  return (
    <Menu
      open={open}
      onOpenChange={setOpen}
      width={240}
      trigger={<Control icon={<ArrowDownUp size={14} color={tokens.textMuted} />} label="Sort" count={view.sorts.length} active={view.sorts.length > 0} />}
    >
      {fields.map((f) => {
        const dir = dirOf(f.name)
        return (
          <MenuItem
            key={f.name}
            active={Boolean(dir)}
            onPress={() => toggle(f.name)}
            trailing={dir === 'asc' ? <ArrowUp size={13} color={tokens.accent} /> : dir === 'desc' ? <ArrowDown size={13} color={tokens.accent} /> : null}
          >
            <Text fontSize={13} style={{ color: tokens.text }}>{f.label}</Text>
          </MenuItem>
        )
      })}
    </Menu>
  )
}

function GroupPicker({ fields, view, onView }: { fields: FieldDefinition[]; view: ViewConfig; onView: (v: ViewConfig) => void }) {
  const [open, setOpen] = useState(false)
  const candidates = groupFieldCandidates(fields)
  const current = byName(fields, view.groupField ?? '')
  return (
    <Menu
      open={open}
      onOpenChange={setOpen}
      width={220}
      trigger={<Control icon={<Columns3 size={14} color={tokens.textMuted} />} label={current ? `Group: ${current.label}` : 'Group by'} active={Boolean(current)} />}
    >
      {candidates.length === 0 ? <Text px={10} py={6} fontSize={12} style={{ color: tokens.textFaint }}>No groupable fields</Text> : null}
      {candidates.map((f) => (
        <MenuItem key={f.name} active={f.name === view.groupField} onPress={() => { onView(setGroupField(view, f.name)); setOpen(false) }}>
          <Text fontSize={13} style={{ color: tokens.text }}>{f.label}</Text>
        </MenuItem>
      ))}
    </Menu>
  )
}

export function RecordsToolbar(props: RecordsToolbarProps) {
  const { fields, view, onView, onCreate, createLabel = 'New', extra, boardDisabled } = props
  return (
    <XStack items="center" gap={8} style={{ flexWrap: 'wrap' }}>
      <Segmented view={view} onView={onView} boardDisabled={boardDisabled} />
      <FilterBuilder {...props} />
      <SortBuilder fields={fields} view={view} onView={onView} />
      {view.kind === 'board' ? <GroupPicker fields={fields} view={view} onView={onView} /> : null}

      <XStack flex={1} minW={160} items="center" gap={6} px={10} py={6} rounded={8} borderWidth={1} style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
        <Search size={14} color={tokens.textFaint} />
        <Input
          flex={1}
          size="$2"
          value={view.search ?? ''}
          onChangeText={(t: string) => onView(setSearch(view, t))}
          placeholder="Search…"
          style={{ borderWidth: 0, backgroundColor: 'transparent', paddingLeft: 0, paddingRight: 0 }}
        />
      </XStack>

      {extra ? <Fragment>{extra}</Fragment> : null}
      {onCreate ? <Button size="$3" icon={<Plus size={16} />} theme="blue" onPress={onCreate}>{createLabel}</Button> : null}
    </XStack>
  )
}
