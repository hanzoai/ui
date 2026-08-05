'use client'

/**
 * Palette — the ⌘K bar, once, for every Hanzo surface.
 *
 * hanzo.app, console and chat each grew their own: three lists of what can be
 * run, all hand-written, already disagreeing with each other and with the API.
 * This is the component half of ending that. The other half is `GET /v1/commands`,
 * which projects every operation the cloud answers out of the one route table —
 * so a surface passes that list in and stops maintaining one.
 *
 * It is composed from `CommandDialog`, not from a hand-rolled Dialog around a
 * bare `Command`. That distinction is the whole history: the stock dialog used to
 * render `<Command>` with none of the palette's props forwarded, so a host could
 * not read the highlighted row and therefore could not draw a preview beside the
 * list — and hanzo.app rebuilt the dialog by hand for exactly that reason. The
 * forwarding landed upstream in this package and named collapsing the hand-rolled
 * palettes as the follow-up. This is that follow-up, so the hand-rolled shape does
 * not come back here under a new name.
 *
 * Props in, callbacks out, like everything else in this layer: no transport, no
 * store, no routing. It does not fetch the commands, does not run them, and does
 * not know what a project or an org is. `onRun` receives the Op and the surface
 * decides whether that means an HTTP call or a function in the page — which is
 * why a route command and a local command are one type (see `match.ts`).
 *
 * The right-hand slot is `children`, and it is why a shared bar costs no surface
 * its personality: hanzo.app keeps its live project preview and console keeps its
 * `>` AI mode by passing them, not by forking this.
 *
 * Filtering is `survivors`. The safe-methods-browse rule, the per-group cap and
 * the empty-query behaviour all live in `match.ts` as pure functions, so
 * `shouldFilter` is off and the Command primitive is left holding the cursor and
 * the view — which is also what makes the rule testable without a DOM.
 */
import { type ReactNode, useMemo, useState } from "react"
import { SizableText, XStack, YStack } from "@hanzo/gui"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../backends/gui"
import { SAFE, survivors, type Op } from "./match"

export type PaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Everything runnable, local commands and route commands alike. */
  ops: Op[]
  /** Run one. The surface decides what running it means. */
  onRun: (op: Op) => void
  /**
   * The highlighted row's id (controlled). A surface drawing a preview beside the
   * list needs to know what is highlighted.
   */
  active?: string
  onActive?: (id: string) => void
  /** The typed query. Uncontrolled unless a surface wants to read it. */
  search?: string
  onSearch?: (search: string) => void
  placeholder?: string
  /** Shown when nothing survives the search. */
  empty?: ReactNode
  /** Rows per group. See `survivors` — a render budget, not a preference. */
  limit?: number
  /** The right-hand panel. Absent, the list takes the full width. */
  children?: ReactNode
  /** The bar along the bottom — key hints, usually. */
  footer?: ReactNode
  /** How tall the list is. It scrolls inside this. */
  height?: number
  /** The dialog's accessible name. */
  title?: string
}

export function Palette({
  open,
  onOpenChange,
  ops,
  onRun,
  active,
  onActive,
  search: controlled,
  onSearch,
  placeholder = "Search commands…",
  empty = "No results found.",
  limit,
  children,
  footer,
  height = 320,
  title = "Search commands",
}: PaletteProps) {
  const [own, setOwn] = useState("")
  const search = controlled ?? own
  const setSearch = (s: string) => {
    setOwn(s)
    onSearch?.(s)
  }

  const groups = useMemo(() => survivors(ops, search, limit), [ops, search, limit])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={placeholder}
      value={active}
      onValueChange={onActive}
      shouldFilter={false}
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder={placeholder}
        color="$color"
        placeholderTextColor="$color11"
      />
      <XStack minH={height}>
        <CommandList
          maxH={height}
          width={children ? "50%" : "100%"}
          borderRightWidth={children ? 1 : 0}
          borderColor="$borderColor"
          py="$1"
        >
          {groups.length === 0 && (
            <CommandEmpty>
              <SizableText color="$color11">{empty}</SizableText>
            </CommandEmpty>
          )}
          {groups.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((op) => (
                <CommandItem key={op.id} value={op.id} onSelect={() => onRun(op)} gap="$2">
                  {op.icon}
                  <SizableText numberOfLines={1}>{op.label}</SizableText>
                  {op.hint ? (
                    <SizableText numberOfLines={1} fontSize="$1" color="$color11">
                      {op.hint}
                    </SizableText>
                  ) : null}
                  <Method of={op} />
                  {op.end}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        {children ? <YStack width="50%">{children}</YStack> : null}
      </XStack>
      {footer ? (
        <XStack
          items="center"
          gap="$4"
          borderTopWidth={1}
          borderColor="$borderColor"
          px="$3"
          py="$2"
        >
          {footer}
        </XStack>
      ) : null}
    </CommandDialog>
  )
}

/**
 * The method, at the end of the row, for route commands only.
 *
 * It is the rule made visible rather than decoration: GET is what you reached by
 * browsing, anything else is what you reached by naming it exactly, and somebody
 * about to press ↵ on `platform apps-rollback` should be able to see which
 * without reading the docs. A local command has no method and gets no tag.
 */
function Method({ of }: { of: Op }) {
  if (of.method === undefined) return null
  return (
    <SizableText
      ml="auto"
      fontFamily="$mono"
      fontSize={10}
      letterSpacing={0.4}
      color={of.method === SAFE ? "$color11" : "$color"}
    >
      {of.method}
    </SizableText>
  )
}
