'use client'

/**
 * FileTree — a repository's files, folders first, one level read at a time.
 *
 * Ported from build-v2 `components/editor/file-tree/{index,glyph}.tsx` (MIT,
 * derived from OSW Studio and DeepSite — see NOTICE). v2 listed a site's pages
 * and let you add, rename and delete them; a repository's files change by runs
 * that commit, so this tree reads and selects and does nothing else.
 *
 * Two ways in, one renderer (`tree.ts`):
 *   files  every path at once — a flat list the tree groups itself;
 *   load   one directory per call, the way a repository answers (`''` is the
 *          root), read the first time a folder opens and kept after.
 *
 * Names are TEXT. A path comes from a repository somebody else wrote, so it is
 * drawn as a string and never interpreted as markup.
 *
 * Keyboard and roles are the WAI-ARIA tree: one tab stop, arrows move and open,
 * Enter picks. The decisions are `step()` in `tree.ts`; this only applies them.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import {
  Braces,
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileJson,
  FileText,
  FileType,
  Folder,
  FolderOpen,
  Hash,
  Image,
  Settings2,
} from '@hanzogui/lucide-icons-2'
import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { slot } from '../backends/gui/slot'
import { ancestors, type Entry, group, type Listing, put, type Row, rows, step } from './tree'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>

/**
 * A file's icon, from its extension. The glyph varies and the colour does not:
 * the chrome is monochrome and colour means state (live, failed), so a green
 * `.env` would say "healthy" in a vocabulary that already means something.
 */
const BY_EXTENSION: Record<string, typeof FileText> = {
  html: FileCode2,
  htm: FileCode2,
  css: Hash,
  scss: Hash,
  js: Braces,
  mjs: Braces,
  cjs: Braces,
  jsx: Braces,
  ts: FileType,
  tsx: FileType,
  json: FileJson,
  md: FileText,
  mdx: FileText,
  txt: FileText,
  svg: Image,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  webp: Image,
  ico: Image,
  toml: Settings2,
  yml: Settings2,
  yaml: Settings2,
  env: Settings2,
}

/** A file's icon, drawn. `.env` splits to `['', 'env']`, so the last segment is the extension. */
export function glyph(name: string, size = 14): ReactNode {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const Icon = BY_EXTENSION[ext] ?? FileText
  return <Icon size={size} />
}

export interface FileTreeProps extends Col {
  /** Every file path at once. Folders are implied by the paths. */
  files?: readonly string[]
  /** One directory's children (`''` is the root). Called once per folder, on first open. */
  load?: (dir: string) => Promise<Entry[]>
  /** The open file. Its folders are opened so it can be seen. */
  value?: string | null
  onSelect?: (path: string) => void
  /** The tree's accessible name. */
  label?: string
  /** Drawn when the root has nothing in it. */
  empty?: ReactNode
}

type Read = 'loading' | { error: string }

export function FileTree({
  files,
  load,
  value = null,
  onSelect,
  label = 'Files',
  empty,
  ...rest
}: FileTreeProps) {
  const [loaded, setLoaded] = useState<Listing>(() => new Map())
  const [reads, setReads] = useState<Map<string, Read>>(() => new Map())
  const [open, setOpen] = useState<Set<string>>(() => new Set(value ? ancestors(value) : []))
  const [focus, setFocus] = useState(0)
  const items = useRef<(HTMLElement | null)[]>([])
  const asked = useRef(new Set<string>())

  const listing = useMemo(() => (files ? group([...files]) : loaded), [files, loaded])

  const read = (dir: string) => {
    if (!load || asked.current.has(dir)) return
    asked.current.add(dir)
    setReads((m) => new Map(m).set(dir, 'loading'))
    load(dir).then(
      (entries) => {
        setLoaded((l) => put(l, dir, entries))
        setReads((m) => {
          const next = new Map(m)
          next.delete(dir)
          return next
        })
      },
      (e: unknown) => {
        asked.current.delete(dir)
        setReads((m) => new Map(m).set(dir, { error: e instanceof Error ? e.message : 'Could not read this folder' }))
      },
    )
  }

  // The root, and every folder above the chosen file, as soon as there is a
  // way to read them. Revealing the selection is the tree's job: a file opened
  // from elsewhere must not be "selected" inside a folder nobody opened.
  useEffect(() => {
    if (!load) return
    read('')
    for (const dir of value ? ancestors(value) : []) read(dir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, value])

  useEffect(() => {
    if (!value) return
    const reveal = ancestors(value)
    if (reveal.length) setOpen((o) => (reveal.every((d) => o.has(d)) ? o : new Set([...o, ...reveal])))
  }, [value])

  const list = useMemo(() => rows(listing, open), [listing, open])
  const at = Math.min(focus, Math.max(list.length - 1, 0))

  const toggle = (dir: string) => {
    const opening = !open.has(dir)
    setOpen((o) => {
      const next = new Set(o)
      if (opening) next.add(dir)
      else next.delete(dir)
      return next
    })
    if (opening) read(dir)
  }

  const keyed = (e: KeyboardEvent) => {
    const move = step(list, at, e.key)
    if (!move) return
    e.preventDefault()
    if (move.toggle) toggle(move.toggle)
    if (move.pick) onSelect?.(move.pick)
    setFocus(move.focus)
    items.current[move.focus]?.focus()
  }

  const root = reads.get('')
  if (list.length === 0) {
    return (
      <YStack {...slot('file-tree')} flex={1} minH={0} items="center" justify="center" p="$4" {...rest}>
        <SizableText size="$2" color="$soft" text="center">
          {root === 'loading'
            ? 'Reading files…'
            : root && typeof root === 'object'
              ? root.error
              : (empty ?? 'No files yet.')}
        </SizableText>
      </YStack>
    )
  }

  return (
    <ScrollView {...slot('file-tree')} flex={1} minH={0} {...(rest as object)}>
      <YStack role="tree" aria-label={label} py="$1.5" px="$1.5" onKeyDown={keyed as never}>
        {list.map((row, index) => (
          <Item
            key={`${row.kind}:${row.path}`}
            row={row}
            index={index}
            size={list.length}
            focused={index === at}
            chosen={row.kind === 'file' && row.path === value}
            state={row.kind === 'dir' && row.open ? reads.get(row.path) : undefined}
            onRef={(el) => {
              items.current[index] = el
            }}
            onPress={() => {
              setFocus(index)
              if (row.kind === 'dir') toggle(row.path)
              else onSelect?.(row.path)
            }}
          />
        ))}
      </YStack>
    </ScrollView>
  )
}

function Item({
  row,
  index,
  size,
  focused,
  chosen,
  state,
  onRef,
  onPress,
}: {
  row: Row
  index: number
  size: number
  focused: boolean
  chosen: boolean
  state?: Read
  onRef: (el: HTMLElement | null) => void
  onPress: () => void
}) {
  const dir = row.kind === 'dir'
  return (
    <>
      <XStack
        ref={onRef as never}
        role="treeitem"
        aria-level={row.depth + 1}
        aria-setsize={size}
        aria-posinset={index + 1}
        aria-selected={chosen}
        {...(dir ? { 'aria-expanded': row.open } : null)}
        tabIndex={focused ? 0 : -1}
        onPress={onPress}
        items="center"
        gap="$1.5"
        minH={28}
        pr="$2"
        rounded="$3"
        cursor="pointer"
        bg={chosen ? '$raised' : 'transparent'}
        hoverStyle={{ bg: chosen ? '$raised' : '$hover' }}
        focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$rim', outlineOffset: -2 }}
        style={{ paddingLeft: 8 + row.depth * 12 }}
        {...({ 'data-path': row.path } as object)}
      >
        {dir ? (
          <>
            {row.open ? <ChevronDown size={13} opacity={0.6} /> : <ChevronRight size={13} opacity={0.6} />}
            {row.open ? <FolderOpen size={14} /> : <Folder size={14} />}
          </>
        ) : (
          <XStack pl={17} items="center">
            {glyph(row.name)}
          </XStack>
        )}
        <SizableText size="$2" color={chosen || dir ? '$ink' : '$quiet'} numberOfLines={1} flex={1} minW={0}>
          {row.name}
        </SizableText>
      </XStack>
      {state ? (
        <SizableText
          size="$1"
          color={state === 'loading' ? '$soft' : '$bad'}
          style={{ paddingLeft: 8 + (row.depth + 1) * 12 + 17 }}
          py="$1"
          aria-live="polite"
        >
          {state === 'loading' ? 'Reading…' : state.error}
        </SizableText>
      ) : null}
    </>
  )
}
