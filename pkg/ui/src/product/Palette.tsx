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
 * Which rows exist is `rows`. The safe-methods-browse rule, the per-group cap,
 * the empty-query behaviour and the ask row all live in `match.ts` as pure
 * functions, so `shouldFilter` is off and the Command primitive is left holding
 * the cursor and the view — which is also what makes them testable without a
 * DOM. This component renders into a portal, so a test cannot read its rows at
 * all; a rule kept here instead would be a rule nothing can check.
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
import { ASK, SAFE, rows, type Op } from "./match"

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
  /**
   * Take whatever was typed and answer it, when the list cannot.
   *
   * Supplied, the bar ends with one "Ask AI: …" row for any non-empty query, so
   * a search that matches nothing is a question rather than a dead end. Absent,
   * the bar behaves exactly as it did — a surface with nothing to ask does not
   * grow a row that goes nowhere.
   */
  onAsk?: (question: string) => void
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
  onAsk,
}: PaletteProps) {
  const [own, setOwn] = useState("")
  const search = controlled ?? own
  const setSearch = (s: string) => {
    setOwn(s)
    onSearch?.(s)
  }

  const question = search.trim()

  const groups = useMemo(() => rows(ops, search, limit, !!onAsk), [ops, search, limit, onAsk])

  const run = (op: Op) => {
    if (op.id === ASK && onAsk) onAsk(question)
    else onRun(op)
  }

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
        {/* THE LAST ROW MUST BE ABLE TO CLEAR THE BOTTOM EDGE. With equal
            padding top and bottom the scrollable content ended flush with the
            container, so the final row rested sliced against it and no amount of
            scrolling ever showed it whole — the list had nowhere further to go.
            The deeper bottom pad extends the scroll range past the last row,
            so the row can reach a resting place clear of the edge. It reads no
            row height, so it survives a row growing a second line.

            `scrollPaddingBottom` belongs here too — it is the keyboard half,
            parking an arrowed-to row clear of the edge rather than at its first
            visible pixel — but this list is a gui ScrollView and does not take
            it. gui drops an unknown prop silently, so it would have compiled,
            rendered, and done nothing; the type checker is the only reason that
            is written here instead of shipped.

            A JSX comment cannot sit among the attributes below — it is not an
            attribute and the parse fails. */}
        <CommandList
          maxH={height}
          width={children ? "50%" : "100%"}
          borderRightWidth={children ? 1 : 0}
          borderColor="$borderColor"
          pt="$1"
          pb="$4"
        >
          {groups.length === 0 && (
            <CommandEmpty>
              <SizableText color="$color11">{empty}</SizableText>
            </CommandEmpty>
          )}
          {groups.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((op) => (
                <CommandItem key={op.id} value={op.id} onSelect={() => run(op)} gap="$2">
                  {op.icon}
                  {/* The name and its help share one flexible cell, and only the
                      HELP may shrink. A row lays out by distributing slack, so
                      without this the two competed: the name — the thing being
                      searched for, and the thing that has to be read to choose —
                      collapsed to "ap…" while a summary took the rest of the
                      width. It also stops a row with no help from pushing its
                      name to the far right. */}
                  <XStack flex={1} items="center" gap="$2" overflow="hidden">
                    <SizableText numberOfLines={1} shrink={0}>
                      {op.label}
                    </SizableText>
                    {op.hint ? (
                      <SizableText numberOfLines={1} flex={1} fontSize="$1" color="$color11">
                        {op.hint}
                      </SizableText>
                    ) : null}
                  </XStack>
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
      shrink={0}
      fontFamily="$mono"
      fontSize={10}
      letterSpacing={0.4}
      color={of.method === SAFE ? "$color11" : "$color"}
    >
      {of.method}
    </SizableText>
  )
}
