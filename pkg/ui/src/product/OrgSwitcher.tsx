'use client'

/**
 * OrgSwitcher — the Vercel-style org/team switcher, hoisted from the console
 * (hanzoai/ui#36) onto @hanzo/gui primitives. Shows the org the surface is
 * scoped to, switches between the orgs the caller can see, and creates one.
 *
 * Host-agnostic: the LIST is a lazy, paged loader the host injects (IAM
 * `get-organizations` behind its own proxy) — one page at a time, the search
 * term pushed to the server, more on demand (scroll + "Load more"), so it
 * scales to thousands of orgs. No loader → the current org alone, synthesized
 * from the scope (never fabricated). Selecting re-scopes IN PLACE via
 * `scope.switchOrg` (persist + reload → every module refetches under the new
 * `X-Org-Id`). Create posts through the injected hook, then scopes into the
 * new org.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button, Input, Popover, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { Check, ChevronsUpDown, LayoutGrid, Plus, Search } from '@hanzogui/lucide-icons-2'

import { useEmit } from './instrument'
import { MenuRow } from './MenuRow'
import { OrgMark } from './OrgMark'
import { filterOrgs, type Org, type OrgScope } from './scope'

const titleCase = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export type OrgSwitcherProps = {
  /** The active-org contract (see `orgScope`). */
  scope: OrgScope
  /**
   * Lazy paged org list: 0-based page + server-pushed search → one page of
   * rows. A full page (=== pageSize) implies another. Omit when the caller
   * can only see its own org.
   */
  orgs?: (page: number, query: string) => Promise<Org[]>
  /** Rows per page the loader returns. Default 20. */
  pageSize?: number
  /**
   * The org the surface is scoped to, already resolved (display name + logo).
   * Omit and the trigger synthesizes it from the scope id alone — enough to name
   * the org, but it cannot know a logo. Pass it wherever the host already
   * resolves the org, so the switcher and the chrome's org mark agree.
   */
  current?: Org
  /** Create-org hook → the created org's id; omit to hide the affordance. */
  create?: (name: string) => Promise<string>
  /** Show the "All organizations" de-scope row (`scope.leaveOrg`). */
  picker?: boolean
  /**
   * Which way the panel opens. `up` for a switcher sitting in a bottom identity
   * bar, where a downward panel would open off the bottom of the viewport —
   * hanzo.app kept a whole local copy of this component for want of this one
   * prop.
   */
  direction?: 'down' | 'up'
  /**
   * Rows below the list, above the create/de-scope affordances — the surface's
   * own additions (a personal-workspace badge, a link into org settings). The
   * other half of what hanzo.app's local copy existed for.
   *
   * Given a function it receives `close`, so a row that acts IN PLACE — picking
   * a project rather than navigating away — can dismiss the sheet it was chosen
   * from. A row that navigates does not need it; a row that does not, does.
   */
  footer?: ReactNode | ((close: () => void) => ReactNode)
  /**
   * The second line of the trigger, when the caller scopes below the org — a
   * project, an environment. The console kept a whole local copy of this
   * component because its trigger has to say "Org / project" and this one could
   * only say the org; a caller that scopes deeper has to be able to name where
   * it is, or it grows a second control beside this one saying the other half.
   */
  sub?: string
  /**
   * The accessible name, when the control does more than switch organization
   * (a caller passing `sub` is also switching what `sub` names). Defaults to
   * "<org> · switch organization".
   */
  aria?: string
  /**
   * Whether the list can be searched. Defaults to "whenever there is a loader",
   * because a loader is what makes a list longer than the rows on screen.
   *
   * It is separate from the loader because the two answer different questions —
   * whether a list can be FETCHED, and whether searching it can change the
   * answer. The console fetches for everyone and offers the field only to a
   * platform admin, whose list is cross-tenant, server-paged and far longer than
   * one page; a customer has one org, and a field promising a list that does not
   * exist is worse than no field.
   */
  search?: boolean
  /** What to call the list, for a sheet that answers more than one question. */
  heading?: string
  /** `data-testid` on the trigger. */
  testId?: string
  /** Classes for the sheet — the host's own material (glass, elevation). */
  className?: string
  /** Inline style for the sheet — a host's stacking layer belongs here. */
  style?: CSSProperties
}

export function OrgSwitcher({
  scope,
  orgs,
  pageSize = 20,
  current: given,
  create,
  picker = false,
  direction = 'down',
  footer,
  sub,
  aria,
  search,
  heading,
  testId,
  className,
  style,
}: OrgSwitcherProps) {
  const currentId = scope.currentOrg()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [rows, setRows] = useState<Org[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const pageRef = useRef(0)
  const reqRef = useRef(0) // race token — a newer request supersedes older ones

  // Debounce the search so type-as-you-search re-hits the server at most ~4×/s.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(id)
  }, [query])

  const fetchPage = useCallback(
    async (page: number, q: string, append: boolean) => {
      if (!orgs) return
      const token = ++reqRef.current
      append ? setLoadingMore(true) : setLoading(true)
      try {
        const incoming = await orgs(page, q)
        if (token !== reqRef.current) return
        pageRef.current = page
        setRows((prev) => {
          const merged = append ? [...prev] : []
          const seen = new Set(merged.map((o) => o.name))
          for (const o of incoming) if (!seen.has(o.name)) merged.push(o)
          return merged
        })
        setHasMore(incoming.length >= pageSize)
      } catch {
        // Honest empty / keep what's shown — never a fabricated list.
        if (token !== reqRef.current) return
        if (!append) setRows([])
        setHasMore(false)
      } finally {
        if (token === reqRef.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [orgs, pageSize],
  )

  // (Re)load page 0 when the popover opens or the debounced query changes.
  useEffect(() => {
    if (!open || !orgs) return
    void fetchPage(0, debounced, false)
  }, [open, debounced, fetchPage, orgs])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return
    void fetchPage(pageRef.current + 1, debounced, true)
  }, [loading, loadingMore, hasMore, debounced, fetchPage])

  // Rows to render — the loaded list (client-filtered too), else the current
  // org synthesized from the scope.
  const visible: Org[] = useMemo(() => {
    if (orgs) return filterOrgs(rows, query)
    return [{ name: currentId, displayName: titleCase(currentId) }]
  }, [orgs, rows, query, currentId])

  // The host's resolved org wins (it alone can carry the logo), then the loaded
  // row, then a name synthesized from the scope id — never nothing.
  const current: Org = useMemo(() => {
    if (given && given.name === currentId) return given
    return rows.find((o) => o.name === currentId) ?? { name: currentId, displayName: titleCase(currentId) }
  }, [given, rows, currentId])
  const currentLabel = current.displayName || titleCase(current.name)

  const track = useEmit()

  const select = useCallback(
    (org: string) => {
      track({ component: 'OrgSwitcher', action: 'select', id: org })
      setOpen(false)
      scope.switchOrg(org)
    },
    [scope, track],
  )

  const submitCreate = async () => {
    const name = newName.trim()
    if (!name || !create) return
    setBusy(true)
    setErr(null)
    try {
      const org = await create(name)
      scope.switchOrg(org)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create the organization.')
      setBusy(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} placement={direction === 'up' ? 'top-start' : 'bottom-start'}>
      <Popover.Trigger asChild>
        {/* Sized as the PEER of the account control — same height, same mark,
            same type, same hit area — so "which workspace" and "who I am" read
            as the two halves of one identity, not a caption over a control. */}
        <Button
          chromeless
          height={44}
          px="$2"
          justify="flex-start"
          data-testid={testId}
          aria-label={aria ?? `${currentLabel} · switch organization`}
        >
          <XStack items="center" gap="$2.5" flex={1} minW={0}>
            <OrgMark org={current} size={30} />
            {/* One line when the control names only an org; two when a caller
                also scopes BELOW it — a project, an environment — because the
                trigger then has to answer "where am I" completely, and a second
                control for the second half would be a second place to look. */}
            <YStack flex={1} minW={0}>
              <Text minW={0} fontSize="$4" fontWeight="800" color="$color12" numberOfLines={1}>
                {currentLabel}
              </Text>
              {sub ? (
                <Text minW={0} fontSize="$1" color="$color10" numberOfLines={1}>
                  {sub}
                </Text>
              ) : null}
            </YStack>
            <ChevronsUpDown size={16} color="$color9" />
          </XStack>
        </Button>
      </Popover.Trigger>
      {/* The panel's horizontal padding is a GUTTER, not an indent: every row
          inside already pads `$2`, so padding the sheet by the same step again
          put the content two steps off both edges and left the sheet reading as
          a frame around a narrower menu. `$1` is the gap a row's hover pill
          needs to not touch the edge; the row still owns the content inset. */}
      <Popover.Content
        role="menu"
        /* borderWidth/elevation, NOT bordered/elevate. Popover.Content
           declares neither -- gui has them only on Tabs -- and gui DROPS an
           unrecognised prop without a word, so this panel rendered with no
           border and no shadow in every consumer: console, hanzo.app, chat and
           platform. Measured: computed border-left-width 0px while px and bg
           applied normally, and React logged "Received true for a non-boolean
           attribute bordered". The siblings in this package have always used
           borderWidth={1}. */
        borderWidth={1}
        elevation="$2"
        px="$1"
        py="$1"
        width={300}
        bg="$color2"
        borderColor="$borderColor"
        className={className}
        style={style}
      >
        {creating ? (
          <YStack gap="$2">
            <Text fontSize="$2" color="$color12" fontWeight="700">
              Create organization
            </Text>
            <Input
              size="$3"
              placeholder="Organization name"
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              onSubmitEditing={() => void submitCreate()}
            />
            {err ? (
              <Text fontSize="$1" color="$red10">
                {err}
              </Text>
            ) : null}
            <XStack gap="$2" justify="flex-end">
              <Button size="$2" chromeless onPress={() => setCreating(false)} disabled={busy}>
                Cancel
              </Button>
              <Button
                size="$2"
                onPress={() => void submitCreate()}
                disabled={busy || !newName.trim()}
                icon={busy ? <Spinner size="small" /> : <Plus size={14} />}
              >
                Create
              </Button>
            </XStack>
          </YStack>
        ) : (
          <YStack gap="$1">
            {heading ? (
              <Text px="$2" py="$1" fontSize="$1" color="$color10" fontWeight="500">
                {heading}
              </Text>
            ) : null}

            {search ?? !!orgs ? (
              <XStack items="center" gap="$2" px="$2" py="$1" rounded="$3" borderWidth={1} borderColor="$borderColor">
                <Search size={13} opacity={0.6} />
                <Input
                  flex={1}
                  size="$2"
                  borderWidth={0}
                  bg="transparent"
                  placeholder="Find an organization"
                  aria-label="Find an organization"
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </XStack>
            ) : null}

            <div
              style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
              onScroll={(e) => {
                const el = e.currentTarget
                if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) loadMore()
              }}
            >
              {loading ? (
                <XStack items="center" gap="$2" px="$2" py="$3">
                  <Spinner size="small" color="$color11" />
                  <Text fontSize="$2" color="$color10">
                    Loading organizations…
                  </Text>
                </XStack>
              ) : visible.length === 0 ? (
                <Text px="$2" py="$2" fontSize="$2" color="$color10">
                  {query.trim() ? `No organizations match “${query.trim()}”.` : 'No organizations yet.'}
                </Text>
              ) : (
                // A set of organizations exactly one of which holds is a
                // `radiogroup` of `radio`s — not a bag of divs, which is what
                // assistive tech was being handed. `radio` rather than the more
                // obvious `option` because @hanzo/gui's `role` union is React
                // Native's accessibility-role set: it admits `option` but NOT
                // `listbox`, so an `option` here could never be given the parent
                // ARIA requires.
                <YStack role="radiogroup" aria-label="Organizations" gap="$1">
                  {visible.map((org) => (
                    <MenuRow
                      key={org.name}
                      label={org.displayName || org.name}
                      icon={<OrgMark org={org} />}
                      active={org.name === currentId}
                      onPress={() => select(org.name)}
                    />
                  ))}
                </YStack>
              )}

              {loadingMore ? (
                <XStack items="center" gap="$2" px="$2" py="$2">
                  <Spinner size="small" color="$color11" />
                  <Text fontSize="$1" color="$color10">
                    Loading more…
                  </Text>
                </XStack>
              ) : hasMore ? (
                <XStack onPress={loadMore} cursor="pointer" items="center" justify="center" px="$2" py="$1.5" rounded="$3" hoverStyle={{ bg: '$color4' }}>
                  <Text fontSize="$1" color="$color11" fontWeight="600">
                    Load more
                  </Text>
                </XStack>
              ) : null}
            </div>

            {typeof footer === 'function' ? footer(() => setOpen(false)) : footer}

            {create ? (
              <XStack
                role="menuitem"
                onPress={() => {
                  setCreating(true)
                  setErr(null)
                }}
                cursor="pointer"
                items="center"
                gap="$2.5"
                px="$2"
                py="$2"
                mt="$1"
                rounded="$3"
                borderTopWidth={1}
                borderColor="$borderColor"
                hoverStyle={{ bg: '$color5' }}
              >
                <YStack width={22} height={22} rounded="$3" bg="$color3" items="center" justify="center">
                  <Plus size={14} />
                </YStack>
                <Text fontSize="$2" color="$color12">
                  Create organization
                </Text>
              </XStack>
            ) : null}

            {picker ? (
              <XStack
                role="menuitem"
                onPress={() => {
                  setOpen(false)
                  scope.leaveOrg()
                }}
                cursor="pointer"
                items="center"
                gap="$2.5"
                px="$2"
                py="$2"
                rounded="$3"
                hoverStyle={{ bg: '$color5' }}
              >
                <YStack width={22} height={22} rounded="$3" bg="$color3" items="center" justify="center">
                  <LayoutGrid size={14} />
                </YStack>
                <Text fontSize="$2" color="$color12">
                  All organizations
                </Text>
              </XStack>
            ) : null}
          </YStack>
        )}
      </Popover.Content>
    </Popover>
  )
}
