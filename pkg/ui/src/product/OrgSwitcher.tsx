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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, Popover, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { Check, ChevronsUpDown, LayoutGrid, Plus, Search } from '@hanzogui/lucide-icons-2'

import { filterOrgs, type Org, type OrgScope } from './scope'

const titleCase = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const initialsOf = (o: Org) =>
  (o.displayName || o.name)
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** An org's avatar — its logo when set, else a monogram tile. */
function OrgAvatar({ org, size = 22 }: { org: Org; size?: number }) {
  if (org.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={org.logo} alt="" style={{ height: size, width: size, objectFit: 'contain', display: 'block', borderRadius: 6 }} />
  }
  return (
    <YStack width={size} height={size} rounded="$3" bg="$color4" items="center" justify="center">
      <Text fontSize="$1" fontWeight="800" color="$color12">
        {initialsOf(org)}
      </Text>
    </YStack>
  )
}

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
  /** Create-org hook → the created org's id; omit to hide the affordance. */
  create?: (name: string) => Promise<string>
  /** Show the "All organizations" de-scope row (`scope.leaveOrg`). */
  picker?: boolean
}

export function OrgSwitcher({ scope, orgs, pageSize = 20, create, picker = false }: OrgSwitcherProps) {
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

  const current: Org = useMemo(
    () => rows.find((o) => o.name === currentId) ?? { name: currentId, displayName: titleCase(currentId) },
    [rows, currentId],
  )

  const select = useCallback(
    (org: string) => {
      setOpen(false)
      scope.switchOrg(org)
    },
    [scope],
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
    <Popover open={open} onOpenChange={setOpen} placement="bottom-start">
      <Popover.Trigger asChild>
        <Button size="$2" chromeless icon={<OrgAvatar org={current} size={18} />} iconAfter={<ChevronsUpDown size={13} />}>
          {current.displayName || titleCase(current.name)}
        </Button>
      </Popover.Trigger>
      <Popover.Content bordered elevate p="$2" width={300} bg="$color2" borderColor="$borderColor">
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
            {orgs ? (
              <XStack items="center" gap="$2" px="$2" py="$1" rounded="$3" borderWidth={1} borderColor="$borderColor">
                <Search size={13} opacity={0.6} />
                <Input
                  flex={1}
                  size="$2"
                  borderWidth={0}
                  bg="transparent"
                  placeholder="Find organization…"
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
                visible.map((org) => (
                  <XStack
                    key={org.name}
                    onPress={() => select(org.name)}
                    cursor="pointer"
                    items="center"
                    gap="$2.5"
                    px="$2"
                    py="$2"
                    rounded="$3"
                    bg={org.name === currentId ? '$color4' : 'transparent'}
                    hoverStyle={{ bg: '$color5' }}
                  >
                    <OrgAvatar org={org} />
                    <Text flex={1} fontSize="$2" color="$color12" numberOfLines={1}>
                      {org.displayName || org.name}
                    </Text>
                    {org.name === currentId ? <Check size={15} /> : null}
                  </XStack>
                ))
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

            {create ? (
              <XStack
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
