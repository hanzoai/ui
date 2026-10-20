'use client'

/**
 * Glyph and IconPicker — a stored icon name, drawn; and the grid a person picks
 * one from.
 *
 * Both load Lucide through ONE dynamic import of @hanzogui/lucide-icons-2
 * (`loadIcons`), so a page that never draws a stored icon pays nothing, and a
 * page that does loads one chunk once: every later Glyph reads the module-level
 * cache and draws on its first render. The name is resolved by `resolveIcon`
 * (icons.ts): a Lucide name, a Tabler name with its pair, a same-name match, or
 * the kind's fallback.
 *
 * The picker is the data-model editor's icon picker (twenty-ui's icon picker,
 * MIT, NOTICE): 176 wide, a search field over the names and the concepts each
 * icon draws, and a grid of 32px cells five across, run by the arrows in two
 * dimensions, Home/End, and Enter. It shows the first 150 matches and says how
 * many more a search would narrow to, rather than mounting 1,760 icons at once.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactElement,
} from 'react'
import { Button } from './button'
import { Density, useDensity } from './density'
import { iconWords, resolveIcon, type IconKind } from './icons'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useOpen } from './search-list'
import { slot } from './slot'

type IconComponent = ComponentType<{ size?: number; color?: string }>
type Icons = { names: ReadonlySet<string>; get: (name: string) => IconComponent | undefined; list: readonly string[] }

let cache: Icons | null = null
let pending: Promise<Icons> | null = null

/** Every Lucide icon, loaded once, by name. */
export function loadIcons(): Promise<Icons> {
  if (cache) return Promise.resolve(cache)
  pending ??= import('@hanzogui/lucide-icons-2').then((mod) => {
    const table = mod as unknown as Record<string, unknown>
    // The barrel exports the icons and nothing else (1,760, each by its name).
    const list = Object.keys(table).filter((k) => /^[A-Z]/.test(k)).sort()
    cache = { names: new Set(list), get: (n) => table[n] as IconComponent | undefined, list }
    return cache
  })
  return pending
}

/** The icon set, once it has loaded (`null` until then). */
export function useIcons(): Icons | null {
  const [icons, setIcons] = useState<Icons | null>(cache)
  useEffect(() => {
    if (icons) return
    let live = true
    loadIcons().then((loaded) => live && setIcons(loaded))
    return () => {
      live = false
    }
  }, [icons])
  return icons
}

export type GlyphProps = {
  /** The stored name: a Lucide name, or a Tabler one from an import. */
  name: string | null | undefined
  /** What it names, which decides the fallback for an unknown name. */
  kind?: IconKind
  size?: number
  color?: string
}

/**
 * A stored icon name, drawn. Holds its box while the set loads, so a row of
 * glyphs does not shift when they arrive; draws nothing (and still holds the
 * box) for a name with no icon and no fallback.
 */
export function Glyph({ name, kind = 'other', size = 16, color }: GlyphProps) {
  const icons = useIcons()
  const resolved = icons ? resolveIcon(name, icons.names, kind) : null
  const Icon = resolved ? icons?.get(resolved) : undefined
  return (
    <XStack {...slot('glyph')} width={size} height={size} items="center" justify="center" shrink={0} aria-hidden>
      {Icon ? <Icon size={size} {...(color ? { color } : null)} /> : null}
    </XStack>
  )
}

const COLUMNS = 5
const CELL = 32
const GAP = 2
const INSET = 4
/** Five cells of 32 with 2 between and 4 round: twenty-ui's 176px picker. */
export const PICKER_W = INSET * 2 + COLUMNS * CELL + (COLUMNS - 1) * GAP
const SHOWN = 150

export type IconPickerProps = {
  /** The chosen icon's stored name. */
  value?: string | null
  onValueChange?: (name: string) => void
  /** What the chosen name is for; its fallback draws the trigger when unknown. */
  kind?: IconKind
  /** Replaces the default trigger (an outline icon button drawing the value). */
  trigger?: ReactElement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The trigger's and the grid's accessible name. */
  label?: string
  searchLabel?: string
  emptyLabel?: string
  disabled?: boolean
}

/** The names a query keeps: every word of it in the name or a concept it draws. */
const filterIcons = (list: readonly string[], q: string): string[] => {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return [...list]
  return list.filter((n) => {
    const hay = iconWords(n)
    return words.every((w) => hay.includes(w))
  })
}

export function IconPicker({
  value,
  onValueChange,
  kind = 'other',
  trigger,
  open: openProp,
  defaultOpen,
  onOpenChange,
  label = 'Icon',
  searchLabel = 'Search icons',
  emptyLabel = 'No icon matches',
  disabled,
}: IconPickerProps) {
  const density = useDensity()
  const [open, setOpen] = useOpen(openProp, defaultOpen, onOpenChange)
  const icons = useIcons()
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const grid = useRef<HTMLElement | null>(null)

  const matches = useMemo(() => (icons ? filterIcons(icons.list, q) : []), [icons, q])
  const shown = matches.slice(0, SHOWN)
  const chosen = icons ? resolveIcon(value, icons.names, kind) : null

  // A fresh open starts on the chosen icon when it is in view, else the first.
  useEffect(() => {
    if (!open) return
    const at = chosen ? shown.indexOf(chosen) : -1
    setCursor(at >= 0 ? at : 0)
    // Only the opening and a new result set reset the cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, q, icons])

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  const pick = (name: string) => {
    onValueChange?.(name)
    setOpen(false)
  }

  const move = (e: KeyboardEvent | { key?: string; preventDefault?: () => void }) => {
    const last = shown.length - 1
    if (last < 0) return
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS }
    let next = cursor
    if (e.key && e.key in step) next = Math.min(last, Math.max(0, cursor + step[e.key]))
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else if (e.key === 'Enter') {
      e.preventDefault?.()
      if (shown[cursor]) pick(shown[cursor])
      return
    } else return
    e.preventDefault?.()
    setCursor(next)
  }

  useEffect(() => {
    const el = grid.current?.querySelector?.(`[data-index="${cursor}"]`) as HTMLElement | null
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [cursor])

  const ActiveIcon = chosen ? icons?.get(chosen) : undefined
  const id = `icon-picker-${useId().replace(/:/g, '')}`

  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom-start">
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            size="icon-sm"
            variant="outline"
            disabled={disabled}
            aria-label={chosen ? `${label}: ${chosen}` : label}
            {...({ 'aria-haspopup': 'listbox' } as object)}
          >
            {ActiveIcon ? <ActiveIcon size={16} /> : <XStack width={16} height={16} />}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent {...slot('icon-picker')} p={0} width={PICKER_W} sideOffset={8} overflow="hidden">
        <Density value={density}>
          <YStack>
            <XStack p={INSET} borderBottomWidth={1} borderColor="$borderColor">
              <Input
                size="xs"
                value={q}
                onChangeText={(t: string) => setQ(t)}
                placeholder={searchLabel}
                aria-label={searchLabel}
                aria-controls={id}
                aria-activedescendant={shown[cursor] ? `${id}-${cursor}` : undefined}
                autoFocus
                {...({ onKeyDown: move } as object)}
              />
            </XStack>
            {!icons ? (
              <SizableText size="$1" color="$hint" p="$2" role="status" aria-live="polite">
                Loading…
              </SizableText>
            ) : shown.length === 0 ? (
              <SizableText size="$1" color="$hint" p="$2" role="status" aria-live="polite">
                {emptyLabel}
              </SizableText>
            ) : (
              <XStack
                ref={grid as never}
                {...slot('icon-picker-grid')}
                {...({ id, role: 'listbox', 'aria-label': label } as object)}
                flexWrap="wrap"
                gap={GAP}
                p={INSET}
                maxH={CELL * 6 + GAP * 5 + INSET * 2}
                overflow="scroll"
              >
                {shown.map((name, i) => {
                  const Icon = icons.get(name)
                  const on = name === chosen
                  return (
                    <XStack
                      key={name}
                      {...({
                        id: `${id}-${i}`,
                        role: 'option',
                        'aria-selected': on,
                        'aria-label': name,
                        'data-index': i,
                        title: name,
                      } as object)}
                      width={CELL}
                      height={CELL}
                      items="center"
                      justify="center"
                      rounded="$xs"
                      cursor="pointer"
                      bg={i === cursor ? '$hover' : on ? '$raised' : 'transparent'}
                      hoverStyle={{ bg: '$hover' }}
                      onPress={() => pick(name)}
                    >
                      {Icon ? <Icon size={16} color={on ? '$ink' : '$aside'} /> : null}
                    </XStack>
                  )
                })}
              </XStack>
            )}
            {icons && matches.length > SHOWN ? (
              <SizableText size="$1" color="$hint" px="$2" pb="$2" role="status" aria-live="polite">
                {`${matches.length - SHOWN} more — type to narrow`}
              </SizableText>
            ) : null}
          </YStack>
        </Density>
      </PopoverContent>
    </Popover>
  )
}
