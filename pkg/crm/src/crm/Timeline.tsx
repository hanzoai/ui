'use client'

/**
 * A person's timeline as the cloud filed it, and whether they may be mailed.
 *
 * Every email the org sends through /v1/email or the brand mailbox is filed on the
 * recipient's CRM record as an `email` activity (cloud apps/crm FileMail): subject,
 * when, who wrote it, and the provider's delivery report once one arrives. This
 * draws those activities and nothing else; an empty timeline says so.
 *
 * The org's suppression list is the one send gate: an address on it, on its company
 * domain's entry or on the platform blocklist is refused by every rail. Whether a
 * person is on it is asked per address (GET /v1/marketing/suppressions/check); a
 * cloud that cannot answer leaves it unknown, said so, never "not suppressed". An
 * org admin may re-subscribe an address-scoped entry, behind a confirm.
 */

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@hanzo/ui'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Activity } from '@hanzogui/lucide-icons-2'
import { CrmApi, type SuppressionCheck, type TimelineEvent } from '../lib/crm'
import { managesSuppressions, unmailable } from './suppression'
import { currentOrg, useSession } from '../lib/host'

/** This address against the send gate: null while asking, then the cloud's answer. */
export function useMailable(email: string): { check: SuppressionCheck | null; recheck: () => void } {
  const [check, setCheck] = useState<SuppressionCheck | null>(null)
  const [round, setRound] = useState(0)
  useEffect(() => {
    const address = email.trim().toLowerCase()
    if (!address) return
    let live = true
    setCheck(null)
    CrmApi.marketing.checkSuppression(address).then((c) => live && setCheck(c))
    return () => {
      live = false
    }
  }, [email, round])
  const recheck = useCallback(() => setRound((r) => r + 1), [])
  return { check, recheck }
}

/**
 * The send gate's answer for one person, and what an org admin may do about it:
 * re-subscribe an address or a company entry, or — for a clear address on a domain
 * the verifier says is not free mail — suppress the whole company. Each behind a
 * confirm; a platform blocklist entry is not the org's to lift.
 */
export function SuppressionNote({ email, check, recheck }: { email: string; check: SuppressionCheck | null; recheck: () => void }) {
  const { account } = useSession()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState<string | null>(null)
  const may = managesSuppressions(account, currentOrg())
  const address = email.trim().toLowerCase()

  // A company opt-out is offered only for a domain the verifier calls business mail.
  useEffect(() => {
    setCompany(null)
    if (!may || check?.state !== 'clear' || !address) return
    let live = true
    CrmApi.email.classify(address).then((c) => live && setCompany(c && !c.free ? c.domain : null))
    return () => {
      live = false
    }
  }, [may, check, address])

  const act = async (question: string, run: () => Promise<unknown>, failed: string) => {
    if (!window.confirm(question)) return
    setBusy(true)
    setError(null)
    try {
      await run()
      recheck()
    } catch (e) {
      setError(e instanceof Error ? e.message : failed)
    } finally {
      setBusy(false)
    }
  }

  if (!check) return null
  if (check.state === 'unknown') {
    return (
      <Text fontSize="$2" color="$color10" data-slot="suppression-unknown">
        Suppression unknown: {check.why}
      </Text>
    )
  }
  const domain = address.split('@')[1] ?? ''
  const button = (label: string, onPress: () => void) => (
    <XStack>
      <Button size="$2" disabled={busy} onPress={onPress}>
        <Text fontSize="$2">{busy ? 'Saving…' : label}</Text>
      </Button>
    </XStack>
  )
  return (
    <YStack gap="$1.5" data-slot={check.state === 'suppressed' ? 'suppression-suppressed' : 'suppression-clear'}>
      {check.state === 'suppressed' ? (
        <Text fontSize="$2" color="$red11">
          {unmailable(check)}
        </Text>
      ) : null}
      {may && check.state === 'suppressed' && check.scope === 'domain' && domain
        ? button('Re-subscribe company', () =>
            void act(`Re-subscribe everyone at ${domain}? They will be mailable again by every rail.`, () => CrmApi.marketing.removeSuppression(`@${domain}`), `${domain} was not re-subscribed.`),
          )
        : null}
      {may && check.state === 'suppressed' && (check.scope === undefined || check.scope === 'address')
        ? button('Re-subscribe', () =>
            void act(`Re-subscribe ${address}? They will be mailable again by every rail.`, () => CrmApi.marketing.removeSuppression(address), `${address} was not re-subscribed.`),
          )
        : null}
      {may && check.state === 'clear' && company
        ? button('Suppress this company', () =>
            void act(`Suppress everyone at ${company}? No rail will mail any address there.`, () => CrmApi.marketing.suppressCompany(company, 'company opt-out'), `${company} was not suppressed.`),
          )
        : null}
      {error ? (
        <Text fontSize="$2" color="$red11">
          {error}
        </Text>
      ) : null}
    </YStack>
  )
}

/** One mail's state in words, with why when it never reached the inbox. */
const statusLine = (e: TimelineEvent): string =>
  `${e.status}${e.reason && (e.status === 'suppressed' || e.status === 'failed' || e.status === 'bounced' || e.status === 'complained') ? ` (${e.reason})` : ''}${e.rail ? ` · ${e.rail}` : ''}`

const label = (e: TimelineEvent): string =>
  e.kind === 'email' ? (e.direction === 'in' ? 'Email received' : 'Email sent') : e.kind ? `${e.kind[0].toUpperCase()}${e.kind.slice(1)}` : 'Activity'

export function Timeline({ person, email }: { person?: string; email?: string }) {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!person && !email) return
    let live = true
    setError(null)
    CrmApi.timeline({ person, email })
      .then((xs) => live && setEvents(xs))
      .catch((e) => live && setError(e instanceof Error ? e.message : 'The timeline could not be read.'))
    return () => {
      live = false
    }
  }, [person, email])

  return (
    <Card p="$3" borderWidth={1} borderColor="$borderColor" bg="$color2">
      <XStack items="center" gap="$1.5" mb="$2">
        <Activity size={14} color="$blue10" />
        <Text fontSize="$2" fontWeight="700" color="$color10">
          TIMELINE
        </Text>
      </XStack>
      {error ? (
        <Text fontSize="$2" color="$red11">
          {error}
        </Text>
      ) : events === null ? (
        <Text fontSize="$2" color="$color10">
          Loading…
        </Text>
      ) : events.length === 0 ? (
        <Text fontSize="$2" color="$color10">
          No activity recorded yet.
        </Text>
      ) : (
        <YStack gap="$2.5">
          {events.map((e) => (
            <YStack key={e.id} gap="$0.5" data-slot="timeline-event">
              <XStack items="baseline" justify="space-between" gap="$2">
                <Text fontSize="$2" fontWeight="700" color="$color12">
                  {label(e)}
                  {e.kind === 'email' ? ` · ${statusLine(e)}` : ''}
                </Text>
                <Text fontSize="$1" color="$color10">
                  {e.at ? new Date(e.at * 1000).toLocaleString() : ''}
                </Text>
              </XStack>
              {e.subject ? (
                <Text fontSize="$2" color="$color11">
                  {e.subject}
                </Text>
              ) : null}
              {e.to || e.by ? (
                <Text fontSize="$1" color="$color10">
                  {[e.to ? `to ${e.to}` : '', e.by ? `by ${e.by}` : ''].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
              {e.events.length ? (
                <Text fontSize="$1" color="$color10">
                  {e.events.map((x) => `${x.status} ${new Date(x.at * 1000).toLocaleString()}`).join(' → ')}
                </Text>
              ) : null}
            </YStack>
          ))}
        </YStack>
      )}
    </Card>
  )
}
