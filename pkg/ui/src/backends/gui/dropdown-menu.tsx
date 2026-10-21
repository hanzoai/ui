"use client"

/**
 * DropdownMenu — the ONE compound menu, native to @hanzo/gui.
 *
 * @hanzogui/menu already ships the whole compound surface (Root/Trigger/Portal/
 * Content/Group/Label/Item/CheckboxItem/RadioGroup/RadioItem/ItemIndicator/
 * Separator/Sub/SubTrigger/SubContent) with the a11y, roving focus, typeahead,
 * popper placement and dismiss behaviour. This file FLATTENS `Menu.X` into the
 * `DropdownMenuX` names, dresses them in the Hanzo tokens, and adds the parts a
 * record surface needs on top of gui's — so there is one menu component rather
 * than two shapes of the same idea.
 *
 * Cross-platform: gui style props only — no Tailwind class strings, no Radix, no
 * DOM APIs outside `isWeb`. Rows are 32px tall (the design density) and
 * `touch()` lifts the real tap target to 44px — on web and Tauri as well as
 * native.
 *
 * `DropdownMenuContent` mounts its OWN `Menu.Portal`, so callers never wrap it —
 * and re-applies, inside the portal, what React context cannot carry across it:
 * the trigger's resolved theme (`PortalTheme`), its density (`Density`) and the
 * menu's page history. gui portals re-root the subtree, so none of the three
 * flows by itself.
 *
 * THE RECORD PARTS (twenty-ui's Dropdown, MIT, NOTICE), re-expressed on gui's
 * Menu rather than on base-ui's:
 *
 *   Search            a borderless field at the top; the app filters. Typing
 *                     stays in the field (gui's typeahead would otherwise take
 *                     the keys), ArrowDown enters the list, ArrowUp from the
 *                     first row comes back, Enter runs the first row.
 *   Section           a padded group with an optional band label, `scrollable`
 *                     capping it at 176px.
 *   SelectionGroup +  single or multiple choice: a radio group of
 *   OptionItem        `menuitemradio`, or `menuitemcheckbox` rows that stay
 *                     open; the indicator a trailing check, a leading box or
 *                     none (the row tints).
 *   Page / Back /     screens inside one popup: only the current page renders,
 *   Header / Title /  an item with `page` opens one, Back returns, and the
 *   Close             history resets when the menu closes.
 *   Empty / Loading   status lines announced politely.
 *   Item `actions`    trailing controls beside a row, shown under the pointer
 *                     or focus (always on touch).
 *
 * Typeahead is gui's own, and its buffer is gui's 1000ms where twenty-ui used
 * 500ms: behaviour comes from the primitive, so the difference is recorded, not
 * reimplemented.
 */
import * as React from "react"
import { Input as GuiInput, Menu, Spinner, Text, XStack, YStack, isWeb, type GuiElement } from "@hanzo/gui"
import { Check, ChevronLeft, ChevronRight, Circle, X } from "@hanzogui/lucide-icons-2"

import { touch } from "./gesture"
import { ink } from "./ink"
import { Density, useDensity } from "./density"
import type { MenuItemSpec } from "../../product/menu/items"
import { MenuRowContent } from "../../product/MenuRow"
import { PortalTheme, useThemeName } from "../../product/menu/portal-theme"

// ── Geometry — literal px on the 8-grid; a 32px row expands to a 44px tap ──────
const ROW_H = 32
const TAP_MIN = 44
const ROW_PX = 8
/** The one menu width floor — the spec form and the compound panel share it. */
const MIN_W = 200
const INSET_PL = 32
const INDICATOR_SLOT = 14
const ICON = 16
/** The panel's own inset; a band, a separator and a header bleed back over it. */
const PAD = 4
/** A scrollable section's ceiling: five and a half rows, so the cut shows there is more. */
const SCROLL_H = 176
/** The search row and the header row, as twenty-ui draws them. */
const SEARCH_H = 36
const HEADER_H = 33
const BAND_H = 20

const panel = {
  bg: "$panel",
  borderColor: "$borderColor",
  borderWidth: 1,
  rounded: "$4",
  p: PAD,
  minW: MIN_W,
  overflow: "hidden",
  shadowColor: "rgba(0,0,0,0.45)",
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
} as const

/**
 * A row. The corner is 4 — the panel's 8 less its 4px inset — so a highlighted
 * row is concentric with the panel it sits in instead of rounder than it; and
 * the highlight is the hover rung, with the press one rung darker.
 */
const row = {
  items: "center",
  gap: ROW_PX,
  px: ROW_PX,
  minH: ROW_H,
  rounded: "$xs",
  select: "none",
  cursor: "pointer",
  ...touch(ROW_H, TAP_MIN, "y"),
  hoverStyle: { bg: "$hover" },
  focusStyle: { bg: "$hover" },
  pressStyle: { bg: "$raised" },
} as const

/** Left indicator well shared by checkbox + radio rows. */
const Indicator = ({ children }: { children: React.ReactNode }) => (
  <XStack
    position="absolute"
    l={ROW_PX}
    width={INDICATOR_SLOT}
    height={INDICATOR_SLOT}
    items="center"
    justify="center"
    pointerEvents="none"
  >
    <Menu.ItemIndicator>{children}</Menu.ItemIndicator>
  </XStack>
)

// ── Root — owns popper geometry and the page history ───────────────────────────
// gui puts `offset` on the Popper ROOT; the compound API puts `sideOffset` on
// Content. One value, one owner: the root holds it, Content publishes into it.
const OffsetContext = /* @__PURE__ */ React.createContext<
  ((n: number) => void) | null
>(null)
/** Alignment travels the same way: gui puts placement on the Popper root. */
type Placement = NonNullable<React.ComponentProps<typeof Menu>['placement']>
const AlignContext = /* @__PURE__ */ React.createContext<
  ((p: Placement | undefined) => void) | null
>(null)

/** The current page and how to move between pages. `null` outside a paged menu. */
type Pages = { page: string | null; go: (id: string) => void; back: () => void; depth: number }
const PagesContext = /* @__PURE__ */ React.createContext<Pages | null>(null)

/**
 * The trigger's offset: 4 on a regular surface, 8 on a compact one — a record
 * menu hangs a little clear of the 32px control it opens from (twenty-front's
 * menus sit 8 below their trigger).
 */
const offsetFor = (density: string) => (density === "compact" ? 8 : 4)

export type DropdownMenuProps = Omit<
  React.ComponentProps<typeof Menu>,
  "offset"
> & {
  offset?: number
  /**
   * Declarative form. Give a `trigger` element and an `items` spec and the menu
   * builds itself out of the very same compound parts a hand-written `children`
   * tree would use — one component, one API, one rendering, whichever form the
   * call site prefers.
   */
  trigger?: React.ReactElement
  items?: MenuItemSpec[]
  minWidth?: number
  maxHeight?: number
  /** The page a paged menu opens on (`DropdownMenuPage id`); history resets to it on close. */
  defaultPage?: string
}

function DropdownMenu({
  offset,
  trigger,
  items,
  minWidth = MIN_W,
  maxHeight,
  defaultPage,
  onOpenChange,
  children,
  ...props
}: DropdownMenuProps) {
  const density = useDensity()
  const initial = offset ?? offsetFor(density)
  const [current, setOffset] = React.useState(initial)
  const [placement, setPlacement] = React.useState<Placement | undefined>(undefined)
  React.useEffect(() => setOffset(initial), [initial])

  const [stack, setStack] = React.useState<string[]>(defaultPage ? [defaultPage] : [])
  const pages = React.useMemo<Pages>(
    () => ({
      page: stack[stack.length - 1] ?? null,
      depth: stack.length,
      go: (id) => setStack((s) => [...s, id]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    }),
    [stack],
  )
  const changed = React.useCallback(
    (open: boolean) => {
      // A menu opens where it was meant to: the history is for one visit.
      if (!open) setStack(defaultPage ? [defaultPage] : [])
      onOpenChange?.(open)
    },
    [defaultPage, onOpenChange],
  )

  return (
    <OffsetContext.Provider value={setOffset}>
      <AlignContext.Provider value={setPlacement}>
        <PagesContext.Provider value={defaultPage ? pages : null}>
          <Menu offset={current} {...(placement ? { placement } : null)} onOpenChange={changed} {...props}>
            {trigger ? (
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            ) : null}
            {items ? (
              <DropdownMenuContent minW={minWidth} maxH={maxHeight}>
                {items.map(renderSpec)}
              </DropdownMenuContent>
            ) : null}
            {children}
          </Menu>
        </PagesContext.Provider>
      </AlignContext.Provider>
    </OffsetContext.Provider>
  )
}

/** One spec row -> the matching compound part, drawn by the one row anatomy. */
const renderSpec = (spec: MenuItemSpec, i: number) => {
  if (spec.type === "separator")
    return <DropdownMenuSeparator key={spec.key ?? `sep-${i}`} />
  if (spec.type === "label")
    return (
      <DropdownMenuLabel key={spec.key ?? `label-${i}`}>
        {spec.label}
      </DropdownMenuLabel>
    )
  return (
    <DropdownMenuItem
      key={spec.key}
      disabled={spec.disabled}
      variant={spec.destructive ? "destructive" : "default"}
      onSelect={spec.onSelect}
      {...(spec.closeOnSelect === false ? { preventCloseOnSelect: true } : null)}
    >
      <MenuRowContent
        label={spec.label}
        sub={spec.description}
        icon={
          spec.icon ? (
            <XStack width={ICON} height={ICON} items="center" justify="center" shrink={0}>
              {spec.icon}
            </XStack>
          ) : undefined
        }
        shortcut={spec.shortcut ? <DropdownMenuShortcut>{spec.shortcut}</DropdownMenuShortcut> : undefined}
        check={!!spec.selected}
        submenu={!!spec.hasSubmenu}
      />
    </DropdownMenuItem>
  )
}

// ── Passthroughs — the gui part already IS the part ─────────────────────────────
const DropdownMenuTrigger: typeof Menu.Trigger = Menu.Trigger
const DropdownMenuGroup: typeof Menu.Group = Menu.Group
const DropdownMenuPortal: typeof Menu.Portal = Menu.Portal
const DropdownMenuSub: typeof Menu.Sub = Menu.Sub
const DropdownMenuRadioGroup: typeof Menu.RadioGroup = Menu.RadioGroup

// ── Content — self-portalling, theme-, density- and page-forwarded ──────────────
type ContentProps = React.ComponentProps<typeof Menu.Content> & {
  sideOffset?: number
  /**
   * Which edge of the panel lines up with the trigger.
   *
   * `end` is what a menu hanging off a right-aligned trigger wants: the panel
   * grows leftward and stays on screen. gui states side and alignment as one
   * floating-ui placement string, so this is that string's suffix — `center`
   * being the plain side with no suffix at all.
   */
  align?: 'start' | 'center' | 'end'
}

/** `align` as the suffix of a floating-ui placement, against the side given. */
const placementFor = (
  side: Placement | undefined,
  align: 'start' | 'center' | 'end' | undefined,
): Placement | undefined => {
  if (!align) return side
  const base = (side?.split('-')[0] ?? 'bottom') as Placement
  return (align === 'center' ? base : `${base}-${align}`) as Placement
}

/** The rows a person can reach in one panel, in order: its own, never a submenu's. */
const reachable = (panelEl: HTMLElement) =>
  [...panelEl.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]')].filter(
    (el) => el.closest('[data-hanzogui-menu-content]') === panelEl && el.getAttribute('aria-disabled') !== 'true' && !el.hasAttribute('data-disabled'),
  )

/** The search field of a panel, when it has one. */
const searchOf = (panelEl: HTMLElement) =>
  panelEl.querySelector<HTMLInputElement>('[data-slot="dropdown-menu-search"] input')

const DropdownMenuContent = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  ContentProps
>(function DropdownMenuContent(
  { sideOffset, align, children, onKeyDown, ...props },
  ref
) {
  const themeName = useThemeName()
  const density = useDensity()
  const pages = React.useContext(PagesContext)
  const setOffset = React.useContext(OffsetContext)
  const setPlacement = React.useContext(AlignContext)
  const offset = sideOffset ?? offsetFor(density)
  React.useEffect(() => setOffset?.(offset), [setOffset, offset])
  React.useEffect(() => setPlacement?.(placementFor(undefined, align)), [setPlacement, align])

  // ArrowUp on the first row hands focus back to the search field above it —
  // gui's roving focus stops at the first row and knows nothing of the field.
  const keys = (e: React.KeyboardEvent<HTMLElement>) => {
    ;(onKeyDown as ((e: unknown) => void) | undefined)?.(e)
    if (!isWeb || e.key !== 'ArrowUp') return
    const panelEl = (e.target as HTMLElement | null)?.closest?.('[data-hanzogui-menu-content]') as HTMLElement | null
    if (!panelEl) return
    const rows = reachable(panelEl)
    const field = searchOf(panelEl)
    if (field && rows[0] && rows[0] === document.activeElement) {
      e.preventDefault()
      field.focus()
    }
  }

  const body = framed(children)
  return (
    <Menu.Portal>
      <PortalTheme name={themeName}>
        <Density value={density}>
          <PagesContext.Provider value={pages}>
            <Menu.Content
              ref={ref}
              data-slot="dropdown-menu-content"
              {...panel}
              {...(body.framed ? { role: 'dialog' as never, 'aria-orientation': undefined, 'data-framed': '' } : null)}
              {...(isWeb ? { onKeyDown: keys as never } : null)}
              {...props}
            >
              <Paged page={pages?.page ?? null}>{body.children}</Paged>
            </Menu.Content>
          </PagesContext.Provider>
        </Density>
      </PortalTheme>
    </Menu.Portal>
  )
})

/** The parts a `menu` may not own: a field and the live status lines. */
const isFree = (c: React.ReactNode) =>
  React.isValidElement(c) && (c.type === DropdownMenuSearch || c.type === DropdownMenuEmpty || c.type === DropdownMenuLoading)

/**
 * A panel holding a search field or a status line is not a bare menu.
 *
 * A `menu` owns items, groups and separators and nothing else, and axe holds
 * the whole subtree to that (`aria-required-children`): a field or a live
 * region inside it fails. So such a panel becomes what it is — a popup with a
 * field, one or more menus of rows, and its status lines — the frame a `dialog`
 * still labelled by its trigger, each run of rows its own `role="menu"`. A panel
 * of rows alone keeps gui's structure untouched. Read off the direct children,
 * the place a Search, an Empty and a Loading belong.
 */
function framed(children: React.ReactNode): { framed: boolean; children: React.ReactNode } {
  const parts = React.Children.toArray(children)
  if (!parts.some(isFree)) return { framed: false, children }
  const out: React.ReactNode[] = []
  let run: React.ReactNode[] = []
  const close = () => {
    if (!run.length) return
    out.push(
      <YStack key={`menu-${out.length}`} role="menu" aria-orientation="vertical" data-slot="dropdown-menu-list">
        {run}
      </YStack>,
    )
    run = []
  }
  for (const part of parts) {
    if (isFree(part)) {
      close()
      out.push(part)
    } else run.push(part)
  }
  close()
  return { framed: true, children: out }
}

/**
 * Moving between pages takes the focus with it: the row that was pressed is
 * gone, and focus left on a removed node falls to the document. The new page's
 * first row (or its search) takes it.
 */
function Paged({ page, children }: { page: string | null; children: React.ReactNode }) {
  const anchor = React.useRef<HTMLElement | null>(null)
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!isWeb) return
    const panelEl = anchor.current?.closest?.('[data-hanzogui-menu-content]') as HTMLElement | null
    if (!panelEl) return
    const frame = requestAnimationFrame(() => (searchOf(panelEl) ?? reachable(panelEl)[0])?.focus())
    return () => cancelAnimationFrame(frame)
  }, [page])
  return (
    <>
      {isWeb ? <span ref={anchor as never} hidden data-slot="dropdown-menu-anchor" /> : null}
      {children}
    </>
  )
}

/**
 * A submenu stands in a portal of its own, as the menu does, so it opens over
 * every pane rather than inside the menu that opened it: drawn in place, the
 * menu's `overflow: hidden` (the corner the rows are cut to) clipped it to
 * nothing, and a pane beside the menu stood over it. The portal's host takes no
 * pointer, so the panel takes it back.
 */
const DropdownMenuSubContent = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof Menu.SubContent>
>(function DropdownMenuSubContent(props, ref) {
  const themeName = useThemeName()
  const density = useDensity()
  return (
    <Menu.Portal>
      <PortalTheme name={themeName}>
        <Density value={density}>
          <Menu.SubContent
            ref={ref}
            data-slot="dropdown-menu-sub-content"
            {...panel}
            pointerEvents="auto"
            {...props}
          />
        </Density>
      </PortalTheme>
    </Menu.Portal>
  )
})

// ── Rows ────────────────────────────────────────────────────────────────────────
type ItemProps = Omit<React.ComponentProps<typeof Menu.Item>, "variant"> & {
  inset?: boolean
  variant?: "default" | "destructive"
  /** Opens this page of the menu instead of closing it, with a trailing chevron. */
  page?: string
  /**
   * Trailing controls beside the row — edit, remove, pin. They sit OUTSIDE the
   * menu item (a control inside a `menuitem` is a nested interactive), 8px from
   * it, shown under the pointer or while the row has focus, always on touch.
   */
  actions?: React.ReactNode
  actionsVisibility?: "hover" | "always"
}

const DropdownMenuItem = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  ItemProps
>(function DropdownMenuItem(
  { inset, variant = "default", disabled, page, actions, actionsVisibility = "hover", onSelect, children, ...props },
  ref
) {
  const pages = React.useContext(PagesContext)
  const [shown, setShown] = React.useState(false)
  const opens = page !== undefined && pages !== null
  const item = (
    <Menu.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      disabled={disabled}
      {...row}
      pl={inset ? INSET_PL : ROW_PX}
      theme={variant === "destructive" ? "red" : undefined}
      opacity={disabled ? 0.5 : 1}
      cursor={disabled ? "default" : "pointer"}
      {...(actions ? { flex: 1, onFocus: () => setShown(true), onBlur: () => setShown(false) } : null)}
      onSelect={(e: Event) => {
        if (page !== undefined && pages) {
          e.preventDefault?.()
          pages.go(page)
        }
        onSelect?.(e)
      }}
      {...props}
    >
      {/* A string label is set here, in the 13px row text the declarative rows
          already use — gui's own wrap gave it the body default, a size larger
          than every other row. And it is ONE child: gui leaves an array alone,
          so a label beside a `null` became a bare text node inside a View, an
          error on web and a crash on native. */}
      {opens ? (
        <>
          {ink(children, Text as never, { fontSize: '$2' })}
          <ChevronRight size={ICON - 2} ml="auto" color="$hush" />
        </>
      ) : (
        ink(children, Text as never, { fontSize: '$2' })
      )}
    </Menu.Item>
  )
  if (!actions) return item
  const visible = actionsVisibility === "always" || shown
  return (
    <XStack
      data-slot="dropdown-menu-item-row"
      items="center"
      gap={ROW_PX}
      onHoverIn={() => setShown(true)}
      onHoverOut={() => setShown(false)}
    >
      {item}
      <XStack
        data-slot="dropdown-menu-item-actions"
        // A menu owns groups, not buttons: the controls beside a row are a group.
        role="group"
        shrink={0}
        items="center"
        gap={2}
        opacity={visible ? 1 : 0}
        $touchable={{ opacity: 1 }}
        animation="75ms"
      >
        {/* Each control is an action of the menu to assistive tech: a button
            inside a menu's group must say it is a menu item. */}
        {React.Children.map(actions, (a) =>
          React.isValidElement(a) && (a.props as { role?: string }).role == null
            ? React.cloneElement(a as React.ReactElement<{ role?: string }>, { role: "menuitem" })
            : a,
        )}
      </XStack>
    </XStack>
  )
})

const DropdownMenuCheckboxItem = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof Menu.CheckboxItem>
>(function DropdownMenuCheckboxItem({ children, checked, ...props }, ref) {
  return (
    <Menu.CheckboxItem
      ref={ref}
      data-slot="dropdown-menu-checkbox-item"
      checked={checked}
      {...row}
      pl={INSET_PL}
      {...props}
    >
      <Indicator>
        <Check size={ICON} />
      </Indicator>
      {children}
    </Menu.CheckboxItem>
  )
})

const DropdownMenuRadioItem = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof Menu.RadioItem>
>(function DropdownMenuRadioItem({ children, value, ...props }, ref) {
  return (
    <Menu.RadioItem
      ref={ref}
      value={value}
      data-slot="dropdown-menu-radio-item"
      {...row}
      pl={INSET_PL}
      {...props}
    >
      <Indicator>
        <Circle size={8} fill="currentColor" />
      </Indicator>
      {children}
    </Menu.RadioItem>
  )
})

const DropdownMenuSubTrigger = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof Menu.SubTrigger> & { inset?: boolean }
>(function DropdownMenuSubTrigger({ inset, children, ...props }, ref) {
  return (
    <Menu.SubTrigger
      ref={ref}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      {...row}
      pl={inset ? INSET_PL : ROW_PX}
      {...props}
    >
      {children}
      <ChevronRight size={ICON} ml="auto" opacity={0.6} />
    </Menu.SubTrigger>
  )
})

// ── Selection — one value, or a set, owned by its group ───────────────────────────
type Selection = {
  multiple: boolean
  closeOnSelect: boolean
  has: (value: string) => boolean
  toggle: (value: string) => void
}
const SelectionContext = /* @__PURE__ */ React.createContext<Selection | null>(null)

export type DropdownMenuSelectionGroupProps = {
  /** One value (`string | null`) or, with `multiple`, a list. */
  value?: string | string[] | null
  defaultValue?: string | string[] | null
  onValueChange?: (value: string | string[] | null) => void
  multiple?: boolean
  /** Whether choosing closes the menu. Default: a single choice closes, a multiple one stays. */
  closeOnSelect?: boolean
  children?: React.ReactNode
}

const asList = (v: string | string[] | null | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v])

function DropdownMenuSelectionGroup({
  value,
  defaultValue = null,
  onValueChange,
  multiple = false,
  closeOnSelect,
  children,
}: DropdownMenuSelectionGroupProps) {
  const [own, setOwn] = React.useState<string[]>(() => asList(defaultValue))
  const chosen = value !== undefined ? asList(value) : own
  const set = (next: string[]) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(multiple ? next : (next[0] ?? null))
  }
  const ctx: Selection = {
    multiple,
    closeOnSelect: closeOnSelect ?? !multiple,
    has: (v) => chosen.includes(v),
    toggle: (v) => set(multiple ? (chosen.includes(v) ? chosen.filter((c) => c !== v) : [...chosen, v]) : [v]),
  }
  return (
    <SelectionContext.Provider value={ctx}>
      {multiple ? (
        <Menu.Group data-slot="dropdown-menu-selection-group">{children}</Menu.Group>
      ) : (
        <Menu.RadioGroup
          data-slot="dropdown-menu-selection-group"
          value={chosen[0] ?? ''}
          onValueChange={(v: string) => set(v ? [v] : [])}
        >
          {children}
        </Menu.RadioGroup>
      )}
    </SelectionContext.Provider>
  )
}

export type DropdownMenuOptionItemProps = Omit<
  React.ComponentProps<typeof Menu.Item>,
  "onSelect" | "children"
> & {
  value: string
  children?: React.ReactNode
  /** `check` after the content (single default), `checkbox` before it (multiple default), `none` tints the chosen row. */
  indicator?: "check" | "checkbox" | "none"
  /** Overrides the group's `closeOnSelect` for this row. */
  closeOnSelect?: boolean
  /** Runs before the choice is made; `preventDefault()` keeps the menu open. */
  onSelect?: (e: Event) => void
}

/** The leading box of a multiple choice: a picture of a checkbox, not a control inside the row. */
const Box = ({ on }: { on: boolean }) => (
  <XStack
    width={INDICATOR_SLOT}
    height={INDICATOR_SLOT}
    shrink={0}
    rounded="$xs"
    borderWidth={1}
    borderColor={on ? ("var(--primary)" as never) : "$bound"}
    bg={on ? ("var(--primary)" as never) : "transparent"}
    items="center"
    justify="center"
  >
    {on ? <Check size={12} strokeWidth={3} color={"var(--primary-foreground)" as never} /> : null}
  </XStack>
)

const DropdownMenuOptionItem = /* @__PURE__ */ React.forwardRef<GuiElement, DropdownMenuOptionItemProps>(
  function DropdownMenuOptionItem({ value, indicator, closeOnSelect, onSelect, children, disabled, ...props }, ref) {
    const group = React.useContext(SelectionContext)
    const multiple = group?.multiple ?? false
    const on = group?.has(value) ?? false
    const mark = indicator ?? (multiple ? "checkbox" : "check")
    const closes = closeOnSelect ?? group?.closeOnSelect ?? !multiple
    const body = (
      <>
        {mark === "checkbox" ? <Box on={on} /> : null}
        {typeof children === "string" ? (
          <Text fontSize="$2" color="$aside" numberOfLines={1} flex={1} minW={0}>
            {children}
          </Text>
        ) : (
          children
        )}
        {mark === "check" && on ? <Check size={ICON} strokeWidth={2} ml="auto" /> : null}
      </>
    )
    const shared = {
      ref,
      "data-slot": "dropdown-menu-option-item",
      "data-indicator": mark,
      disabled,
      ...row,
      ...(mark === "none" && on ? { bg: "$hover" as const } : null),
      opacity: disabled ? 0.5 : 1,
      preventCloseOnSelect: !closes,
      onSelect,
      ...props,
    }
    if (multiple)
      return (
        <Menu.CheckboxItem {...(shared as object)} checked={on} onCheckedChange={() => group?.toggle(value)}>
          {body}
        </Menu.CheckboxItem>
      )
    return (
      <Menu.RadioItem {...(shared as object)} value={value}>
        {body}
      </Menu.RadioItem>
    )
  },
)

// ── Search, sections and labels ─────────────────────────────────────────────────
export type DropdownMenuSearchProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  /** Take focus when the panel opens. Default true: a search menu is typed into. */
  autoFocus?: boolean
  "aria-label"?: string
}

/**
 * The search row. The keys a field needs stay in it — gui's typeahead listens on
 * the whole panel and would move focus to a matching row on the first letter —
 * and the three that belong to the list leave it: ArrowDown enters the list,
 * Enter runs the first row (respecting an open IME composition), Escape closes.
 */
function DropdownMenuSearch({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Search",
  autoFocus = true,
  "aria-label": label,
}: DropdownMenuSearchProps) {
  const field = React.useRef<HTMLInputElement | null>(null)
  React.useEffect(() => {
    if (!autoFocus || !isWeb) return
    // After gui's own open focus, which lands on the panel a frame after mount.
    const frame = requestAnimationFrame(() => {
      const t = setTimeout(() => field.current?.focus(), 0)
      cleanup = () => clearTimeout(t)
    })
    let cleanup = () => {}
    return () => {
      cancelAnimationFrame(frame)
      cleanup()
    }
  }, [autoFocus])
  const keys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" || e.key === "Tab") return
    const panelEl = e.currentTarget.closest("[data-hanzogui-menu-content]") as HTMLElement | null
    if (e.key === "ArrowDown") {
      e.preventDefault()
      e.stopPropagation()
      if (panelEl) reachable(panelEl)[0]?.focus()
      return
    }
    if (e.key === "Enter") {
      e.stopPropagation()
      if ((e.nativeEvent as { isComposing?: boolean }).isComposing) return
      e.preventDefault()
      if (panelEl) reachable(panelEl)[0]?.click()
      return
    }
    // Everything else is typing: the field's, not the menu's.
    e.stopPropagation()
  }
  // A direct child of the content, so `framed` seats it beside the rows' menu.
  return (
    <XStack
      data-slot="dropdown-menu-search"
      minH={SEARCH_H}
      items="center"
      px={ROW_PX}
      mx={-PAD}
      mt={-PAD}
      mb={PAD}
      borderBottomWidth={1}
      borderColor="$borderColor"
    >
      <GuiInput
        ref={field as never}
        unstyled
        flex={1}
        minW={0}
        height={20}
        p={0}
        borderWidth={0}
        bg="transparent"
        color="$ink"
        placeholderTextColor="$placeholderColor"
        fontSize="$1"
        aria-label={label ?? placeholder}
        placeholder={placeholder}
        {...(value !== undefined ? { value } : { defaultValue })}
        onChangeText={(t: string) => onValueChange?.(t)}
        {...(isWeb ? { onKeyDown: keys as never } : null)}
        style={{ outlineStyle: "none" }}
      />
    </XStack>
  )
}

export type DropdownMenuSectionProps = React.ComponentProps<typeof YStack> & {
  /** A band naming the section. */
  label?: React.ReactNode
  /** Cap the section at 176px and scroll the rest. */
  scrollable?: boolean
}

function DropdownMenuSection({ label, scrollable = false, children, ...props }: DropdownMenuSectionProps) {
  return (
    <Menu.Group data-slot="dropdown-menu-section" {...(typeof label === "string" ? { "aria-label": label } : null)}>
      {label ? <DropdownMenuLabel variant="band">{label}</DropdownMenuLabel> : null}
      <YStack
        gap={2}
        {...(scrollable
          ? { maxH: SCROLL_H, style: { overflowY: "auto", overscrollBehavior: "contain" } as object }
          : null)}
        {...props}
      >
        {children}
      </YStack>
    </Menu.Group>
  )
}

// ── Pages ───────────────────────────────────────────────────────────────────────
/** One screen of a paged menu. Only the current page renders. */
function DropdownMenuPage({ id, children }: { id: string; children?: React.ReactNode }) {
  const pages = React.useContext(PagesContext)
  if (!pages || pages.page !== id) return null
  return (
    <YStack data-slot="dropdown-menu-page" data-page={id}>
      {children}
    </YStack>
  )
}

const header = {
  minH: HEADER_H,
  items: "center",
  gap: ROW_PX,
  px: ROW_PX,
  mx: -PAD,
  mt: -PAD,
  mb: PAD,
  borderBottomWidth: 1,
  borderColor: "$borderColor",
} as const

/** A static title bar over the page. */
function DropdownMenuHeader({ children, ...props }: React.ComponentProps<typeof XStack>) {
  return (
    <XStack data-slot="dropdown-menu-header" {...header} {...props}>
      {children}
    </XStack>
  )
}

function DropdownMenuTitle({ children, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text data-slot="dropdown-menu-title" fontSize="$2" fontWeight="500" color="$ink" numberOfLines={1} flex={1} {...props}>
      {children}
    </Text>
  )
}

/** The icon-only close in a header. It is a menu item, so choosing it closes as any row does. */
const DropdownMenuClose = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  Omit<React.ComponentProps<typeof Menu.Item>, "children"> & { "aria-label": string }
>(function DropdownMenuClose(props, ref) {
  return (
    <Menu.Item
      ref={ref}
      data-slot="dropdown-menu-close"
      width={24}
      height={24}
      rounded="$xs"
      items="center"
      justify="center"
      cursor="pointer"
      {...touch(24)}
      hoverStyle={{ bg: "$hover" }}
      focusStyle={{ bg: "$hover" }}
      {...props}
    >
      <X size={ICON} color="$aside" />
    </Menu.Item>
  )
})

/** The header row that returns to the page before. */
const DropdownMenuBack = /* @__PURE__ */ React.forwardRef<GuiElement, React.ComponentProps<typeof Menu.Item>>(
  function DropdownMenuBack({ children, onSelect, ...props }, ref) {
    const pages = React.useContext(PagesContext)
    return (
      <Menu.Item
        ref={ref}
        data-slot="dropdown-menu-back"
        {...header}
        rounded={0}
        cursor="pointer"
        hoverStyle={{ bg: "$hover" }}
        focusStyle={{ bg: "$hover" }}
        preventCloseOnSelect
        onSelect={(e: Event) => {
          pages?.back()
          onSelect?.(e)
        }}
        {...props}
      >
        <ChevronLeft size={ICON} color="$aside" />
        {typeof children === "string" ? (
          <Text fontSize="$2" fontWeight="500" color="$ink" numberOfLines={1} flex={1}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Menu.Item>
    )
  },
)

// ── Status lines ────────────────────────────────────────────────────────────────
/**
 * A live line. Placed as a direct child of the content, it sits beside the rows'
 * menu rather than inside it (see `framed`), where a live region may be.
 */
function Status({ slot, children }: { slot: string; children: React.ReactNode }) {
  return (
    <XStack data-slot={slot} role="status" aria-live="polite" items="center" gap={ROW_PX} p={ROW_PX}>
      {children}
    </XStack>
  )
}

/** No row matched, said once and politely. */
function DropdownMenuEmpty({ children = "No results" }: { children?: React.ReactNode }) {
  return (
    <Status slot="dropdown-menu-empty">
      <Text fontSize="$1" color="$aside">
        {children}
      </Text>
    </Status>
  )
}

/** Rows are on their way. */
function DropdownMenuLoading({ children = "Loading" }: { children?: React.ReactNode }) {
  return (
    <Status slot="dropdown-menu-loading">
      {/* The words name the status; the spinner is decoration. */}
      <XStack aria-hidden>
        <Spinner size="small" maxW={14} maxH={14} />
      </XStack>
      <Text fontSize="$1" color="$quiet">
        {children}
      </Text>
    </Status>
  )
}

// ── Static rows ─────────────────────────────────────────────────────────────────
type LabelProps = React.ComponentProps<typeof Menu.Label> & {
  inset?: boolean
  /**
   * `band` is a section's name: 12px quiet text on a strip one rung up from the
   * panel, bled to its edges. The default is the 13px label above a group.
   */
  variant?: "default" | "band"
}

const DropdownMenuLabel = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  LabelProps
>(function DropdownMenuLabel({ inset, variant = "default", ...props }, ref) {
  if (variant === "band")
    return (
      <Menu.Label
        ref={ref}
        data-slot="dropdown-menu-label"
        data-variant="band"
        height={BAND_H}
        lineHeight={BAND_H}
        mx={-PAD}
        px={ROW_PX}
        py={0}
        bg="$hover"
        fontSize="$1"
        fontWeight="400"
        color="$hint"
        select="none"
        {...props}
      />
    )
  return (
    <Menu.Label
      ref={ref}
      data-slot="dropdown-menu-label"
      data-inset={inset}
      px={ROW_PX}
      py={4}
      pl={inset ? INSET_PL : ROW_PX}
      fontSize="$2"
      fontWeight="500"
      color="$ink"
      select="none"
      {...props}
    />
  )
})

/** A hairline between sections, bled to the panel's edges as twenty-ui draws it. */
const DropdownMenuSeparator = /* @__PURE__ */ React.forwardRef<
  GuiElement,
  React.ComponentProps<typeof Menu.Separator>
>(function DropdownMenuSeparator(props, ref) {
  return (
    <Menu.Separator
      ref={ref}
      data-slot="dropdown-menu-separator"
      height={1}
      bg="$borderColor"
      mx={-PAD}
      my={PAD}
      {...props}
    />
  )
})

/** Right-aligned shortcut hint. gui `Text`, not a raw `<span>`, so it renders on native. */
function DropdownMenuShortcut(props: React.ComponentProps<typeof Text>) {
  return (
    <Text
      data-slot="dropdown-menu-shortcut"
      ml="auto"
      fontSize="$1"
      letterSpacing={1}
      color="$quiet"
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuSearch,
  DropdownMenuSection,
  DropdownMenuSelectionGroup,
  DropdownMenuOptionItem,
  DropdownMenuPage,
  DropdownMenuBack,
  DropdownMenuHeader,
  DropdownMenuTitle,
  DropdownMenuClose,
  DropdownMenuEmpty,
  DropdownMenuLoading,
}
