'use client'

import * as React from 'react'
/**
 * JsonTree — a JSON value drawn as a tree a reader can open and close: one row
 * per key or element, objects and arrays behind a disclosure that says how
 * many children they hold, and a header with a filter, Expand all, Collapse all
 * and Copy.
 *
 * The first `depth` levels open on first paint. A row is a button (Enter and
 * Space toggle it, `aria-expanded` says which way), so the tree reads with a
 * keyboard and a screen reader as well as a pointer. Keys and values take the
 * code theme's inks and weights (`code-theme.ts`), the same theme keys `CodeEditor`
 * paints with, and a count reads as a comment. A long value wraps anywhere, so
 * a hash never widens the page.
 *
 * Filter. What is typed keeps every row whose key, dotted path
 * (`answers.team.probabilities`) or value contains it, with the rows above it,
 * and opens them; a branch that matches keeps everything under it. Clearing the
 * filter hands back the tree as it was opened before.
 *
 * Height. The tree is as tall as its rows up to `maxHeight`, then scrolls.
 * `resizable` puts a `Grip` on its bottom edge: a drag or ArrowUp / ArrowDown
 * sets a height of the reader's own and a double-click hands it back;
 * `onResize` hears each one and `defaultHeight` starts from it. Copy writes the whole
 * value, whatever is open or filtered. Built from gui primitives only, so it
 * renders wherever gui does.
 *
 * `variant="boxed"` is the record kit's tree (JsonTree, MIT —
 * NOTICE), for workflow runs, tool calls and webhook samples: each disclosure a
 * 24px boxed arrow that turns as it opens, each key a 24px boxed label led by a
 * 16px icon naming its type (Type, Hash, SquareCheck, CircleOff, Brackets, Box),
 * 32px of indent and 8px between rows. Either variant takes
 * `getNodeHighlighting(keyPath)` — `blue` marks a node in the accent, `red` in
 * the error state, `partial-blue` only its arrow — `onNodeValueClick(value,
 * keyPath)`, which makes every leaf a button (copy a value, pick a variable),
 * `entries` for a labelled root, and `labels` for the words the tree says.
 * A keyPath is the keys joined with dots, entries by their id.
 */
import { SizableText, XStack, YStack, type YStackProps } from '@hanzo/gui'
import { Box, Brackets, Check, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, CircleOff, Copy, Hash, SquareCheck, Type } from '@hanzogui/lucide-icons-2'

import { face, type CodeToken } from '../../code-theme'
import { useTranslate } from '../../i18n/react'
import { Button } from './button'
import { ltr } from './dir'
import { Grip } from './grip'
import { Input } from './input'
import { slot } from './slot'
import { toast } from './toaster'

/** The tallest a drag makes the tree, px: a ceiling that is not one. */
const CEILING = 4096

/** Indent per level, in px: the code tree, and the boxed one. */
const INDENT = { code: 16, boxed: 32 } as const

export type JsonTreeVariant = 'code' | 'boxed'

/** How a node is marked: in the accent, in the error state, or only its arrow in the accent. */
export type JsonHighlight = 'blue' | 'red' | 'partial-blue'

/** The words the tree says, for a host that translates them. */
export type JsonTreeLabels = {
  emptyString?: string
  emptyArray?: string
  emptyObject?: string
}

/** One labelled root entry: `id` is its key in a keyPath, `label` what is drawn. */
export type JsonTreeEntry = { id: string; label: string; value: unknown }

/** What a node needs that only the tree knows. */
type Ctx = {
  variant: JsonTreeVariant
  highlight?: (keyPath: string) => JsonHighlight | null | undefined
  onValue?: (value: unknown, keyPath: string) => void
  labels: Required<JsonTreeLabels>
  names: Map<string, string>
}

const LABELS: Required<JsonTreeLabels> = {
  emptyString: 'Empty string',
  emptyArray: 'Empty array',
  emptyObject: 'Empty object',
}

type Branch = { kind: 'object' | 'array'; entries: [string, unknown][] }

const branch = (v: unknown): Branch | null =>
  Array.isArray(v)
    ? { kind: 'array', entries: v.map((x, i) => [String(i), x]) }
    : v !== null && typeof v === 'object'
      ? {
          kind: 'object',
          entries: Object.entries(v as Record<string, unknown>),
        }
      : null

const count = (b: Branch) => (b.kind === 'array' ? `[${b.entries.length} ${b.entries.length === 1 ? 'item' : 'items'}]` : `{${b.entries.length} ${b.entries.length === 1 ? 'key' : 'keys'}}`)

/** A child's path: each key escaped, so a key `a.b` and a nested `a` → `b` stay two paths. */
const child = (path: string, key: string) => `${path}/${encodeURIComponent(key)}`

/** Every path at or above `depth`, for the open set a tree starts with. */
function paths(v: unknown, depth: number, at = '$', level = 0, out = new Set<string>()): Set<string> {
  const b = branch(v)
  if (!b || level >= depth) return out
  out.add(at)
  for (const [k, x] of b.entries) paths(x, depth, child(at, k), level + 1, out)
  return out
}

/** A leaf as it is drawn, and as the filter reads it. */
const text = (value: unknown) => (typeof value === 'string' ? JSON.stringify(value) : value === undefined ? 'undefined' : String(value))

/**
 * What a filter keeps. `rows` maps each kept path to `true` when everything
 * under it is kept as well (it matched) and `false` when only the way down to a
 * match is; `open` is every kept branch, so each match is in view.
 */
export type Sifted = { rows: Map<string, boolean>; open: Set<string> }

export function sift(data: unknown, query: string): Sifted {
  const q = query.trim().toLowerCase()
  const rows = new Map<string, boolean>()
  const open = new Set<string>()
  const walk = (v: unknown, at: string, dotted: string, name: string | null): boolean => {
    const b = branch(v)
    const hit = (name !== null && (name.toLowerCase().includes(q) || `.${dotted}`.toLowerCase().includes(`.${q}`))) || (!b && text(v).toLowerCase().includes(q))
    if (hit) {
      rows.set(at, true)
      if (b) open.add(at)
      return true
    }
    let kept = false
    if (b) for (const [k, x] of b.entries) if (walk(x, child(at, k), dotted ? `${dotted}.${k}` : k, k)) kept = true
    if (kept) {
      rows.set(at, false)
      open.add(at)
    }
    return kept
  }
  if (q) walk(data, '$', '', null)
  return { rows, open }
}

export interface JsonTreeProps extends Omit<YStackProps, 'children' | 'minHeight' | 'maxHeight'> {
  /** The value to draw — anything `JSON.stringify` accepts. Ignored when `entries` is given. */
  data?: unknown
  /** A labelled root: each entry a top-level node drawn with its label. */
  entries?: JsonTreeEntry[]
  /** `code` (default) or the record kit's `boxed`. */
  variant?: JsonTreeVariant
  /** How a node is marked, by its dotted keyPath. */
  getNodeHighlighting?: (keyPath: string) => JsonHighlight | null | undefined
  /** Makes every leaf a button; told the value and its dotted keyPath. */
  onNodeValueClick?: (value: unknown, keyPath: string) => void
  /** The words the tree says. */
  labels?: JsonTreeLabels
  /** How many levels are open on first paint. */
  depth?: number
  /** The header's title. Omit it, `showCopyButton={false}` and `search={false}` to drop the header. */
  title?: string
  showCopyButton?: boolean
  /** Whether the header has a filter box. Defaults to true. */
  search?: boolean
  /** The tallest the tree grows on its own, in px; past it the tree scrolls. */
  maxHeight?: number
  /** The shortest a drag makes it, in px. */
  minHeight?: number
  /** Whether a footer grip resizes the tree. */
  resizable?: boolean
  /** A height to start from, as `onResize` last reported it. */
  defaultHeight?: number | null
  /** Every height the reader drags to, and `null` when a double-click hands it back. */
  onResize?: (height: number | null) => void
}

export function JsonTree({ data: given, entries, variant = 'code', getNodeHighlighting, onNodeValueClick, labels, depth = 2, title, showCopyButton = true, search = true, maxHeight, minHeight = 96, resizable = false, defaultHeight = null, onResize, ...props }: JsonTreeProps) {
  const tr = useTranslate()
  const data = React.useMemo(() => (entries ? Object.fromEntries(entries.map((e) => [e.id, e.value])) : given), [entries, given])
  const ctx = React.useMemo<Ctx>(
    () => ({
      variant,
      highlight: getNodeHighlighting,
      onValue: onNodeValueClick,
      labels: { ...LABELS, ...labels },
      names: new Map((entries ?? []).map((e) => [e.id, e.label])),
    }),
    [variant, getNodeHighlighting, onNodeValueClick, labels, entries]
  )
  const [open, setOpen] = React.useState(() => paths(data, depth))
  const [query, setQuery] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  /** The open set from before a filter, handed back when it clears. */
  const before = React.useRef<Set<string> | null>(null)
  /** A height the reader dragged to, or null while the tree follows its rows. */
  const [height, setHeight] = React.useState<number | null>(defaultHeight)
  const size = (n: number | null) => {
    setHeight(n)
    onResize?.(n)
  }

  const sifted = React.useMemo(() => (query.trim() ? sift(data, query) : null), [data, query])

  React.useEffect(() => () => clearTimeout(timer.current), [])
  React.useEffect(() => setOpen(paths(data, depth)), [data, depth])
  // After the reset above, so a filter that is on keeps its matches open on new data.
  React.useEffect(() => {
    if (sifted) setOpen(sifted.open)
  }, [sifted])

  const type = (next: string) => {
    const on = next.trim() !== ''
    if (on && before.current === null) before.current = open
    if (!on && before.current !== null) {
      setOpen(before.current)
      before.current = null
    }
    setQuery(next)
  }

  const toggle = React.useCallback(
    (path: string) =>
      setOpen((prev) => {
        const next = new Set(prev)
        if (!next.delete(path)) next.add(path)
        return next
      }),
    []
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
      toast.success('JSON copied to clipboard')
    } catch {
      toast.error('Failed to copy JSON')
    }
  }

  const root = branch(data)
  const searchable = search && root !== null
  const header = title !== undefined || showCopyButton || searchable
  // Everything is kept when the root itself matched; nothing is when no row did.
  const kept = sifted && !sifted.rows.get('$') ? sifted.rows : null
  const none = sifted !== null && sifted.rows.size === 0
  const fixed = height !== null

  return (
    <YStack {...slot('json-tree')} borderWidth={1} borderColor="$borderColor" rounded="$3" overflow="hidden" bg="$background" {...props}>
      {header && (
        // One row: the title, then the filter and the three actions as icons that name
        // themselves. The filter and the actions move as one group, so on a pane too narrow
        // for all of it they wrap under the title together instead of overlapping it.
        <XStack {...slot('json-tree-header')} items="center" flexWrap="wrap" gap="$1" borderBottomWidth={1} borderColor="$borderColor" bg="$panel" px="$2" py="$1">
          <SizableText size="$1" fontFamily="$mono" color="$soft" px="$2" grow={1}>
            {title ?? 'JSON'}
          </SizableText>
          <XStack grow={1} shrink={1} flexBasis={searchable ? 240 : 'auto'} minW={0} justify="flex-end" items="center" gap="$1">
            {searchable && (
              <XStack flex={1} minW={0} maxW={260}>
                <Input
                  {...slot('json-tree-filter')}
                  type="search"
                  value={query}
                  onChangeText={type}
                  placeholder={tr('Filter')}
                  aria-label={`Filter ${title ?? 'JSON'} by key, path or value`}
                  // No adornment: its wrapper holds the field at its intrinsic width, and
                  // on a narrow pane that pushed the actions out of the header.
                  height={32}
                  fontSize="$2"
                />
              </XStack>
            )}
            {root && (
              <>
                <Button {...slot('json-tree-expand')} variant="ghost" size="icon-sm" aria-label={tr('Expand all')} title="Expand all" onClick={() => setOpen(paths(data, Number.POSITIVE_INFINITY))}>
                  <ChevronsUpDown size={14} />
                </Button>
                <Button {...slot('json-tree-collapse')} variant="ghost" size="icon-sm" aria-label={tr('Collapse all')} title="Collapse all" onClick={() => setOpen(new Set())}>
                  <ChevronsDownUp size={14} />
                </Button>
              </>
            )}
            {showCopyButton && (
              <Button {...slot('json-tree-copy')} variant="ghost" size="icon-sm" aria-label={copied ? tr('Copied') : tr('Copy {what}', { what: title ?? 'JSON' })} title={tr('Copy')} onClick={copy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            )}
          </XStack>
        </XStack>
      )}
      {/* The grip measures its parent, so the body and its grip share one box. */}
      <YStack position="relative">
        <YStack {...slot('json-tree-body')} {...ltr} py="$2" px="$2" {...(fixed ? { height } : maxHeight !== undefined ? { maxH: maxHeight } : null)} overflowY={fixed || maxHeight !== undefined ? 'auto' : undefined}>
          {none ? (
            <SizableText {...slot('json-tree-empty')} size="$2" color="$soft" px="$2" py="$1">
              Nothing matches “{query.trim()}”.
            </SizableText>
          ) : (
            <Node name={null} value={data} path="$" dotted="" level={0} open={open} toggle={toggle} kept={kept} ctx={ctx} />
          )}
        </YStack>
        {resizable && <Grip side="top" span={height ?? minHeight} floor={minHeight} ceil={CEILING} onSpan={setHeight} onKeep={size} onReset={() => size(null)} label={`Resize ${title ?? 'JSON'}`} b={0} />}
      </YStack>
    </YStack>
  )
}

/** A leaf's colour: the code theme's key for its JSON type; `face` adds its weight. */
const INK = {
  string: '$codeString',
  number: '$codeNumber',
  boolean: '$codeBoolean',
  null: '$codeNull',
} as const

/** The type icon a boxed key carries. */
const KIND = {
  string: Type,
  number: Hash,
  boolean: SquareCheck,
  null: CircleOff,
  array: Brackets,
  object: Box,
} as const

/** A value's JSON kind, for its icon and its colour. */
const kindOf = (v: unknown): keyof typeof KIND => {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  return t === 'object' ? 'object' : t === 'number' || t === 'boolean' ? t : 'string'
}

/** The accent, the error state, or nothing, as the three parts of a node paint it. */
const MARK = {
  blue: {
    edge: 'var(--primary)',
    fill: '$hover',
    ink: 'var(--primary)',
    value: 'var(--primary)',
  },
  red: {
    edge: '$red7',
    fill: 'var(--state-error-bg)',
    ink: '$bad',
    value: '$bad',
  },
} as const

function Leaf({ value, dotted, mark, ctx }: { value: unknown; dotted: string; mark: JsonHighlight | null; ctx: Ctx }) {
  const type = value === null ? 'null' : typeof value
  const boxed = ctx.variant === 'boxed'
  const shown = value === '' ? ctx.labels.emptyString : text(value)
  const hue = mark === 'blue' || mark === 'red' ? MARK[mark].value : null
  const body = (
    <SizableText
      {...slot('json-tree-value')}
      data-type={type}
      size="$2"
      fontFamily="$mono"
      color={(hue ?? (boxed ? '$hint' : (INK[type as keyof typeof INK] ?? '$codePunctuation'))) as never}
      {...(boxed ? null : face[type as CodeToken])}
      shrink={1}
      minW={0}
      {...(boxed ? { lineHeight: 24 } : null)}
      // A hash or a URL is one unbreakable word; without this it sets the tree's
      // min-content width and pushes the page sideways on a phone.
      style={{ overflowWrap: 'anywhere' }}
    >
      {shown}
    </SizableText>
  )
  if (!ctx.onValue) return body
  return (
    <XStack
      {...slot('json-tree-value-button')}
      render="button"
      {...({ type: 'button' } as object)}
      shrink={1}
      minW={0}
      bg="transparent"
      borderWidth={0}
      p={0}
      rounded="$xs"
      cursor="pointer"
      hoverStyle={{ bg: '$hover' }}
      focusVisibleStyle={{
        outlineColor: '$outlineColor',
        outlineWidth: 2,
        outlineStyle: 'solid',
      }}
      aria-label={`${dotted || 'value'}: ${shown}`}
      onPress={() => ctx.onValue?.(value, dotted)}
    >
      {body}
    </XStack>
  )
}

/** The disclosure arrow: a bare chevron in the code tree, a 24px box that turns in the boxed one. */
function Arrow({ expanded, empty, mark, ctx }: { expanded: boolean; empty: boolean; mark: JsonHighlight | null; ctx: Ctx }) {
  // `partial-blue` exists for exactly this: a branch with a marked node somewhere
  // below it shows the accent on its arrow and nowhere else.
  const ink = mark === 'red' ? '$bad' : mark ? 'var(--primary)' : '$hint'
  if (ctx.variant !== 'boxed') {
    if (empty) return <XStack width={14} shrink={0} />
    return expanded ? <ChevronDown size={14} color={ink as never} /> : <ChevronRight size={14} color={ink as never} />
  }
  if (empty) return <XStack width={24} shrink={0} />
  return (
    <XStack {...slot('json-tree-arrow')} width={24} height={24} shrink={0} items="center" justify="center" rounded="$xs" borderWidth={1} borderColor={(mark === 'red' ? '$red7' : mark ? 'var(--primary)' : '$borderColor') as never} bg="$panel">
      <ChevronDown
        size={16}
        color={(mark ? ink : '$aside') as never}
        style={{
          transform: `rotate(${expanded ? 0 : -90}deg)`,
          transition: 'transform 300ms ease',
        }}
      />
    </XStack>
  )
}

/** A key: name and colon in the code tree, a boxed label with its type icon in the boxed one. */
function Key({ name, kind, mark, ctx }: { name: string; kind: keyof typeof KIND; mark: JsonHighlight | null; ctx: Ctx }) {
  const shown = ctx.names.get(name) ?? name
  if (ctx.variant !== 'boxed')
    return (
      <SizableText {...slot('json-tree-key')} size="$2" fontFamily="$mono" color={(mark === 'blue' || mark === 'red' ? MARK[mark].ink : '$codeKey') as never}>
        {shown}
        <SizableText size="$2" fontFamily="$mono" color="$codePunctuation">
          :
        </SizableText>
      </SizableText>
    )
  const Icon = KIND[kind]
  const m = mark === 'blue' || mark === 'red' ? MARK[mark] : null
  return (
    <XStack {...slot('json-tree-key')} items="center" gap="$1" height={24} px="$2" shrink={0} rounded="$xs" borderWidth={1} borderColor={(m?.edge ?? '$borderColor') as never} bg={(m?.fill ?? '$panel') as never}>
      <Icon size={16} color={(m?.ink ?? '$hint') as never} aria-hidden />
      <SizableText size="$2" color={(m?.ink ?? '$ink') as never} numberOfLines={1}>
        {shown}
      </SizableText>
    </XStack>
  )
}

function Node({
  name,
  value,
  path,
  dotted,
  level,
  open,
  toggle,
  kept,
  ctx,
}: {
  name: string | null
  value: unknown
  path: string
  /** The keys down to here, joined with dots: what a host is told. */
  dotted: string
  level: number
  open: Set<string>
  toggle: (path: string) => void
  /** The rows a filter keeps below here, or null when every row is. */
  kept: Map<string, boolean> | null
  ctx: Ctx
}) {
  const b = branch(value)
  const expanded = b !== null && open.has(path)
  const mark = (ctx.highlight && dotted ? ctx.highlight(dotted) : null) ?? null
  const boxed = ctx.variant === 'boxed'
  const indent = level * INDENT[ctx.variant]
  const gap = boxed ? '$2' : '$1.5'
  const key = name === null ? null : <Key name={name} kind={kindOf(value)} mark={mark} ctx={ctx} />

  if (!b) {
    return (
      <XStack {...slot('json-tree-row')} data-highlight={mark ?? undefined} items="flex-start" gap={gap} paddingInlineStart={indent} py={boxed ? 0 : 1}>
        {boxed ? null : <XStack width={14} shrink={0} />}
        {key}
        <Leaf value={value} dotted={dotted} mark={mark} ctx={ctx} />
      </XStack>
    )
  }

  const empty = b.entries.length === 0
  return (
    <YStack {...slot('json-tree-node')} gap={boxed ? '$2' : 0}>
      <XStack
        {...slot('json-tree-row')}
        data-highlight={mark ?? undefined}
        {...(!empty &&
          ({
            role: 'button',
            tabIndex: 0,
            'aria-expanded': expanded,
            'aria-label': `${name === null ? 'root' : (ctx.names.get(name) ?? name)} ${count(b)}`,
          } as object))}
        items="center"
        gap={gap}
        paddingInlineStart={indent}
        py={boxed ? 0 : 1}
        rounded="$2"
        cursor={empty ? undefined : 'pointer'}
        hoverStyle={empty ? undefined : { bg: '$hover' }}
        focusVisibleStyle={{ bg: '$hover' }}
        onPress={empty ? undefined : () => toggle(path)}
        onKeyDown={
          empty
            ? undefined
            : (e: React.KeyboardEvent) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                toggle(path)
              }
        }
      >
        <Arrow expanded={expanded} empty={empty} mark={mark} ctx={ctx} />
        {key}
        <SizableText {...slot('json-tree-count')} size="$2" fontFamily={boxed ? undefined : '$mono'} color={boxed ? '$hint' : '$codeComment'}>
          {empty ? (boxed ? (b.kind === 'array' ? ctx.labels.emptyArray : ctx.labels.emptyObject) : b.kind === 'array' ? '[]' : '{}') : count(b)}
        </SizableText>
      </XStack>
      {expanded && (
        <YStack gap={boxed ? '$2' : 0}>
          {b.entries.map(([k, v]) => {
            const at = child(path, k)
            if (kept && !kept.has(at)) return null
            return <Node key={k} name={k} value={v} path={at} dotted={dotted ? `${dotted}.${k}` : k} level={level + 1} open={open} toggle={toggle} kept={kept && !kept.get(at) ? kept : null} ctx={ctx} />
          })}
        </YStack>
      )}
    </YStack>
  )
}
