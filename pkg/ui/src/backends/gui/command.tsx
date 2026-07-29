'use client'

/**
 * Command — the filterable command palette, native to gui.
 *
 * cmdk is gone. What it gave us was one thing: a list whose items each know
 * whether they match the current search, plus a cursor that walks the ones that
 * do. That is a small state machine over VALUES (a search string, a registry of
 * item values, a selected value) — it does not need a DOM, so it works the same
 * on web, native and desktop.
 *
 * Two decisions carry the whole file:
 *
 *  • Filtered-out items are HIDDEN (`display="none"`), never unmounted. `display`
 *    is a real Yoga property, so this is one behaviour on both platforms — and
 *    because items stay mounted, registration order is fixed at first mount and
 *    stays true to source order. Arrow-key traversal therefore needs no DOM query.
 *  • An item registers a mutable REF of itself, not a snapshot. Inline props
 *    (`keywords={['a']}`, `onSelect={() => …}`) change identity every render;
 *    registering the ref means the registry is always fresh without an effect
 *    that re-fires forever.
 *
 * Keyboard navigation is web-only by construction (`isWeb` guards `onKeyDown`);
 * on touch the list is driven by press, which is the native idiom anyway.
 */
import {
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ComponentProps,
  type ComponentRef,
  type ReactNode,
} from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  Input,
  ListItem,
  ScrollView,
  Separator,
  SizableText,
  VisuallyHidden,
  XStack,
  YStack,
  isWeb,
} from '@hanzo/gui'
import { Search as SearchIcon } from '@hanzogui/lucide-icons-2'

import { score, step, type CommandFilter } from './command.logic'

export type { CommandFilter }

/** The one touch-target floor. A palette row IS the target, so it is its height. */
const TOUCH = 44

/** Falls back to the item's rendered text when no explicit `value` is given. */
const textOf = (node: ReactNode): string =>
  typeof node === 'string' || typeof node === 'number'
    ? String(node)
    : Array.isArray(node)
      ? node.map(textOf).filter(Boolean).join(' ')
      : isValidElement<{ children?: ReactNode }>(node)
        ? textOf(node.props.children)
        : ''

type Entry = {
  value: string
  keywords?: string[]
  disabled?: boolean
  group?: string
  onSelect?: (value: string) => void
}

type KeyLike = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  preventDefault: () => void
}

type CommandContextValue = {
  search: string
  setSearch: (search: string) => void
  selected: string
  select: (value: string) => void
  register: (id: string, entry: { current: Entry }) => () => void
  touch: () => void
  run: (id: string) => void
  onKey: (e: KeyLike) => void
  shows: (id: string) => boolean
  showsGroup: (group: string) => boolean
  empty: boolean
  disablePointerSelection: boolean
}

const CommandContext = createContext<CommandContextValue | null>(null)
const GroupContext = createContext<string | undefined>(undefined)

const useCommand = () => {
  const ctx = useContext(CommandContext)
  if (!ctx) throw new Error('Command parts must be rendered inside <Command>')
  return ctx
}

export type CommandProps = Omit<ComponentProps<typeof YStack>, 'onSelect'> & {
  /** Selected item value (controlled). */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  filter?: CommandFilter
  shouldFilter?: boolean
  /** Arrow keys wrap around at the ends. */
  loop?: boolean
  label?: string
  /** ctrl/cmd + n/p/j/k also move the cursor. */
  vimBindings?: boolean
  /** Hovering an item no longer selects it. */
  disablePointerSelection?: boolean
}

const Command = forwardRef<ComponentRef<typeof YStack>, CommandProps>(function Command(
  {
    value,
    defaultValue,
    onValueChange,
    filter = score,
    shouldFilter = true,
    loop = false,
    label,
    vimBindings = true,
    disablePointerSelection = false,
    children,
    ...rest
  },
  ref,
) {
  const entries = useRef(new Map<string, { current: Entry }>()).current
  const order = useRef<string[]>([]).current
  const [version, touch] = useReducer((n: number) => n + 1, 0)
  const [search, setSearch] = useState('')
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '')
  const selected = value ?? uncontrolled

  const register = useCallback(
    (id: string, entry: { current: Entry }) => {
      entries.set(id, entry)
      if (!order.includes(id)) order.push(id)
      touch()
      return () => {
        entries.delete(id)
        const at = order.indexOf(id)
        if (at > -1) order.splice(at, 1)
        touch()
      }
    },
    [entries, order],
  )

  // The visible slice, in source order — the single derived value every part reads.
  const visible = useMemo(
    () =>
      order.filter((id) => {
        const entry = entries.get(id)?.current
        return !!entry && (!shouldFilter || filter(entry.value, search, entry.keywords) > 0)
      }),
    // `version` is the registry's revision — the registry itself is a mutable ref.
    [version, order, entries, shouldFilter, filter, search],
  )

  const shown = useMemo(() => new Set(visible), [visible])
  const shownGroups = useMemo(
    () => new Set(visible.map((id) => entries.get(id)?.current.group).filter(Boolean)),
    [visible, entries],
  )

  const select = useCallback(
    (next: string) => {
      if (value === undefined) setUncontrolled(next)
      onValueChange?.(next)
    },
    [value, onValueChange],
  )

  // Keep the cursor on something real: when the selection filters out, take the first hit.
  useEffect(() => {
    if (!visible.length) return
    if (selected && visible.some((id) => entries.get(id)?.current.value === selected)) return
    const first = entries.get(visible[0])?.current.value
    if (first) select(first)
  }, [visible, selected, entries, select])

  const move = useCallback(
    (delta: number) => {
      const reachable = visible.filter((id) => !entries.get(id)?.current.disabled)
      const at = reachable.findIndex((id) => entries.get(id)?.current.value === selected)
      const next = step(reachable.length, at, delta, loop)
      const target = next < 0 ? undefined : entries.get(reachable[next])?.current.value
      if (target) select(target)
    },
    [visible, entries, selected, loop, select],
  )

  const run = useCallback(
    (id: string) => {
      const entry = entries.get(id)?.current
      if (!entry || entry.disabled) return
      select(entry.value)
      entry.onSelect?.(entry.value)
    },
    [entries, select],
  )

  const onKey = useCallback(
    (e: KeyLike) => {
      const mod = vimBindings && (e.ctrlKey || e.metaKey)
      const down = e.key === 'ArrowDown' || (mod && (e.key === 'n' || e.key === 'j'))
      const up = e.key === 'ArrowUp' || (mod && (e.key === 'p' || e.key === 'k'))
      if (down || up) {
        e.preventDefault()
        move(down ? 1 : -1)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const id = visible.find((it) => entries.get(it)?.current.value === selected)
        if (id) run(id)
      }
    },
    [vimBindings, move, visible, entries, selected, run],
  )

  const ctx = useMemo<CommandContextValue>(
    () => ({
      search,
      setSearch,
      selected,
      select,
      register,
      touch,
      run,
      onKey,
      shows: (id) => shown.has(id),
      showsGroup: (group) => shownGroups.has(group),
      empty: visible.length === 0,
      disablePointerSelection,
    }),
    [search, selected, select, register, run, onKey, shown, shownGroups, visible.length, disablePointerSelection],
  )

  return (
    <CommandContext.Provider value={ctx}>
      <YStack
        ref={ref}
        data-slot="command"
        aria-label={label}
        width="100%"
        overflow="hidden"
        rounded="$4"
        bg="$background"
        {...(isWeb ? { onKeyDown: onKey } : null)}
        {...rest}
      >
        {children}
      </YStack>
    </CommandContext.Provider>
  )
})

export type CommandDialogProps = ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
}

const CommandDialog = ({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  ...props
}: CommandDialogProps) => (
  <Dialog modal {...props}>
    <DialogPortal>
      <DialogOverlay key="overlay" bg="rgba(0,0,0,0.5)" />
      <DialogContent key="content" p={0} width="100%" maxW={640} overflow="hidden">
        {/* The accessible name/description live INSIDE the dialog, hidden but read. */}
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </VisuallyHidden>
        <Command>{children}</Command>
      </DialogContent>
    </DialogPortal>
  </Dialog>
)

export type CommandInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChangeText'> & {
  value?: string
  onValueChange?: (search: string) => void
}

const CommandInput = forwardRef<ComponentRef<typeof Input>, CommandInputProps>(
  function CommandInput({ value, onValueChange, placeholder, ...rest }, ref) {
    const { search, setSearch, onKey } = useCommand()

    useEffect(() => {
      if (value !== undefined && value !== search) setSearch(value)
    }, [value, search, setSearch])

    return (
      <XStack
        data-slot="command-input-wrapper"
        items="center"
        gap="$2"
        px="$3"
        minH={TOUCH}
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <SearchIcon size={16} opacity={0.5} />
        <Input
          ref={ref}
          data-slot="command-input"
          unstyled
          flex={1}
          height={TOUCH}
          borderWidth={0}
          bg="transparent"
          color="$color"
          placeholder={placeholder}
          value={value ?? search}
          onChangeText={(next: string) => {
            setSearch(next)
            onValueChange?.(next)
          }}
          {...(isWeb ? { onKeyDown: onKey } : null)}
          {...rest}
        />
      </XStack>
    )
  },
)

export type CommandListProps = ComponentProps<typeof ScrollView>

const CommandList = forwardRef<ComponentRef<typeof ScrollView>, CommandListProps>(
  function CommandList(props, ref) {
    return <ScrollView ref={ref} data-slot="command-list" maxH={300} {...props} />
  },
)

export type CommandEmptyProps = ComponentProps<typeof YStack>

const CommandEmpty = forwardRef<ComponentRef<typeof YStack>, CommandEmptyProps>(
  function CommandEmpty({ children, ...rest }, ref) {
    const { empty } = useCommand()
    if (!empty) return null
    return (
      <YStack ref={ref} data-slot="command-empty" py="$4" items="center" {...rest}>
        {typeof children === 'string' ? (
          <SizableText size="$3" color="$color11">
            {children}
          </SizableText>
        ) : (
          children
        )}
      </YStack>
    )
  },
)

export type CommandGroupProps = ComponentProps<typeof YStack> & { heading?: ReactNode }

const CommandGroup = forwardRef<ComponentRef<typeof YStack>, CommandGroupProps>(
  function CommandGroup({ heading, children, ...rest }, ref) {
    const id = useId()
    const { showsGroup } = useCommand()
    return (
      <GroupContext.Provider value={id}>
        <YStack
          ref={ref}
          data-slot="command-group"
          // Never unmounted: the children must stay registered to stay ordered.
          display={showsGroup(id) ? 'flex' : 'none'}
          p="$1"
          {...rest}
        >
          {heading != null ? (
            <SizableText
              size="$1"
              color="$color11"
              fontWeight="500"
              px="$2"
              py="$1.5"
            >
              {heading}
            </SizableText>
          ) : null}
          {children}
        </YStack>
      </GroupContext.Provider>
    )
  },
)

export type CommandSeparatorProps = ComponentProps<typeof Separator> & {
  /** Keep the rule while a search is active. */
  alwaysRender?: boolean
}

const CommandSeparator = forwardRef<ComponentRef<typeof Separator>, CommandSeparatorProps>(
  function CommandSeparator({ alwaysRender, ...rest }, ref) {
    const { search } = useCommand()
    if (!alwaysRender && search) return null
    return <Separator ref={ref} data-slot="command-separator" {...rest} />
  },
)

export type CommandItemProps = Omit<ComponentProps<typeof ListItem>, 'onSelect' | 'value'> & {
  value?: string
  keywords?: string[]
  disabled?: boolean
  onSelect?: (value: string) => void
}

const CommandItem = forwardRef<ComponentRef<typeof ListItem>, CommandItemProps>(
  function CommandItem({ value, keywords, disabled, onSelect, children, ...rest }, ref) {
    const id = useId()
    const { register, touch, run, select, selected, shows, disablePointerSelection } = useCommand()
    const group = useContext(GroupContext)
    const self = value ?? textOf(children)

    // A ref, not a snapshot — inline `keywords`/`onSelect` change identity every render.
    const entry = useRef<Entry>({ value: self, keywords, disabled, group, onSelect })
    entry.current = { value: self, keywords, disabled, group, onSelect }

    useEffect(() => register(id, entry), [id, register])
    // Only what the filter reads needs to re-derive the visible slice.
    useEffect(touch, [touch, self, disabled, keywords?.join(' ')])

    const isSelected = !!self && selected === self

    return (
      <ListItem
        ref={ref}
        data-slot="command-item"
        data-selected={isSelected}
        data-disabled={!!disabled}
        display={shows(id) ? 'flex' : 'none'}
        disabled={disabled}
        minH={TOUCH}
        gap="$2"
        rounded="$2"
        bg={isSelected ? '$backgroundFocus' : 'transparent'}
        opacity={disabled ? 0.5 : 1}
        onPress={() => run(id)}
        onPointerEnter={disabled || disablePointerSelection ? undefined : () => select(self)}
        {...rest}
      >
        {children}
      </ListItem>
    )
  },
)

/**
 * The trailing key hint. A `<span>` in the shadcn original; `SizableText` is the
 * cross-platform spelling of the same thing (and still renders a span on web).
 */
export type CommandShortcutProps = ComponentProps<typeof SizableText>

const CommandShortcut = (props: CommandShortcutProps) => (
  <SizableText
    data-slot="command-shortcut"
    ml="auto"
    size="$1"
    color="$color11"
    letterSpacing={1.5}
    {...props}
  />
)

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
