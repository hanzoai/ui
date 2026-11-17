import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import type { Account } from './host'
import { managesSuppressions, unmailable } from '../crm/suppression'
import { CrmApi, judge, normalizeTimelineEvent, reached, refusalsOf, type VerifyWire } from './crm'
import { ApiError, configureCrm } from './host'

/**
 * A host over the global fetch, as an app's own REST client is: JSON in and out,
 * and a refusal rejected with its status and body.
 */
const fetchHost = (origin: string): void => {
  const send = async <T>(method: string, url: string, body?: unknown): Promise<T> => {
    const res = await fetch(url, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    const json: unknown = res.status === 204 ? null : await res.json()
    if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status, json)
    return json as T
  }
  configureCrm({
    v1Url: (path) => `${origin}/v1/${path}`,
    get: (url) => send('GET', url),
    post: (url, body) => send('POST', url, body),
    del: (url) => send('DELETE', url),
    base: () => {
      throw new Error('no Base in this suite')
    },
    org: () => 'acme',
    leaveOrg: () => {},
    brand: () => ({ brandName: 'Hanzo', websiteUrl: 'https://hanzo.ai' }),
    gated: false,
    useSession: () => ({ account: null, signOut: () => {} }),
    useRouter: () => ({ push: () => {}, replace: () => {} }),
    useSearchParams: () => null,
  })
}

const pass = { status: 'pass' as const }

describe('judge — POST /v1/email/verify read', () => {
  it('passes an address every check passed', () => {
    const w: VerifyWire = {
      email: 'ada@acme.com',
      checks: { syntax: { ...pass, domain: 'acme.com' }, domain: pass, mx: pass, classification: { ...pass, free: false } },
    }
    expect(judge('ada@acme.com', w)).toMatchObject({ status: 'verified', valid: true, reachable: 'yes', hasMx: true, domain: 'acme.com', reason: 'ok' })
  })

  it('fails on the first failing check, with its reason', () => {
    const w: VerifyWire = { email: 'x@nowhere.zz', checks: { syntax: pass, domain: { status: 'fail', reason: 'domain_not_found' }, mx: { status: 'fail', reason: 'no_mx_records' } } }
    expect(judge('x@nowhere.zz', w)).toMatchObject({ status: 'invalid', valid: false, reachable: 'no', reason: 'domain_not_found', hasMx: false })
  })

  it('calls a disposable domain disposable, not verified', () => {
    const w: VerifyWire = { email: 'a@mailinator.com', checks: { syntax: pass, domain: pass, mx: pass, classification: { ...pass, disposable: true } } }
    expect(judge('a@mailinator.com', w)).toMatchObject({ status: 'disposable', valid: false, reachable: 'no', disposable: true })
  })

  it('leaves an inconclusive check unverified, never verified', () => {
    const w: VerifyWire = { email: 'a@b.co', checks: { syntax: pass, domain: { status: 'unknown', reason: 'dns_lookup_error' }, mx: pass } }
    expect(judge('a@b.co', w)).toMatchObject({ status: 'unverified', valid: false, reachable: 'unknown', reason: 'check_inconclusive' })
  })

  it('treats an answer with no checks as unverified', () => {
    expect(judge('a@b.co', { email: 'a@b.co' })).toMatchObject({ status: 'unverified', valid: false, reason: 'nothing_checked' })
  })

  it('fails a mailbox the smtp check refused, and keeps the typo suggestion', () => {
    const w: VerifyWire = {
      email: 'a@gmial.com',
      checks: { syntax: pass, domain: pass, mx: pass, smtp: { status: 'fail', reason: 'mailbox_not_found' } },
      suggestions: [{ email: 'a@gmail.com', reason: 'domain_typo' }],
    }
    expect(judge('a@gmial.com', w)).toMatchObject({ status: 'invalid', reason: 'mailbox_not_found', suggestion: 'a@gmail.com' })
  })
})

describe('normalizeTimelineEvent — an activity the cloud filed', () => {
  it('reads crm.FileMail\'s email activity', () => {
    const e = normalizeTimelineEvent({
      id: 'a1',
      kind: 'email',
      direction: 'out',
      subject: 'Your Hanzo code',
      snippet: 'Thanks for applying',
      at: '2026-10-25T10:00:00Z',
      person: 'p1',
      data: { to: 'ada@acme.com', by: 'z@hanzo.ai' },
    })
    expect(e).toMatchObject({ id: 'a1', kind: 'email', direction: 'out', subject: 'Your Hanzo code', to: 'ada@acme.com', by: 'z@hanzo.ai', status: 'sent', rail: '', events: [] })
    expect(e.at).toBeGreaterThan(0)
  })

  it('carries the status, rail, reason and the report trail the cloud files in data', () => {
    const e = normalizeTimelineEvent({
      id: 'a2', kind: 'email', source_id: 'mail:m1', subject: 'Hi', at: '2026-10-25T10:00:00Z',
      data: {
        to: 'x@y.co', status: 'bounced', rail: 'ses', reason: 'mailbox does not exist',
        events: [{ status: 'delivered', at: '2026-10-25T10:00:05Z' }, { status: 'bounced', at: '2026-10-25T10:01:00Z' }, { status: 'opened' }],
      },
    })
    expect(e).toMatchObject({ status: 'bounced', rail: 'ses', reason: 'mailbox does not exist' })
    expect(e.events.map((x) => x.status)).toEqual(['delivered', 'bounced'])
  })

  it('reads a status the cloud does not name as sent', () => {
    expect(normalizeTimelineEvent({ id: 'a3', kind: 'email', data: { status: 'teleported' } }).status).toBe('sent')
  })

  it('survives garbage', () => {
    expect(normalizeTimelineEvent(null)).toMatchObject({ id: '', kind: '', subject: '' })
  })
})

describe('reached — a mail that got to the inbox', () => {
  it('counts a delivered, opened or clicked mail, and nothing short of it', () => {
    expect(['delivered', 'opened', 'clicked'].every((s) => reached(s as never))).toBe(true)
    expect(['sent', 'bounced', 'suppressed', 'failed'].some((s) => reached(s as never))).toBe(false)
  })
})

describe('refusalsOf — the recipients POST /v1/email would not send to', () => {
  it('reads each refusal and drops the malformed', () => {
    expect(refusalsOf([{ address: 'a@b.co', status: 422, reason: 'suppressed' }, { reason: 'no address' }, 'junk'])).toEqual([
      { address: 'a@b.co', status: 422, reason: 'suppressed' },
    ])
    expect(refusalsOf(null)).toEqual([])
  })
})

describe('the send gate, one address at a time', () => {
  const ORIGIN = 'https://api.hanzo.ai'
  const fetched: { url: string; method: string; body?: string }[] = []
  let reply: { status: number; json: unknown } = { status: 200, json: {} }

  beforeEach(() => {
    fetched.length = 0
    ;(globalThis as { window?: unknown }).window = { location: { origin: ORIGIN, hostname: 'crm.hanzo.ai' } }
    fetchHost(ORIGIN)
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      fetched.push({ url, method: init?.method ?? 'GET', body: init?.body as string | undefined })
      return Promise.resolve(
        reply.status === 204
          ? new Response(null, { status: 204 })
          : new Response(JSON.stringify(reply.json), { status: reply.status, headers: { 'content-type': 'application/json' } }),
      )
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete (globalThis as { window?: unknown }).window
  })

  it('asks the check route by address, lower-cased', async () => {
    reply = { status: 200, json: { suppressed: false } }
    expect(await CrmApi.marketing.checkSuppression(' Ada@Acme.com ')).toEqual({ state: 'clear' })
    expect(fetched[0].url).toContain('/v1/marketing/suppressions/check?address=ada%40acme.com')
    expect(fetched[0].method).toBe('GET')
  })

  it('names the scope and reason of a refusal', async () => {
    reply = { status: 200, json: { suppressed: true, reason: 'one-click unsubscribe', scope: 'domain' } }
    expect(await CrmApi.marketing.checkSuppression('a@acme.com')).toEqual({ state: 'suppressed', reason: 'one-click unsubscribe', scope: 'domain' })
  })

  it('reads a cloud without the check as unknown, never as not suppressed', async () => {
    reply = { status: 404, json: { error: 'not found' } }
    const c = await CrmApi.marketing.checkSuppression('a@acme.com')
    expect(c.state).toBe('unknown')
    expect(fetched).toHaveLength(1)
    expect(fetched[0].url).not.toMatch(/suppressions(\?|$)/)
  })

  it('reads an answer without a verdict as unknown', async () => {
    reply = { status: 200, json: { ok: true } }
    expect((await CrmApi.marketing.checkSuppression('a@acme.com')).state).toBe('unknown')
  })

  it('re-subscribes an address by the query, lower-cased', async () => {
    reply = { status: 204, json: null }
    await CrmApi.marketing.removeSuppression(' A@Acme.com')
    expect(fetched[0].method).toBe('DELETE')
    expect(fetched[0].url).toMatch(/\/v1\/marketing\/suppressions\?address=a%40acme\.com&channel=email$/)
    expect(fetched[0].body).toBeUndefined()
  })

  it('re-subscribes a company by its "@domain" entry', async () => {
    reply = { status: 204, json: null }
    await CrmApi.marketing.removeSuppression('@acme.com')
    expect(fetched[0].url).toMatch(/\?address=%40acme\.com&channel=email$/)
  })

  it('suppresses a company as the "@domain" entry', async () => {
    reply = { status: 200, json: { channel: 'email', address: '@acme.com', reason: 'company opt-out', createdAt: 1 } }
    await CrmApi.marketing.suppressCompany('Acme.com', 'company opt-out')
    expect(fetched[0].method).toBe('POST')
    expect(JSON.parse(fetched[0].body ?? '{}')).toEqual({ channel: 'email', address: '@acme.com', reason: 'company opt-out' })
  })

  it('sends one message per recipient and names each refusal', async () => {
    reply = {
      status: 200,
      json: { messages: [{ id: 'm1', status: 'queued', to: ['a@acme.com'], created_at: '2026-10-25T10:00:00Z', provider_id: 'ses-1' }], refused: [{ address: 'b@acme.com', status: 422, reason: 'suppressed' }] },
    }
    const r = await CrmApi.email.sendMessage({ to: ['a@acme.com', 'b@acme.com'], subject: 'Hi' })
    expect(r.messages.map((m) => m.provider_id)).toEqual(['ses-1'])
    expect(r.refused).toEqual([{ address: 'b@acme.com', status: 422, reason: 'suppressed' }])
  })

  it('reads a 422 for every recipient as the refusals, not a thrown error', async () => {
    reply = { status: 422, json: { messages: [], refused: [{ address: 'b@acme.com', status: 422, reason: 'suppressed' }] } }
    const r = await CrmApi.email.sendMessage({ to: ['b@acme.com'], subject: 'Hi' })
    expect(r).toEqual({ messages: [], refused: [{ address: 'b@acme.com', status: 422, reason: 'suppressed' }] })
  })

  it('still throws a refusal that names no recipient', async () => {
    reply = { status: 500, json: { error: 'rail down' } }
    await expect(CrmApi.email.sendMessage({ to: ['a@acme.com'], subject: 'Hi' })).rejects.toThrow()
  })

  it('classifies a business domain, and says nothing when the verifier cannot', async () => {
    reply = { status: 200, json: { email: 'a@acme.com', checks: { syntax: { status: 'pass', domain: 'acme.com' }, classification: { status: 'pass', free: false } } } }
    expect(await CrmApi.email.classify('a@acme.com')).toEqual({ domain: 'acme.com', free: false })
    reply = { status: 429, json: { error: 'slow down' } }
    expect(await CrmApi.email.classify('a@acme.com')).toBeNull()
  })
})

describe('who may change the list, and what a refusal says', () => {
  it('admits an admin of the org and a SuperAdmin, and no one else', () => {
    const who = (a: Partial<Account>): Account => ({ name: 'ada', ...a })
    expect(managesSuppressions(who({ adminOrgs: ['acme'] }), 'acme')).toBe(true)
    expect(managesSuppressions(who({ superAdmin: true, adminOrgs: [] }), 'acme')).toBe(true)
    expect(managesSuppressions(who({ adminOrgs: ['other'] }), 'acme')).toBe(false)
    expect(managesSuppressions(null, 'acme')).toBe(false)
  })

  it('says which list refused the address', () => {
    expect(unmailable({ state: 'suppressed', scope: 'domain', reason: 'asked' })).toBe("Not mailable: their company's domain is on the suppression list (asked).")
    expect(unmailable({ state: 'suppressed', scope: 'platform' })).toBe('Not mailable: the address is on the platform blocklist.')
    expect(unmailable({ state: 'suppressed' })).toBe('Not mailable: this address is on the suppression list.')
    expect(unmailable({ state: 'clear' })).toBeNull()
    expect(unmailable({ state: 'unknown', why: 'x' })).toBeNull()
  })
})
