'use client'

/**
 * CRM — the org's people, companies, sales pipeline, fundraising, tasks, notes,
 * lists, candidates, sequences, analytics dashboard, and data model, kept in the
 * org's own Base (hanzoai/base module `crm`).
 *
 *   /crm                 People: everyone the org knows, investors and customers alike
 *   /crm/companies       firms, investor firms among them
 *   /crm/deals           the sales pipeline, a board/table/calendar by stage
 *   /crm/fundraising     the round, a board/table/calendar by stage
 *   /crm/tasks           what is to be done, and for whom (table/board/calendar)
 *   /crm/notes           notes linked across people, companies and opportunities
 *   /crm/lists           who outreach goes to: lists made by hand, from a view, or from a file
 *   /crm/sequences       the cloud's drip: steps, who is enrolled, where each walk stands
 *   /crm/candidates      hiring (table/board/calendar)
 *   /crm/sales           the org's customers, orders, carts left and plans, from commerce and billing
 *   /crm/dashboard       pipeline funnels, outreach conversion, overdue tasks & activity
 *   /crm/model           Data Model settings: inspect 13 CRM objects & add custom fields
 *   /crm/beta            every beta signup and the betas it asked for and holds (SuperAdmin)
 *   /crm/:tab/:id        one record, its timeline, and its attachments
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Spinner, Text, YStack } from '@hanzo/gui'
import { BackendStateCard, classifyBackend, type BackendState } from '@hanzo/ui/product'

import { CrmApi } from './lib/crm'
import { currentOrg, host, useRouter, useSearchParams } from './lib/host'
import { BetaScreen, NoRole } from './crm/Access'
import { movedView, objectOf, type ObjectId } from './crm/objects'
import { Records } from './crm/Records'
import { RecordPage } from './crm/Record'
import { Sequences } from './crm/studio/Sequences'
import { Beta } from './crm/Beta'
import { Sales } from './crm/Sales'
import { Dashboard } from './crm/Dashboard'
import { DataModel } from './crm/DataModel'
import { CrmHeader } from './crm/CrmHeader'
import { CommandMenu } from './crm/CommandMenu'
import { CopilotDrawer } from './crm/CopilotDrawer'
import {
  CrmShellContext,
  type ActiveListContext,
  type ActiveRecordContext,
  type CrmShellContextValue,
  type CrmViewMode,
  type EmailDraftHandoff,
} from './crm/CrmContext'
import { useViewport } from './crm/responsive'

type Async<T> = { phase: 'loading' } | { phase: 'error'; error: BackendState } | { phase: 'ready'; data: T }

export function CrmModule({ params }: { params: Record<string, string> }) {
  // The crm face (crm.<brand>) opens the CRM behind its beta; the host says whether this is one.
  return host().gated ? (
    <BetaGate>
      <Crm params={params} />
    </BetaGate>
  ) : (
    <Crm params={params} />
  )
}

/**
 * The crm face's door: the org's `crm` enablement, read once before any CRM call. An
 * org that has it gets the CRM; one that has not gets `BetaScreen`, which checks again
 * on request, so an account back from applying opens it without a reload. An account
 * the read refuses does not act in the org at all and gets `NoRole`.
 */
function BetaGate({ children }: { children: ReactNode }) {
  const org = currentOrg()
  const [state, setState] = useState<Async<boolean>>({ phase: 'loading' })
  const check = useCallback(() => {
    setState({ phase: 'loading' })
    CrmApi.beta(org)
      .then((data) => setState({ phase: 'ready', data }))
      .catch((e) => setState({ phase: 'error', error: classifyBackend(e) }))
  }, [org])
  useEffect(() => {
    check()
  }, [check])
  if (state.phase === 'loading') {
    return (
      <YStack flex={1} minH="60vh" items="center" justify="center">
        <Spinner size="large" color="$color11" />
      </YStack>
    )
  }
  if (state.phase === 'error') {
    return state.error.kind === 'access' ? <NoRole org={org} /> : <BackendStateCard state={state.error} onRetry={check} hint="endpoint · GET /v1/entitlement/orgs/:org" />
  }
  return state.data ? <>{children}</> : <BetaScreen org={org} onCheck={check} />
}

function Crm({ params }: { params: Record<string, string> }) {
  const router = useRouter()
  const { mobile } = useViewport()
  const tab = (params.tab ?? '').toLowerCase()
  const obj = objectOf(tab)
  const named = useSearchParams()?.get('view') ?? null

  const [commandOpen, setCommandOpen] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [viewMode, setViewMode] = useState<CrmViewMode>('table')
  const [availableViews, setAvailableViews] = useState<CrmViewMode[]>(['table'])
  const [activeRecord, setActiveRecord] = useState<ActiveRecordContext | null>(null)
  const [activeList, setActiveList] = useState<ActiveListContext | null>(null)
  const [draftEmail, setDraftEmail] = useState<EmailDraftHandoff | null>(null)
  const [recordRevision, setRecordRevision] = useState(0)
  const [quickCreateObject, setQuickCreateObject] = useState<ObjectId | null>(null)

  // Global Cmd+K / Ctrl+K shortcut for Twenty-style Command Menu.
  // Capture phase + stopImmediatePropagation ensures host shells (e.g. Console app launcher)
  // do not open a competing palette on top of the CRM command menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        setCommandOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // An address from before the CRM was one table per object lands on what replaced it,
  // and on the view that was that table (/crm/customers is People's Customers).
  useEffect(() => {
    if (!obj || !tab || tab === obj.id || params.id) return
    const view = movedView(tab)
    router.replace(`/crm/${obj.id === 'people' ? '' : obj.id}${view ? `?view=${view}` : ''}`)
  }, [obj, tab, params.id, router])

  const openCommandMenu = useCallback(() => setCommandOpen(true), [])
  const toggleCopilot = useCallback(() => setCopilotOpen((o) => !o), [])
  const openEmailDraft = useCallback((d: { subject: string; body: string }) => {
    setDraftEmail({ ...d, at: Date.now() })
  }, [])
  const clearEmailDraft = useCallback(() => setDraftEmail(null), [])
  const bumpRecordRevision = useCallback(() => setRecordRevision((r) => r + 1), [])

  const shellValue = useMemo<CrmShellContextValue>(
    () => ({
      openCommandMenu,
      copilotOpen,
      setCopilotOpen,
      toggleCopilot,
      viewMode,
      setViewMode,
      availableViews,
      setAvailableViews,
      activeRecord,
      setActiveRecord,
      activeList,
      setActiveList,
      draftEmail,
      openEmailDraft,
      clearEmailDraft,
      recordRevision,
      bumpRecordRevision,
      quickCreateObject,
      setQuickCreateObject,
    }),
    [
      openCommandMenu,
      copilotOpen,
      toggleCopilot,
      viewMode,
      availableViews,
      activeRecord,
      activeList,
      draftEmail,
      openEmailDraft,
      clearEmailDraft,
      recordRevision,
      bumpRecordRevision,
      quickCreateObject,
    ],
  )

  const activeSlug =
    tab === 'sequences' || tab === 'sales' || tab === 'beta' || tab === 'dashboard' || tab === 'model'
      ? tab
      : obj && obj.id !== 'people'
        ? obj.id
        : ''

  return (
    <CrmShellContext.Provider value={shellValue}>
      <YStack
        p="$4"
        $sm={{ p: '$2.5' }}
        style={!mobile && copilotOpen ? { paddingRight: 396 } : undefined}
        gap="$4"
        width="100%"
        maxW={1600}
        mx="auto"
        overflow="hidden"
        data-slot="crm"
      >
        <CrmHeader activeSlug={activeSlug} isRecordDetail={Boolean(params.id)} />

        {tab === 'sequences' ? (
          <YStack gap="$3">
            <Text fontSize="$7" fontWeight="700" color="$color12">
              Sequences
            </Text>
            <Text fontSize="$3" color="$color10">
              {"A sequence is a series of emails, each sent a delay after the last. Enroll people from People or a list; every step goes through the org's suppression list, and the unsubscribe link in each one is honoured."}
            </Text>
            <Sequences openId={params.id ?? null} />
          </YStack>
        ) : tab === 'sales' ? (
          <YStack gap="$3">
            <Text fontSize="$7" fontWeight="700" color="$color12">
              Sales
            </Text>
            <Sales />
          </YStack>
        ) : tab === 'dashboard' ? (
          <Dashboard />
        ) : tab === 'model' ? (
          <DataModel />
        ) : tab === 'beta' ? (
          <YStack gap="$3">
            <Text fontSize="$7" fontWeight="700" color="$color12">
              Beta
            </Text>
            <Beta />
          </YStack>
        ) : !obj ? (
          <BackendStateCard state={classifyBackend(new Error(`The CRM has no "${tab}".`))} hint="crm" />
        ) : params.id ? (
          <RecordPage key={`${obj.id}/${params.id}`} obj={obj} id={params.id} />
        ) : (
          <Records key={`${obj.id}:${named ?? movedView(tab) ?? ''}`} obj={obj} view={named ?? movedView(tab)} />
        )}
      </YStack>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
      <CopilotDrawer />
    </CrmShellContext.Provider>
  )
}
