'use client'

/**
 * Sends and sequences, as cloud apps/marketing keeps them. An audience send is a
 * one-step sequence with the audience enrolled; a drip is a sequence of several. The
 * list is the org's sequences; opening one shows its steps, its state, and every
 * person it enrolled with where their walk stands, read again while anyone is due.
 * Nothing here is counted in the browser: every figure is the cloud's.
 */

import { useCallback, useEffect, useState } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { CrmApi, type Audience, type Enrollment, type Sequence, type SequenceStep } from '../../lib/crm'
import { cardBoxStyle, inputStyle, labelStyle } from './style'
import { delayText, tally, walkState } from './logic'

type Open = { sequence: Sequence; steps: SequenceStep[]; enrollments: Enrollment[] }

const when = (s: number): string => (s > 0 ? new Date(s * 1000).toLocaleString() : '—')
const message = (e: unknown, fallback: string): string => (e instanceof Error ? e.message : fallback)

export function Sequences({ openId }: { openId?: string | null }) {
  const [list, setList] = useState<Sequence[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(openId ?? null)
  const [open, setOpen] = useState<Open | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const loadList = useCallback(() => {
    setListError(null)
    CrmApi.marketing
      .listSequences()
      .then(setList)
      .catch((e) => setListError(message(e, 'The sequences could not be read.')))
  }, [])

  const loadOpen = useCallback(async (id: string) => {
    setOpenError(null)
    try {
      const [view, enrollments] = await Promise.all([CrmApi.marketing.getSequence(id), CrmApi.marketing.listEnrollments(id)])
      setOpen({ ...view, enrollments })
    } catch (e) {
      setOpenError(message(e, 'This sequence could not be read.'))
    }
  }, [])

  useEffect(loadList, [loadList])
  useEffect(() => {
    if (openId) setSelected(openId)
  }, [openId])
  useEffect(() => {
    setOpen(null)
    if (selected) void loadOpen(selected)
  }, [selected, loadOpen])

  // While anyone is still due, read the walk again: results arrive as the drip takes each step.
  const due = open ? tally(open.enrollments).due : 0
  useEffect(() => {
    if (!selected || due === 0) return
    const t = window.setInterval(() => void loadOpen(selected), 15_000)
    return () => window.clearInterval(t)
  }, [selected, due, loadOpen])

  const create = async () => {
    const name = newName.trim()
    if (!name) return
    setNotice(null)
    try {
      const s = await CrmApi.marketing.createSequence(name)
      setNewName('')
      loadList()
      setSelected(s.id)
    } catch (e) {
      setNotice(message(e, 'The sequence was not created.'))
    }
  }

  return (
    <XStack gap="$3" flexWrap="wrap" items="flex-start">
      <YStack gap="$2" flex={1} minW={260} maxW={380}>
        <div style={cardBoxStyle}>
          <label style={labelStyle}>New sequence</label>
          <XStack gap="$2">
            <input aria-label="New sequence name" style={inputStyle} placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button size="$2" disabled={!newName.trim()} onPress={() => void create()}>
              <Text fontSize="$2">Create</Text>
            </Button>
          </XStack>
          {notice ? <Text fontSize="$2" color="$red11" mt="$2">{notice}</Text> : null}
        </div>
        {listError ? (
          <Text fontSize="$2" color="$red11">{listError}</Text>
        ) : list === null ? (
          <Text fontSize="$2" color="$color10">Loading…</Text>
        ) : list.length === 0 ? (
          <Text fontSize="$2" color="$color10">No sends or sequences yet.</Text>
        ) : (
          list.map((s) => (
            <Button key={s.id} data-slot="sequence-row" size="$3" bg={s.id === selected ? '$color4' : '$color2'} borderWidth={1} borderColor="$borderColor" onPress={() => setSelected(s.id)}>
              <XStack flex={1} justify="space-between" items="center" gap="$2">
                <Text fontSize="$2" fontWeight="600" color="$color12" numberOfLines={1}>{s.name}</Text>
                <Text fontSize="$1" color="$color10">{s.status}</Text>
              </XStack>
            </Button>
          ))
        )}
      </YStack>
      <YStack flex={2} minW={320} gap="$3">
        {openError ? <Text fontSize="$2" color="$red11">{openError}</Text> : null}
        {!selected ? <Text fontSize="$2" color="$color10">Open a send or sequence to see who it reached.</Text> : null}
        {selected && !open && !openError ? <Text fontSize="$2" color="$color10">Loading…</Text> : null}
        {open ? <SequenceDetail key={open.sequence.id} open={open} reload={() => { void loadOpen(open.sequence.id); loadList() }} /> : null}
      </YStack>
    </XStack>
  )
}

function SequenceDetail({ open, reload }: { open: Open; reload: () => void }) {
  const { sequence, steps, enrollments } = open
  const t = tally(enrollments)
  const now = Math.floor(Date.now() / 1000)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [step, setStep] = useState({ subject: '', body: '', hours: '0' })
  const [address, setAddress] = useState('')
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [audienceId, setAudienceId] = useState('')

  useEffect(() => {
    CrmApi.marketing.listAudiences().then(setAudiences).catch(() => setAudiences([]))
  }, [])

  const run = async (work: () => Promise<string>, failed: string) => {
    setBusy(true)
    setNotice(null)
    try {
      setNotice({ ok: true, text: await work() })
      reload()
    } catch (e) {
      setNotice({ ok: false, text: message(e, failed) })
    } finally {
      setBusy(false)
    }
  }

  const enrolled = (r: { resolved: number; enrolled: number; alreadyEnrolled: number }) =>
    `Enrolled ${r.enrolled} of ${r.resolved}${r.alreadyEnrolled ? `; ${r.alreadyEnrolled} already were` : ''}.`

  return (
    <YStack gap="$3">
      <div style={cardBoxStyle}>
        <XStack justify="space-between" items="center" flexWrap="wrap" gap="$2">
          <YStack>
            <Text fontSize="$4" fontWeight="700" color="$color12">{sequence.name}</Text>
            <Text fontSize="$1" color="$color10">Created {when(sequence.createdAt)} · {sequence.status}</Text>
          </YStack>
          <XStack gap="$2">
            {(['draft', 'active', 'archived'] as const)
              .filter((st) => st !== sequence.status)
              .map((st) => (
                <Button key={st} size="$2" disabled={busy} onPress={() => void run(async () => { await CrmApi.marketing.setSequenceStatus(sequence.id, st); return `Now ${st}.` }, 'The status was not changed.')}>
                  <Text fontSize="$2">{st === 'active' ? 'Activate' : st === 'archived' ? 'Archive' : 'Back to draft'}</Text>
                </Button>
              ))}
          </XStack>
        </XStack>
        <XStack gap="$4" mt="$3" flexWrap="wrap" data-slot="sequence-tally">
          <Text fontSize="$2" color="$color11">Enrolled <b>{t.enrolled}</b></Text>
          <Text fontSize="$2" color="$color11">Due <b>{t.due}</b></Text>
          <Text fontSize="$2" color="$color11">Taken <b>{t.taken}</b></Text>
          <Text fontSize="$2" color="$color11">Canceled <b>{t.canceled}</b></Text>
          <Text fontSize="$2" color="$color11">Opens · clicks · replies <b>—</b></Text>
        </XStack>
        {notice ? <Text fontSize="$2" mt="$2" color={notice.ok ? '$green11' : '$red11'}>{notice.text}</Text> : null}
      </div>

      <div style={cardBoxStyle}>
        <Text fontSize="$3" fontWeight="700" color="$color12">Steps</Text>
        {steps.length === 0 ? (
          <Text fontSize="$2" color="$color10" mt="$1">No message yet: an enrollment completes at once and sends nothing.</Text>
        ) : (
          steps.map((s) => (
            <YStack key={s.id} mt="$2" gap="$0.5" data-slot="sequence-step">
              <Text fontSize="$2" fontWeight="600" color="$color12">{s.idx + 1}. {s.subject || '(no subject)'}</Text>
              <Text fontSize="$1" color="$color10">{delayText(s)}</Text>
            </YStack>
          ))
        )}
        <YStack gap="$2" mt="$3">
          <label style={labelStyle}>Add a step</label>
          <input aria-label="Step subject" style={inputStyle} placeholder="Subject" value={step.subject} onChange={(e) => setStep({ ...step, subject: e.target.value })} />
          <textarea aria-label="Step message" style={{ ...inputStyle, minHeight: 90 }} placeholder="Message (plain text; the unsubscribe footer is added by the cloud)" value={step.body} onChange={(e) => setStep({ ...step, body: e.target.value })} />
          <XStack gap="$2" items="center">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Hours after {steps.length === 0 ? 'enrollment' : 'the previous step'}</label>
            <input aria-label="Step delay in hours" style={{ ...inputStyle, width: 90 }} type="number" min={0} value={step.hours} onChange={(e) => setStep({ ...step, hours: e.target.value })} />
            <Button
              size="$2"
              disabled={busy || !step.body.trim()}
              onPress={() =>
                void run(async () => {
                  const hours = Math.max(0, Number(step.hours) || 0)
                  await CrmApi.marketing.addStep(sequence.id, { delaySeconds: Math.round(hours * 3600), subject: step.subject.trim(), body: step.body })
                  setStep({ subject: '', body: '', hours: '0' })
                  return 'Step added.'
                }, 'The step was not added.')
              }
            >
              <Text fontSize="$2">Add step</Text>
            </Button>
          </XStack>
        </YStack>
      </div>

      <div style={cardBoxStyle}>
        <Text fontSize="$3" fontWeight="700" color="$color12">Enroll</Text>
        {sequence.status !== 'active' ? <Text fontSize="$2" color="$color10" mt="$1">Only an active sequence takes enrollments.</Text> : null}
        <XStack gap="$2" mt="$2" flexWrap="wrap">
          <input aria-label="Enroll address" style={{ ...inputStyle, flex: 1, minWidth: 200 }} placeholder="person@company.com" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Button size="$2" disabled={busy || sequence.status !== 'active' || !address.trim()} onPress={() => void run(async () => { const r = await CrmApi.marketing.enroll(sequence.id, { address: address.trim() }); setAddress(''); return enrolled(r) }, 'The address was not enrolled.')}>
            <Text fontSize="$2">Enroll address</Text>
          </Button>
        </XStack>
        <XStack gap="$2" mt="$2" flexWrap="wrap">
          <select aria-label="Enroll audience" style={{ ...inputStyle, flex: 1, minWidth: 200 }} value={audienceId} onChange={(e) => setAudienceId(e.target.value)}>
            <option value="">Choose an audience…</option>
            {audiences.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <Button size="$2" disabled={busy || sequence.status !== 'active' || !audienceId} onPress={() => void run(async () => enrolled(await CrmApi.marketing.enroll(sequence.id, { audienceId })), 'The audience was not enrolled.')}>
            <Text fontSize="$2">Enroll audience</Text>
          </Button>
        </XStack>
      </div>

      <div style={cardBoxStyle}>
        <Text fontSize="$3" fontWeight="700" color="$color12">Who it reached</Text>
        <Text fontSize="$1" color="$color10" mt="$0.5">
          A walk is due until its step is taken. Whether a taken step was sent, suppressed or failed is recorded by the cloud but not reported here yet.
        </Text>
        {enrollments.length === 0 ? (
          <Text fontSize="$2" color="$color10" mt="$2">Nobody enrolled yet.</Text>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
            <thead>
              <tr style={{ color: '#a1a1aa', textAlign: 'left' }}>
                <th style={{ padding: '4px 6px' }}>Address</th>
                <th style={{ padding: '4px 6px' }}>State</th>
                <th style={{ padding: '4px 6px' }}>Enrolled</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} data-slot="enrollment-row" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#e4e4e7' }}>
                  <td style={{ padding: '6px', fontFamily: 'monospace' }}>{e.address}</td>
                  <td style={{ padding: '6px' }}>{walkState(e, now)}</td>
                  <td style={{ padding: '6px' }}>{when(e.enrolledAt)}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>
                    {e.status === 'active' ? (
                      <Button size="$1" disabled={busy} onPress={() => void run(async () => { await CrmApi.marketing.cancelEnrollment(sequence.id, e.id); return `Canceled for ${e.address}.` }, 'The walk was not canceled.')}>
                        <Text fontSize="$1">Cancel</Text>
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </YStack>
  )
}
