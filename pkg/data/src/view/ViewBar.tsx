'use client'

// ViewBar — the records toolbar in the record kit's look (MIT, NOTICE),
// drawn by RecordsToolbar under `<Density value="compact">`.
//
//   top row      39 high on a hairline: the view picker (its layout's icon, the
//                name held to 130, "· N", a quiet chevron) opening the saved
//                views and the layout; then search, Filter, Sort and Options as
//                quiet 24px buttons 2 apart, and the create action.
//   details row  shown while the view sorts or filters: a chip per sort, a
//                1px rule, a chip per filter, "+ Add filter"; at its end Reset
//                and an "Update view" split button while the view differs from
//                its saved state.
//
// A chip is 24 high on the hover rung under a hairline at a 4px corner: the
// field in medium, what it does in regular, a 20px remove. A sort chip turns its
// direction when pressed; a filter chip opens its operator and value — the
// field's OWN editor (FieldInput), one editor vocabulary everywhere. Menus open
// 8 below their trigger (the compact menu offset) at 200 or 240 wide, with a
// search over the fields and, for Options, pages: Fields, Group by, Layout.
//
// Every control edits the one ViewConfig through view/logic and emits it via
// onView, exactly as the sheet toolbar does.
import { useMemo, useState, type ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  ChevronDown,
  LayoutGrid,
  ListFilter,
  Plus,
  Search,
  SlidersHorizontal,
  Table2,
  X,
} from '@hanzogui/lucide-icons-2'
import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuBack,
  DropdownMenuContent,
  DropdownMenuEmpty,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuOptionItem,
  DropdownMenuPage,
  DropdownMenuSearch,
  DropdownMenuSection,
  DropdownMenuSelectionGroup,
  DropdownMenuTitle,
  DropdownMenuTrigger,
  Input,
  InputGroup,
  TruncatedText,
} from '@hanzo/ui'
import type { FieldDefinition } from '../field/types'
import { FieldInput } from '../field/FieldInput'
import { OP_LABELS, operatorsForType, type FilterRule, type SortRule } from '../table/logic'
import { groupFieldCandidates } from '../board/logic'
import type { RecordsToolbarProps } from './Toolbar'
import type { ViewConfig } from './types'
import {
  addFilter,
  defaultRuleFor,
  removeFilter,
  setGroupField,
  setKind,
  setSearch,
  setSorts,
  toggleFieldHidden,
  updateFilter,
} from './logic'

/** The bar's measures (the record kit's view bar, MIT). */
export const VIEW_BAR = { top: 39, details: 32, chip: 24, remove: 20, name: 130, menu: 200, wide: 240 } as const

const byName = (fields: FieldDefinition[], name: string) => fields.find((f) => f.name === name)

/** The fields a query names, by label. */
const matching = (fields: FieldDefinition[], q: string) =>
  fields.filter((f) => f.label.toLowerCase().includes(q.trim().toLowerCase()))

/** A rule's value as one short phrase: "Lead", "Lead, Won", "3". */
const valueText = (rule: FilterRule, field: FieldDefinition | undefined): string => {
  const options = (field?.metadata as { options?: { value: string; label: string }[] } | undefined)?.options
  const label = (v: unknown) => options?.find((o) => o.value === v)?.label ?? String(v)
  if (rule.value == null || rule.value === '') return ''
  return Array.isArray(rule.value) ? rule.value.map(label).join(', ') : label(rule.value)
}

/** One of the bar's quiet 24px buttons, drawn lifted while its menu is open. */
function BarButton({ open, icon, children, ...props }: { open?: boolean; icon: ReactNode; children: ReactNode } & Record<string, unknown>) {
  return (
    <Button size="xs" variant="ghost" color="$aside" startIcon={icon} bg={open ? '$hover' : undefined} {...props}>
      {children}
    </Button>
  )
}

export function ViewBar(props: RecordsToolbarProps) {
  const { fields, view, onView, extra, onCreate, createLabel = 'New', boardDisabled } = props
  const { savedViews, dirty = false, onResetView, onSaveView, onSaveAsView } = props
  const [filtering, setFiltering] = useState(false)
  const details = view.sorts.length > 0 || view.filters.length > 0 || (dirty && (onResetView || onSaveView))

  return (
    <YStack {...({ 'data-slot': 'view-bar' } as object)}>
      <XStack
        {...({ 'data-slot': 'view-bar-top' } as object)}
        // 39 above its hairline, as the source kit measures it.
        minH={VIEW_BAR.top + 1}
        items="center"
        justify="space-between"
        gap="$2"
        ml="$1"
        pr="$2"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <ViewPicker {...props} />
        <XStack items="center" gap="$0.5" shrink={1} minW={0}>
          <InputGroup size="xs" start={<Search size={14} />} width={180} shrink={1}>
            <Input
              value={view.search ?? ''}
              onChangeText={(t: string) => onView(setSearch(view, t))}
              placeholder="Search…"
              aria-label="Search records"
            />
          </InputGroup>
          <FilterMenu fields={fields} view={view} onView={onView} open={filtering} onOpenChange={setFiltering}>
            <BarButton open={filtering} icon={<ListFilter />}>
              Filter
            </BarButton>
          </FilterMenu>
          <SortMenu fields={fields} view={view} onView={onView} />
          <OptionsMenu fields={fields} view={view} onView={onView} boardDisabled={boardDisabled} />
          {extra}
          {onCreate ? (
            <Button size="xs" variant="primary" startIcon={<Plus />} onPress={onCreate}>
              {createLabel}
            </Button>
          ) : null}
        </XStack>
      </XStack>

      {details ? (
        <XStack
          {...({ 'data-slot': 'view-bar-details' } as object)}
          minH={VIEW_BAR.details}
          items="center"
          gap="$2"
          py="$1"
          px="$2"
          borderTopWidth={1}
          borderColor="$borderColor"
          flexWrap="wrap"
        >
          {view.sorts.map((rule) => (
            <SortChip key={`sort-${rule.field}`} rule={rule} fields={fields} view={view} onView={onView} />
          ))}
          {view.sorts.length > 0 && view.filters.length > 0 ? (
            <YStack {...({ 'data-slot': 'view-bar-rule' } as object)} width={1} height={16} bg="$raised" />
          ) : null}
          {view.filters.map((rule, i) => (
            <FilterChip key={`filter-${i}`} index={i} rule={rule} {...props} />
          ))}
          <Button size="xs" variant="ghost" color="$aside" fontWeight="400" startIcon={<Plus />} onPress={() => setFiltering(true)}>
            Add filter
          </Button>
          <XStack flex={1} />
          {dirty && onResetView ? (
            <Button size="xs" variant="ghost" color="$aside" fontWeight="400" onPress={onResetView}>
              Reset
            </Button>
          ) : null}
          {dirty && onSaveView ? (
            <ButtonGroup size="xs" variant="outline" aria-label="Update view">
              <Button onPress={onSaveView}>Update view</Button>
              {onSaveAsView ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-xs" aria-label="More ways to save the view">
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" minW={VIEW_BAR.menu}>
                    <DropdownMenuItem onSelect={onSaveAsView}>Save as new view</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </ButtonGroup>
          ) : null}
        </XStack>
      ) : null}
    </YStack>
  )
}

/** The view's name and layout, opening the saved views and the layout choice. */
function ViewPicker({ view, onView, count, savedViews, boardDisabled }: RecordsToolbarProps) {
  const [open, setOpen] = useState(false)
  const Icon = view.kind === 'board' ? LayoutGrid : Table2
  const load = (id: string | string[] | null) => {
    const v = savedViews?.views.find((x) => x.id === id)
    if (!v || !savedViews) return
    savedViews.onSelect(v.id)
    onView(v)
  }
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="xs"
          variant="ghost"
          color="$aside"
          pl="$1"
          startIcon={<Icon size={16} />}
          endIcon={<ChevronDown size={14} color="$hush" />}
          bg={open ? '$hover' : undefined}
          aria-label={`View: ${view.name}`}
        >
          <TruncatedText text={view.name} maxW={VIEW_BAR.name} fontSize="$2" fontWeight="500" color="$aside" />
          {count != null ? (
            <Text fontSize="$2" color="$hint">
              {`· ${count}`}
            </Text>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent minW={VIEW_BAR.menu}>
        {savedViews && savedViews.views.length ? (
          <DropdownMenuSelectionGroup value={savedViews.activeId ?? view.id} onValueChange={load}>
            <DropdownMenuSection label="Views">
              {savedViews.views.map((v) => (
                <DropdownMenuOptionItem key={v.id} value={v.id}>
                  {v.name}
                </DropdownMenuOptionItem>
              ))}
            </DropdownMenuSection>
          </DropdownMenuSelectionGroup>
        ) : null}
        {boardDisabled ? null : (
          <DropdownMenuSelectionGroup
            value={view.kind}
            onValueChange={(k) => (k === 'table' || k === 'board' ? onView(setKind(view, k)) : undefined)}
          >
            <DropdownMenuLabel variant="band">Layout</DropdownMenuLabel>
            <DropdownMenuOptionItem value="table">Table</DropdownMenuOptionItem>
            <DropdownMenuOptionItem value="board">Board</DropdownMenuOptionItem>
          </DropdownMenuSelectionGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Pick a field to filter by: a search over the fields, then the rule's chip. */
function FilterMenu({
  fields,
  view,
  onView,
  open,
  onOpenChange,
  children,
}: Pick<RecordsToolbarProps, 'fields' | 'view' | 'onView'> & { open: boolean; onOpenChange: (o: boolean) => void; children: ReactNode }) {
  const [q, setQ] = useState('')
  const shown = matching(fields, q)
  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setQ('')
      }}
    >
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent minW={VIEW_BAR.menu}>
        <DropdownMenuSearch value={q} onValueChange={setQ} placeholder="Search fields" />
        <DropdownMenuSection scrollable>
          {shown.map((f) => (
            <DropdownMenuItem key={f.name} onSelect={() => onView(addFilter(view, defaultRuleFor(f)))}>
              {f.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSection>
        {shown.length === 0 ? <DropdownMenuEmpty>No field matches</DropdownMenuEmpty> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The next direction of a field's sort: none → ascending → descending → none. */
const cycle = (sorts: SortRule[], name: string): SortRule[] => {
  const cur = sorts.find((s) => s.field === name)
  if (!cur) return [...sorts, { field: name, dir: 'asc' }]
  if (cur.dir === 'asc') return sorts.map((s) => (s.field === name ? { ...s, dir: 'desc' } : s))
  return sorts.filter((s) => s.field !== name)
}

function SortMenu({ fields, view, onView }: Pick<RecordsToolbarProps, 'fields' | 'view' | 'onView'>) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const shown = matching(fields, q)
  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQ('')
      }}
    >
      <DropdownMenuTrigger asChild>
        <BarButton open={open} icon={<ArrowDownUp />}>
          Sort
        </BarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent minW={VIEW_BAR.menu}>
        <DropdownMenuSearch value={q} onValueChange={setQ} placeholder="Search fields" />
        <DropdownMenuSection scrollable>
          {shown.map((f) => {
            const dir = view.sorts.find((s) => s.field === f.name)?.dir
            return (
              <DropdownMenuItem key={f.name} onSelect={() => onView(setSorts(view, cycle(view.sorts, f.name)))}>
                <XStack flex={1} items="center" justify="space-between" gap="$2">
                  <Text fontSize="$2" color="$aside" numberOfLines={1}>
                    {f.label}
                  </Text>
                  {dir === 'asc' ? <ArrowUp size={14} color="$aside" /> : dir === 'desc' ? <ArrowDown size={14} color="$aside" /> : null}
                </XStack>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuSection>
        {shown.length === 0 ? <DropdownMenuEmpty>No field matches</DropdownMenuEmpty> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** View options, in pages: the fields shown, what a board groups by, the layout. */
function OptionsMenu({ fields, view, onView, boardDisabled }: Pick<RecordsToolbarProps, 'fields' | 'view' | 'onView' | 'boardDisabled'>) {
  const [open, setOpen] = useState(false)
  const hidden = new Set(view.hiddenFields ?? [])
  const shown = fields.filter((f) => !hidden.has(f.name)).map((f) => f.name)
  const groupable = groupFieldCandidates(fields)
  const show = (next: string | string[] | null) => {
    const want = new Set(Array.isArray(next) ? next : next ? [next] : [])
    let v: ViewConfig = view
    for (const f of fields) if (want.has(f.name) === hidden.has(f.name)) v = toggleFieldHidden(v, f.name)
    onView(v)
  }
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} defaultPage="options">
      <DropdownMenuTrigger asChild>
        <BarButton open={open} icon={<SlidersHorizontal />}>
          Options
        </BarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" minW={VIEW_BAR.wide}>
        <DropdownMenuPage id="options">
          <DropdownMenuHeader>
            <DropdownMenuTitle>View options</DropdownMenuTitle>
          </DropdownMenuHeader>
          <DropdownMenuItem page="fields">Fields</DropdownMenuItem>
          {view.kind === 'board' && groupable.length ? <DropdownMenuItem page="group">Group by</DropdownMenuItem> : null}
          {boardDisabled ? null : (
            <DropdownMenuSelectionGroup
              value={view.kind}
              onValueChange={(k) => (k === 'table' || k === 'board' ? onView(setKind(view, k)) : undefined)}
            >
              <DropdownMenuLabel variant="band">Layout</DropdownMenuLabel>
              <DropdownMenuOptionItem value="table">Table</DropdownMenuOptionItem>
              <DropdownMenuOptionItem value="board">Board</DropdownMenuOptionItem>
            </DropdownMenuSelectionGroup>
          )}
        </DropdownMenuPage>
        <DropdownMenuPage id="fields">
          <DropdownMenuBack>Fields</DropdownMenuBack>
          <DropdownMenuSelectionGroup multiple value={shown} onValueChange={show}>
            <DropdownMenuSection scrollable>
              {fields.map((f) => (
                <DropdownMenuOptionItem key={f.name} value={f.name}>
                  {f.label}
                </DropdownMenuOptionItem>
              ))}
            </DropdownMenuSection>
          </DropdownMenuSelectionGroup>
        </DropdownMenuPage>
        <DropdownMenuPage id="group">
          <DropdownMenuBack>Group by</DropdownMenuBack>
          <DropdownMenuSelectionGroup
            value={view.groupField ?? null}
            onValueChange={(g) => onView(setGroupField(view, typeof g === 'string' ? g : undefined))}
          >
            {groupable.map((f) => (
              <DropdownMenuOptionItem key={f.name} value={f.name}>
                {f.label}
              </DropdownMenuOptionItem>
            ))}
          </DropdownMenuSelectionGroup>
        </DropdownMenuPage>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The chip's frame: 24 high on the hover rung under a hairline, the remove at its end. */
function Chip({ label, onRemove, children }: { label: string; onRemove: () => void; children: ReactNode }) {
  return (
    <XStack
      {...({ 'data-slot': 'view-chip' } as object)}
      height={VIEW_BAR.chip}
      items="center"
      gap="$1"
      p="$0.5"
      pl="$1"
      rounded="$xs"
      bg="$hover"
      borderWidth={1}
      borderColor="$borderColor"
    >
      {children}
      <Button size="icon-2xs" variant="ghost" emphasis="subtle" aria-label={`Remove ${label}`} onPress={onRemove}>
        <X />
      </Button>
    </XStack>
  )
}

/** The chip's pressable body: the field in medium, what the rule does in regular. */
const body = (field: string, rest: ReactNode, extra: Record<string, unknown> = {}) => (
  <XStack
    {...({ role: 'button', tabIndex: 0, 'data-slot': 'view-chip-body' } as object)}
    items="center"
    gap="$1"
    cursor="pointer"
    rounded="$2xs"
    focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
    {...extra}
  >
    <Text fontSize="$1" fontWeight="500" color="$ink" numberOfLines={1}>
      {field}
    </Text>
    {rest}
  </XStack>
)

/** A sort, as a chip: pressing it turns its direction. */
function SortChip({ rule, fields, view, onView }: { rule: SortRule; fields: FieldDefinition[]; view: ViewConfig; onView: (v: ViewConfig) => void }) {
  const field = byName(fields, rule.field)
  const label = field?.label ?? rule.field
  const flip = () =>
    onView(setSorts(view, view.sorts.map((s) => (s.field === rule.field ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' } : s))))
  return (
    <Chip label={`sort by ${label}`} onRemove={() => onView(setSorts(view, view.sorts.filter((s) => s.field !== rule.field)))}>
      {body(
        label,
        rule.dir === 'asc' ? <ArrowUp size={14} color="$ink" /> : <ArrowDown size={14} color="$ink" />,
        {
          'aria-label': `Sort by ${label}, ${rule.dir === 'asc' ? 'ascending' : 'descending'}`,
          onPress: flip,
          onKeyDown: (e: { key?: string; preventDefault?: () => void }) => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            e.preventDefault?.()
            flip()
          },
        },
      )}
    </Chip>
  )
}

/** A filter, as a chip: pressing it opens its operator and value. */
function FilterChip({ index, rule, fields, view, onView, fieldOptions }: RecordsToolbarProps & { index: number; rule: FilterRule }) {
  const [open, setOpen] = useState(false)
  const field = byName(fields, rule.field) ?? fields[0]
  const ops = operatorsForType(field.type)
  const needsValue = rule.op !== 'isEmpty' && rule.op !== 'isNotEmpty'
  const valueField = useMemo<FieldDefinition>(() => {
    const base: FieldDefinition = rule.op === 'isAnyOf' ? { ...field, type: 'multiSelect' } : field
    const options = fieldOptions?.(field)
    return options ? { ...base, metadata: { ...(base.metadata as object), options } as FieldDefinition['metadata'] } : base
  }, [field, rule.op, fieldOptions])
  const value = valueText(rule, field)
  return (
    <Chip label={`filter on ${field.label}`} onRemove={() => onView(removeFilter(view, index))}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          {body(
            field.label,
            <Text fontSize="$1" color="$ink" numberOfLines={1}>
              {`: ${OP_LABELS[rule.op]}${value ? ` ${value}` : ''}`}
            </Text>,
            { 'aria-label': `Filter: ${field.label} ${OP_LABELS[rule.op]} ${value}`.trim() },
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent minW={VIEW_BAR.wide}>
          <DropdownMenuSelectionGroup
            value={rule.op}
            closeOnSelect={false}
            onValueChange={(op) => (typeof op === 'string' ? onView(updateFilter(view, index, { op: op as FilterRule['op'] })) : undefined)}
          >
            <DropdownMenuLabel variant="band">{field.label}</DropdownMenuLabel>
            {ops.map((op) => (
              <DropdownMenuOptionItem key={op} value={op}>
                {OP_LABELS[op]}
              </DropdownMenuOptionItem>
            ))}
          </DropdownMenuSelectionGroup>
          {needsValue ? (
            <YStack p="$1">
              <FieldInput field={valueField} value={rule.value} onChange={(v) => onView(updateFilter(view, index, { value: v }))} />
            </YStack>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </Chip>
  )
}
