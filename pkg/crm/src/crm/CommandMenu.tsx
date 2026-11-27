'use client'

/**
 * Twenty-style Global Cmd+K / Ctrl+K Command Menu.
 *
 * - Live cross-object search across People, Companies, Deals, Fundraising, Tasks,
 *   Notes, Candidates (`CrmApi.search` with parallel Base fallback).
 * - Quick actions: New Person, New Company, New Deal, New Task, New Note, Ask AI
 *   Copilot, Open Dashboard, Open Data Model.
 * - Full keyboard navigation (ArrowUp/ArrowDown/Enter/Escape).
 * - Responsive: centered dialog on desktop, clean sheet on mobile (390px).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckSquare,
  Database,
  FileText,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from '@hanzogui/lucide-icons-2'

import { CrmApi, type SearchHit, type SearchResultGroup } from '../lib/crm'
import { useRouter } from '../lib/host'
import type { ObjectId } from './objects'
import { useCrmShell } from './CrmContext'
import { useViewport } from './responsive'
import { CRM_QUICK_ACTIONS, filterQuickActions, type QuickAction } from './twenty-logic'

export { CRM_QUICK_ACTIONS, filterQuickActions, type QuickAction }

function objectIcon(objectId: ObjectId) {
  const size = 14
  const color = '$color10'
  switch (objectId) {
    case 'people': return <Users size={size} color={color} />
    case 'companies': return <Building2 size={size} color={color} />
    case 'deals': return <Briefcase size={size} color={color} />
    case 'fundraising': return <TrendingUp size={size} color={color} />
    case 'tasks': return <CheckSquare size={size} color={color} />
    case 'notes': return <FileText size={size} color={color} />
    case 'candidates': return <UserCheck size={size} color={color} />
    default: return <ArrowRight size={size} color={color} />
  }
}

function actionIcon(a: QuickAction) {
  if (a.kind === 'copilot') return <Sparkles size={14} color="$blue10" />
  if (a.id === 'open-dashboard') return <BarChart3 size={14} color="$color10" />
  if (a.id === 'open-model') return <Database size={14} color="$color10" />
  return <Plus size={14} color="$color10" />
}

type FlatEntry =
  | { kind: 'action'; action: QuickAction }
  | { kind: 'hit'; hit: SearchHit }

export function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { mobile } = useViewport()
  const { setCopilotOpen, setQuickCreateObject } = useCrmShell()

  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchResultGroup[]>([])
  const [searching, setSearching] = useState(false)
  const [cursor, setCursor] = useState(0)
  const seq = useRef(0)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setGroups([])
      setCursor(0)
      return
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (!q) {
      setGroups([])
      setSearching(false)
      return
    }
    const id = ++seq.current
    setSearching(true)
    const timer = setTimeout(() => {
      CrmApi.search(q, 24)
        .then((res) => {
          if (id === seq.current) setGroups(res)
        })
        .catch(() => {
          if (id === seq.current) setGroups([])
        })
        .finally(() => {
          if (id === seq.current) setSearching(false)
        })
    }, 180)
    return () => clearTimeout(timer)
  }, [open, query])

  const actions = useMemo(() => filterQuickActions(CRM_QUICK_ACTIONS, query), [query])

  const flat = useMemo<FlatEntry[]>(() => {
    const out: FlatEntry[] = []
    for (const g of groups) {
      for (const hit of g.hits) out.push({ kind: 'hit', hit })
    }
    for (const action of actions) out.push({ kind: 'action', action })
    return out
  }, [groups, actions])

  useEffect(() => {
    setCursor(0)
  }, [query, groups.length])

  const runEntry = (entry: FlatEntry) => {
    onClose()
    if (entry.kind === 'hit') {
      router.push(entry.hit.href)
      return
    }
    const a = entry.action
    if (a.kind === 'copilot') {
      setCopilotOpen(true)
    } else if (a.kind === 'navigate' && a.href) {
      router.push(a.href)
    } else if (a.kind === 'create' && a.objectId) {
      const slug = a.objectId === 'people' ? '' : a.objectId
      router.push(slug ? `/crm/${slug}` : '/crm')
      setQuickCreateObject(a.objectId)
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => (flat.length ? (c + 1) % flat.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => (flat.length ? (c - 1 + flat.length) % flat.length : 0))
      } else if (e.key === 'Enter' && flat[cursor]) {
        e.preventDefault()
        runEntry(flat[cursor])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flat, cursor, onClose])

  if (!open) return null

  let rowIndex = -1

  return (
    <YStack
      position="fixed"
      t={0}
      l={0}
      r={0}
      b={0}
      z={1000}
      items="center"
      justify={mobile ? 'flex-end' : 'flex-start'}
      pt={mobile ? 0 : 72}
      px={mobile ? 0 : '$4'}
      bg="rgba(0,0,0,0.48)"
      onPress={onClose}
      data-slot="crm-command-menu-backdrop"
    >
      <YStack
        width="100%"
        maxW={mobile ? '100%' : 580}
        maxH={mobile ? '85vh' : '72vh'}
        bg="$background"
        borderWidth={1}
        borderColor="$borderColor"
        rounded={mobile ? '$4' : '$4'}
        overflow="hidden"
        onPress={(e: { stopPropagation?: () => void }) => e?.stopPropagation?.()}
        role="dialog"
        aria-modal="true"
        aria-label="CRM Command Menu"
        data-slot="crm-command-menu"
      >
        <XStack items="center" gap="$2" px="$3" py="$2.5" borderBottomWidth={1} borderColor="$borderColor">
          <Search size={16} color="$color10" />
          <Input
            flex={1}
            size="$3"
            borderWidth={0}
            bg="transparent"
            value={query}
            onChangeText={setQuery}
            placeholder="Search people, companies, deals, tasks, notes, or actions…"
            autoFocus
            aria-label="Search CRM"
            data-slot="crm-command-input"
          />
          {searching ? <Spinner size="small" color="$color10" /> : null}
          <Button size="$2" chromeless px="$1.5" onPress={onClose} aria-label="Close command menu">
            <X size={15} color="$color10" />
          </Button>
        </XStack>

        <YStack p="$2" gap="$2" overflow="scroll" flex={1} maxH={mobile ? '70vh' : 460}>
          {groups.map((g) => (
            <YStack key={g.objectId} gap="$1" data-slot="crm-command-group" data-object={g.objectId}>
              <Text fontSize="$1" fontWeight="700" color="$color10" px="$2" py="$1">
                {g.label.toUpperCase()}
              </Text>
              {g.hits.map((hit) => {
                rowIndex += 1
                const active = rowIndex === cursor
                return (
                  <XStack
                    key={`${hit.objectId}:${hit.id}`}
                    items="center"
                    justify="space-between"
                    gap="$2"
                    px="$2.5"
                    py="$2"
                    minH={40}
                    rounded="$2"
                    cursor="pointer"
                    bg={active ? '$color3' : 'transparent'}
                    hoverStyle={{ bg: '$color2' }}
                    onPress={() => runEntry({ kind: 'hit', hit })}
                    data-slot="crm-command-hit"
                  >
                    <XStack items="center" gap="$2" flex={1} minW={0}>
                      {objectIcon(hit.objectId)}
                      <YStack flex={1} minW={0}>
                        <Text fontSize="$3" fontWeight="600" color="$color12" numberOfLines={1}>
                          {hit.title}
                        </Text>
                        {hit.subtitle ? (
                          <Text fontSize="$1" color="$color10" numberOfLines={1}>
                            {hit.subtitle}
                          </Text>
                        ) : null}
                      </YStack>
                    </XStack>
                    {hit.badge ? (
                      <Text fontSize="$1" color="$color10" px="$2" py={2} bg="$color2" rounded="$2">
                        {hit.badge}
                      </Text>
                    ) : null}
                  </XStack>
                )
              })}
            </YStack>
          ))}

          {actions.length > 0 ? (
            <YStack gap="$1" data-slot="crm-command-actions">
              <Text fontSize="$1" fontWeight="700" color="$color10" px="$2" py="$1">
                QUICK ACTIONS
              </Text>
              {actions.map((action) => {
                rowIndex += 1
                const active = rowIndex === cursor
                return (
                  <XStack
                    key={action.id}
                    items="center"
                    justify="space-between"
                    gap="$2"
                    px="$2.5"
                    py="$2"
                    minH={40}
                    rounded="$2"
                    cursor="pointer"
                    bg={active ? '$color3' : 'transparent'}
                    hoverStyle={{ bg: '$color2' }}
                    onPress={() => runEntry({ kind: 'action', action })}
                    data-slot="crm-command-action"
                    data-action={action.id}
                  >
                    <XStack items="center" gap="$2" flex={1} minW={0}>
                      {actionIcon(action)}
                      <Text fontSize="$3" color="$color12" numberOfLines={1}>
                        {action.label}
                      </Text>
                    </XStack>
                    <ArrowRight size={13} color="$color9" />
                  </XStack>
                )
              })}
            </YStack>
          ) : null}

          {!searching && flat.length === 0 ? (
            <YStack py="$6" items="center" justify="center">
              <Text fontSize="$3" color="$color10">
                {`No records or actions match "${query}".`}
              </Text>
            </YStack>
          ) : null}
        </YStack>

        <XStack
          items="center"
          justify="space-between"
          px="$3"
          py="$2"
          borderTopWidth={1}
          borderColor="$borderColor"
          bg="$color2"
        >
          <Text fontSize="$1" color="$color10">
            ↑↓ navigate · ↵ open · Esc close
          </Text>
          <Text fontSize="$1" color="$color9" fontFamily="$mono">
            ⌘K
          </Text>
        </XStack>
      </YStack>
    </YStack>
  )
}
