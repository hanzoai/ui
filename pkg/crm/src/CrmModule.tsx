'use client'

/**
 * CRM — the org's people, companies, sales pipeline, fundraising, tasks, lists and
 * sequences, kept in the org's own Base (hanzoai/base module `crm`).
 *
 *   /crm                 People: everyone the org knows, investors and customers alike
 *   /crm/companies       firms, investor firms among them
 *   /crm/deals           the sales pipeline, a board by stage
 *   /crm/fundraising     the round, a board by stage: intro, meeting, diligence, term sheet, closed
 *   /crm/tasks           what is to be done, and for whom
 *   /crm/lists           who outreach goes to: lists made by hand, from a view, or from a file
 *   /crm/sequences       the cloud's drip: steps, who is enrolled, where each walk stands
 *   /crm/beta            every beta signup and the betas it asked for and holds (SuperAdmin)
 *   /crm/candidates      hiring
 *   /crm/:tab/:id        one record and its timeline
 *
 * Every table is the server's: the view is a Base query and the browser holds one
 * page (crm/Records). On the crm face (crm.<brand>, where the host is `gated`) the CRM
 * is a product any account opens in its own org, and a beta: `BetaGate` reads the
 * org's `crm` enablement first and shows `BetaScreen` to an org without it; a read
 * the engine refuses is `NoRole`.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Spinner, Text, YStack } from '@hanzo/gui'
import { BackendStateCard, classifyBackend, type BackendState } from '@hanzo/ui/product'

import { CrmApi } from './lib/crm'
import { currentOrg, host, useRouter, useSearchParams } from './lib/host'
import { BetaScreen, NoRole } from './crm/Access'
import { movedView, objectOf } from './crm/objects'
import { Records } from './crm/Records'
import { RecordPage } from './crm/Record'
import { Sequences } from './crm/studio/Sequences'
import { Beta } from './crm/Beta'

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
  const tab = (params.tab ?? '').toLowerCase()
  const obj = objectOf(tab)
  const named = useSearchParams()?.get('view') ?? null

  // An address from before the CRM was one table per object lands on what replaced it,
  // and on the view that was that table (/crm/customers is People's Customers).
  useEffect(() => {
    if (!obj || !tab || tab === obj.id || params.id) return
    const view = movedView(tab)
    router.replace(`/crm/${obj.id === 'people' ? '' : obj.id}${view ? `?view=${view}` : ''}`)
  }, [obj, tab, params.id, router])

  return (
    <YStack p="$4" $sm={{ p: '$2' }} gap="$4" width="100%" maxW={1600} mx="auto" data-slot="crm">
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
  )
}
