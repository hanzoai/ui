'use client'

/**
 * One record: its fields, edited in place, and its timeline — every email the cloud
 * filed on it (with where each one stands), every form it filed, every call and
 * meeting logged, every note and task. A person's page says whether they may be
 * mailed; a company's lists its people and deals; a list's is its members.
 *
 * Logging a call or a meeting is an activity on the timeline and moves the
 * record's last contact to now. An email is sent by the cloud (POST
 * /v1/marketing/mail), which files it on the timeline itself and refuses an
 * address that opted out.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { Card, Textarea } from '@hanzo/ui'
import { RecordDetail, type FieldDefinition, type SelectOption } from '@hanzo/data'
import { BackendStateCard, classifyBackend } from '@hanzo/ui/product'
import { CrmApi, paragraphs, plain, stamp, time, type TimelineEvent } from '../lib/crm'
import { ApiError, useRouter, useSession } from '../lib/host'
import { useChanges } from '../lib/live'
import type { BaseRecord } from '../lib/base-data/api'
import { toBase } from '../lib/base-data/fields'
import { OBJECTS, REPLIED_BY_HAND, type CrmObject } from './objects'
import { Bulk } from './Actions'
import { Records } from './Records'
import { expandOf, optionOf, rowOf, useRelationOptions, useSchema, words } from './schema'
import { SuppressionNote, useMailable } from './Timeline'

type Kind = 'note' | 'call' | 'meeting' | 'email' | 'task'

/** The relation a timeline entry names this record by, per collection. */
const LINK: Record<string, { activity: string; many: string }> = {
  people: { activity: 'person', many: 'people' },
  companies: { activity: 'company', many: 'companies' },
  opportunities: { activity: 'opportunity', many: 'opportunities' },
  candidates: { activity: 'candidate', many: 'candidates' },
}

const statusWord = (e: TimelineEvent): string =>
  `${e.status}${e.reason && ['suppressed', 'failed', 'bounced', 'complained'].includes(e.status) ? ` (${e.reason})` : ''}${e.rail ? ` · ${e.rail}` : ''}`

const kindWord = (e: { kind: string; direction?: string }): string =>
  e.kind === 'email' ? (e.direction === 'in' ? 'Email received' : 'Email sent') : e.kind === 'form' ? 'Form' : e.kind ? `${e.kind[0].toUpperCase()}${e.kind.slice(1)}` : 'Activity'

/** One line of the timeline, whatever filed it. */
interface Entry {
  id: string
  kind: string
  at: number
  title: string
  detail: string
  body: string
  trail: string
  answers: { question: string; answer: string }[]
}

const fromEvent = (e: TimelineEvent): Entry => ({
  id: `a:${e.id}`,
  kind: e.kind,
  at: e.at,
  title: `${kindWord(e)}${e.kind === 'email' ? ` · ${statusWord(e)}` : ''}`,
  detail: [e.subject, e.to ? `to ${e.to}` : '', e.by ? `by ${e.by}` : ''].filter(Boolean).join(' · '),
  body: e.body || e.snippet,
  trail: e.events.map((x) => `${x.status} ${new Date(x.at * 1000).toLocaleString()}`).join(' → '),
  answers: e.answers,
})

export function RecordPage({ obj, id }: { obj: CrmObject; id: string }) {
  const router = useRouter()
  const load = useSchema(obj)
  const schema = load.state === 'ready' ? load.value : null
  const options = useRelationOptions(schema)
  const [record, setRecord] = useState<BaseRecord | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [round, setRound] = useState(0)
  useChanges([obj.collection], () => setRound((r) => r + 1))

  useEffect(() => {
    if (!schema) return
    let live = true
    CrmApi.get(obj.collection, id, expandOf(schema) || undefined)
      .then((r) => live && (setRecord(r), setError(null)))
      .catch((e) => live && setError(e))
    return () => {
      live = false
    }
  }, [obj, id, schema, round])

  const row = useMemo(() => (schema && record ? rowOf(schema, record) : null), [schema, record])
  const byBase = useMemo(() => new Map((schema?.base ?? []).map((f) => [f.name, f])), [schema])
  const fieldOptions = useCallback((f: FieldDefinition): SelectOption[] | undefined => options.get(f.name), [options])

  const commit = async (f: FieldDefinition, value: unknown) => {
    const b = byBase.get(f.name)
    if (!b || !record) return
    await CrmApi.update(obj.collection, id, { [f.name]: toBase(b.type, value, record[f.name]) })
    setRound((r) => r + 1)
  }

  if (load.state === 'error' || error) {
    return <BackendStateCard state={classifyBackend(load.state === 'error' ? load.error : error)} onRetry={() => setRound((r) => r + 1)} hint={`endpoint · GET /v1/base/collections/${obj.collection}/records/${id}`} />
  }
  if (!schema || !record || !row) {
    return (
      <YStack minH={240} items="center" justify="center">
        <Spinner size="large" color="$color11" />
      </YStack>
    )
  }

  const title = optionOf(obj.collection, record).label
  const email = obj.collection === 'people' ? String((record.emails as { primaryEmail?: unknown } | undefined)?.primaryEmail ?? '') : ''
  const company = row.company && typeof row.company === 'object' ? String((row.company as { name?: unknown }).name ?? '') : ''
  const fields = schema.fields.filter((f) => !(f.type === 'relation' && (byBase.get(f.name)?.maxSelect ?? 1) > 1))

  return (
    <YStack gap="$4" data-slot="crm-record" data-object={obj.id}>
      <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
        <YStack gap="$1" flex={1} minW={220}>
          <XStack>
            <Button size="$2" chromeless px={0} onPress={() => router.push(`/crm/${obj.id === 'people' ? '' : obj.id}`)}>
              {`← ${obj.plural}`}
            </Button>
          </XStack>
          <Text fontSize="$8" fontWeight="700" color="$color12" data-slot="crm-record-title">
            {title}
          </Text>
          <Text fontSize="$3" color="$color10">
            {[email, company, obj.label].filter(Boolean).join(' · ')}
          </Text>
        </YStack>
        <XStack gap="$2" flexWrap="wrap" shrink={1} minW={0}>
          <Bulk
            obj={obj}
            schema={schema}
            ids={[id]}
            raw={new Map([[id, record]])}
            onDone={() =>
              CrmApi.get(obj.collection, id)
                .then(() => setRound((r) => r + 1))
                .catch(() => router.push(`/crm/${obj.id === 'people' ? '' : obj.id}`))
            }
          />
        </XStack>
      </XStack>

      {email ? <Mailable email={email} /> : null}
      {obj.collection === 'people' && schema.names.has('outreach') ? (
        <Replied
          id={id}
          replied={record.outreach === 'replied'}
          hasContacted={schema.names.has('contacted')}
          onDone={() => setRound((r) => r + 1)}
        />
      ) : null}

      <XStack gap="$4" flexWrap="wrap" items="flex-start">
        <YStack flex={1} minW={300} maxW={560} width="100%">
          <Card p="$3" borderWidth={1} borderColor="$borderColor">
            <RecordDetail fields={fields} record={row} editable onEditCommit={commit} fieldOptions={fieldOptions} />
          </Card>
        </YStack>
        <YStack flex={1.4} minW={300} width="100%" gap="$3">
          {LINK[obj.collection] ? <Activity obj={obj} id={id} email={email} hasContacted={schema.names.has('contacted')} onLogged={() => setRound((r) => r + 1)} /> : null}
        </YStack>
      </XStack>

      <Related obj={obj} id={id} />
    </YStack>
  )
}

/**
 * A reply, marked by hand. The cloud moves a person's outreach as it files what
 * the org sends and what becomes of it (sent, opened, clicked, bounced); a reply
 * comes back to an inbox the CRM does not read yet, so the team marks it, and a
 * reply is a contact.
 */
function Replied({ id, replied, hasContacted, onDone }: { id: string; replied: boolean; hasContacted: boolean; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <XStack items="center" gap="$3" flexWrap="wrap" data-slot="crm-replied">
      <Button
        size="$2"
        theme={replied ? undefined : 'blue'}
        disabled={busy || replied}
        onPress={async () => {
          setBusy(true)
          setError(null)
          try {
            await CrmApi.update('people', id, { outreach: 'replied', ...(hasContacted ? { contacted: stamp() } : {}) })
            onDone()
          } catch (e) {
            setError(words(e, 'They were not marked replied.'))
          } finally {
            setBusy(false)
          }
        }}
      >
        {replied ? 'Replied' : busy ? 'Marking…' : 'Mark replied'}
      </Button>
      <Text fontSize="$2" color="$color10" flex={1} minW={200}>
        {error ?? REPLIED_BY_HAND}
      </Text>
    </XStack>
  )
}

function Mailable({ email }: { email: string }) {
  const { check, recheck } = useMailable(email)
  return <SuppressionNote email={email} check={check} recheck={recheck} />
}

/** A company's or a person's deals and rounds, whichever pipeline they are in. */
const OPPORTUNITIES: CrmObject = { ...OBJECTS.deals, scope: undefined, plural: 'Opportunities' }

/** What else the CRM holds about this record. */
function Related({ obj, id }: { obj: CrmObject; id: string }) {
  const q = id.replace(/"/g, '')
  if (obj.collection === 'companies') {
    return (
      <YStack gap="$4">
        <Section title="People">
          <Records obj={OBJECTS.people} scope={`company = "${q}"`} embedded defaults={{ company: id }} />
        </Section>
        <Section title="Deals and rounds">
          <Records obj={OPPORTUNITIES} scope={`company = "${q}"`} embedded defaults={{ company: id }} />
        </Section>
      </YStack>
    )
  }
  if (obj.collection === 'people') {
    return (
      <Section title="Deals and rounds">
        <Records obj={OPPORTUNITIES} scope={`contact = "${q}"`} embedded defaults={{ contact: id }} />
      </Section>
    )
  }
  if (obj.collection === 'lists') {
    return (
      <Section title="Members">
        <Records
          obj={OBJECTS.people}
          scope={`list_members_via_person.list ?= "${q}"`}
          embedded
          bulkExtra={(ids, done) => <RemoveFromList list={id} ids={ids} onDone={done} />}
        />
      </Section>
    )
  }
  return null
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <YStack gap="$2">
      <Text fontSize="$5" fontWeight="700" color="$color12">
        {title}
      </Text>
      {children}
    </YStack>
  )
}

function RemoveFromList({ list, ids, onDone }: { list: string; ids: string[]; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <Button
      size="$2"
      disabled={busy}
      onPress={async () => {
        setBusy(true)
        try {
          const members = await CrmApi.list('list_members', { filter: `list = "${list}" && (${ids.map((p) => `person = "${p.replace(/"/g, '')}"`).join(' || ')})`, perPage: 500, skipTotal: true })
          for (const m of members.items) await CrmApi.remove('list_members', String(m.id))
          onDone()
        } catch (e) {
          window.alert(words(e, 'They were not removed.'))
        } finally {
          setBusy(false)
        }
      }}
    >
      {busy ? 'Removing…' : 'Remove from list'}
    </Button>
  )
}

/** The timeline and the ways onto it. */
function Activity({ obj, id, email, hasContacted, onLogged }: { obj: CrmObject; id: string; email: string; hasContacted: boolean; onLogged: () => void }) {
  const { account } = useSession()
  const link = LINK[obj.collection]
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const [kind, setKind] = useState<Kind>('note')
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)
  const [said, setSaid] = useState<string | null>(null)
  useChanges(['activities', 'notes', 'tasks'], () => setRound((r) => r + 1))

  useEffect(() => {
    let live = true
    const q = id.replace(/"/g, '')
    const many = `${link.many} ?= "${q}"`
    // An org without notes or tasks has none to show; any other refusal is said,
    // not read as an empty timeline under a note that was just saved.
    const none = (e: unknown): BaseRecord[] => {
      if (e instanceof ApiError && e.status === 404) return []
      throw e
    }
    Promise.all([
      CrmApi.timeline({ [link.activity]: id } as Parameters<typeof CrmApi.timeline>[0]),
      CrmApi.list('notes', { filter: many, sort: '-created', perPage: 100, skipTotal: true }).then((r) => r.items).catch(none),
      CrmApi.list('tasks', { filter: many, sort: '-created', perPage: 100, skipTotal: true }).then((r) => r.items).catch(none),
    ])
      .then(([acts, notes, tasks]) => {
        if (!live) return
        const all: Entry[] = [
          ...acts.map(fromEvent),
          ...notes.map((n) => ({ id: `n:${n.id}`, kind: 'note', at: time(n.created ?? n.createdAt), title: 'Note', detail: [String(n.title ?? ''), String((n.created_by as { name?: unknown } | undefined)?.name ?? '')].filter(Boolean).join(' · '), body: plain(String(n.body ?? '')), trail: '', answers: [] })),
          ...tasks.map((t) => ({
            id: `t:${t.id}`,
            kind: 'task',
            at: time(t.created ?? t.createdAt),
            title: `Task · ${String(t.status ?? 'todo').replace('_', ' ')}`,
            detail: [String(t.title ?? ''), t.due ? `due ${String(t.due).slice(0, 10)}` : '', t.assignee ? `for ${String(t.assignee)}` : ''].filter(Boolean).join(' · '),
            body: plain(String(t.body ?? '')),
            trail: '',
            answers: [],
          })),
        ]
        all.sort((a, b) => b.at - a.at)
        setEntries(all)
        setError(null)
      })
      .catch((e) => live && setError(words(e, 'The timeline could not be read.')))
    return () => {
      live = false
    }
  }, [id, link, round])

  const me = account?.email || account?.name || ''
  const post = async () => {
    setBusy(true)
    setSaid(null)
    try {
      const body = text.trim()
      if (kind === 'note') {
        if (!body) throw new Error('Write the note.')
        await CrmApi.create('notes', { title: subject.trim() || body.split('\n')[0].slice(0, 80), body: paragraphs(body), [link.many]: [id] })
      } else if (kind === 'task') {
        if (!subject.trim()) throw new Error('Say what is to be done.')
        await CrmApi.create('tasks', { title: subject.trim(), body: body ? paragraphs(body) : '', status: 'todo', assignee: me, due: due ? toBase('date', due) : '', [link.many]: [id] })
      } else if (kind === 'email') {
        if (!subject.trim() || !body) throw new Error('An email needs a subject and a message.')
        const r = await CrmApi.email.sendCrmMail({ to: email, subject: subject.trim(), body, person: obj.collection === 'people' ? id : undefined })
        if (!r.sent) throw new Error(`${email} has opted out: nothing was sent.`)
      } else {
        await CrmApi.create('activities', { kind, direction: 'out', channel: kind, subject: subject.trim() || (kind === 'call' ? 'Call' : 'Meeting'), body: body ? paragraphs(body) : '', at: stamp(), [link.activity]: id })
        if (hasContacted) await CrmApi.update(obj.collection, id, { contacted: stamp() })
      }
      setSubject('')
      setText('')
      setDue('')
      setSaid(kind === 'email' ? 'Sent. It is on the timeline.' : 'Saved.')
      setRound((r) => r + 1)
      onLogged()
    } catch (e) {
      setSaid(words(e, 'That was not saved.'))
    } finally {
      setBusy(false)
    }
  }

  const kinds: Kind[] = ['note', 'call', 'meeting', 'task', ...(email ? (['email'] as Kind[]) : [])]
  return (
    <Card p="$3" borderWidth={1} borderColor="$borderColor" gap="$3" data-slot="crm-activity">
      <XStack gap="$2" flexWrap="wrap" role="tablist">
        {kinds.map((k) => (
          <Button key={k} size="$2" theme={kind === k ? 'blue' : undefined} role="tab" aria-selected={kind === k} onPress={() => setKind(k)}>
            {k === 'call' ? 'Log call' : k === 'meeting' ? 'Log meeting' : k === 'email' ? 'Email' : k === 'task' ? 'Task' : 'Note'}
          </Button>
        ))}
      </XStack>
      <YStack gap="$2">
        {kind === 'note' ? null : (
          <Input size="$3" value={subject} onChangeText={setSubject} placeholder={kind === 'task' ? 'What is to be done' : kind === 'email' ? 'Subject' : 'Summary'} aria-label="Subject" />
        )}
        <Textarea rows={3} value={text} onChangeText={setText} placeholder={kind === 'email' ? `Message to ${email}` : kind === 'task' ? 'Details (optional)' : 'What happened'} aria-label="Text" />
        {kind === 'task' ? <Input size="$3" value={due} onChangeText={setDue} placeholder="Due (YYYY-MM-DD)" aria-label="Due date" /> : null}
        <XStack items="center" gap="$3" flexWrap="wrap">
          <Button size="$3" theme="blue" disabled={busy} onPress={() => void post()}>
            {busy ? 'Saving…' : kind === 'email' ? 'Send' : 'Save'}
          </Button>
          {said ? (
            <Text fontSize="$2" color="$color11" data-slot="crm-said">
              {said}
            </Text>
          ) : null}
        </XStack>
      </YStack>
      <YStack gap="$3" data-slot="crm-timeline">
        {error ? (
          <Text fontSize="$2" color="$red10">
            {error}
          </Text>
        ) : entries === null ? (
          <Text fontSize="$2" color="$color10">
            Reading the timeline…
          </Text>
        ) : entries.length === 0 ? (
          <Text fontSize="$2" color="$color10">
            Nothing on the timeline yet.
          </Text>
        ) : (
          entries.map((e) => (
            <YStack key={e.id} gap="$1" pl="$2" borderLeftWidth={2} borderColor="$borderColor" data-slot="timeline-event" data-kind={e.kind}>
              <XStack items="baseline" justify="space-between" gap="$2" flexWrap="wrap">
                <Text fontSize="$2" fontWeight="700" color="$color12">
                  {e.title}
                </Text>
                <Text fontSize="$1" color="$color10">
                  {e.at ? new Date(e.at * 1000).toLocaleString() : ''}
                </Text>
              </XStack>
              {e.detail ? (
                <Text fontSize="$2" color="$color11">
                  {e.detail}
                </Text>
              ) : null}
              {e.body ? (
                <Text fontSize="$2" color="$color11">
                  {e.body}
                </Text>
              ) : null}
              {e.answers.map((a, i) => (
                <Text key={i} fontSize="$2" color="$color11">
                  <Text fontWeight="600">{`${a.question}: `}</Text>
                  {a.answer}
                </Text>
              ))}
              {e.trail ? (
                <Text fontSize="$1" color="$color10">
                  {e.trail}
                </Text>
              ) : null}
            </YStack>
          ))
        )}
      </YStack>
    </Card>
  )
}
