import { describe, expect, it } from 'vitest'
import { createSentinel, type Sentinel } from './sentinel'
import { SentinelError } from './error'

/** Answer is what the stubbed network hands back. */
interface Answer {
  status?: number
  statusText?: string
  /** body is serialized as JSON; text is sent verbatim. */
  body?: unknown
  text?: string
}

/** Sent is one request the client made. */
interface Sent {
  url: string
  method: string
  headers: Record<string, string>
  credentials?: string
  body?: string
}

/** stub replaces the network with a recorder that always answers the same way. */
function stub(answer: Answer = {}) {
  const sent: Sent[] = []
  const fetch = async (input: unknown, init?: RequestInit): Promise<Response> => {
    sent.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers: (init?.headers ?? {}) as Record<string, string>,
      credentials: init?.credentials,
      body: init?.body as string | undefined,
    })
    const status = answer.status ?? 200
    const text =
      answer.text ?? (answer.body === undefined ? '' : JSON.stringify(answer.body))
    return new Response(status === 204 ? null : text, {
      status,
      statusText: answer.statusText ?? '',
    })
  }
  return { sent, fetch: fetch as unknown as typeof globalThis.fetch }
}

/** ok is the envelope the face wraps every answer in. */
const ok = (data: unknown) => ({ body: { status: 'success', data } })

/**
 * The fifteen operations, each pinned to the method and address the o11y
 * plugin's OpenAPI document declares for it. This table is the contract: an
 * operation that moves, or one added without an address, fails here.
 */
const OPERATIONS: Array<{
  name: keyof Sentinel
  method: string
  url: string
  run(sentinel: Sentinel): Promise<unknown>
}> = [
  { name: 'issues', method: 'GET', url: '/v1/sentinel/issues', run: (s) => s.issues() },
  {
    name: 'issue',
    method: 'GET',
    url: '/v1/sentinel/issues/i1',
    run: (s) => s.issue('i1'),
  },
  {
    name: 'updateIssue',
    method: 'PUT',
    url: '/v1/sentinel/issues/i1',
    run: (s) => s.updateIssue('i1', { status: 'resolved' }),
  },
  {
    name: 'issueEvents',
    method: 'GET',
    url: '/v1/sentinel/issues/i1/events?project=p1',
    run: (s) => s.issueEvents('i1', { project: 'p1' }),
  },
  {
    name: 'event',
    method: 'GET',
    url: '/v1/sentinel/events/e1?project=p1',
    run: (s) => s.event('e1', { project: 'p1' }),
  },
  {
    name: 'projects',
    method: 'GET',
    url: '/v1/sentinel/projects',
    run: (s) => s.projects(),
  },
  {
    name: 'createProject',
    method: 'POST',
    url: '/v1/sentinel/projects',
    run: (s) => s.createProject({ name: 'web' }),
  },
  {
    name: 'project',
    method: 'GET',
    url: '/v1/sentinel/projects/p1',
    run: (s) => s.project('p1'),
  },
  {
    name: 'deleteProject',
    method: 'DELETE',
    url: '/v1/sentinel/projects/p1',
    run: (s) => s.deleteProject('p1'),
  },
  {
    name: 'rotateKey',
    method: 'POST',
    url: '/v1/sentinel/projects/p1/keys/rotate',
    run: (s) => s.rotateKey('p1'),
  },
  {
    name: 'logs',
    method: 'GET',
    url: '/v1/sentinel/logs?project=p1',
    run: (s) => s.logs({ project: 'p1' }),
  },
  {
    name: 'stats',
    method: 'GET',
    url: '/v1/sentinel/stats?project=p1',
    run: (s) => s.stats({ project: 'p1' }),
  },
  {
    name: 'traces',
    method: 'GET',
    url: '/v1/sentinel/traces?project=p1',
    run: (s) => s.traces({ project: 'p1' }),
  },
  {
    name: 'trace',
    method: 'GET',
    url: '/v1/sentinel/traces/t1?project=p1',
    run: (s) => s.trace('t1', { project: 'p1' }),
  },
  {
    name: 'discover',
    method: 'POST',
    url: '/v1/sentinel/discover',
    run: (s) => s.discover({ project: 'p1' }),
  },
]

describe('the face', () => {
  it('is fifteen operations and no others', () => {
    expect(OPERATIONS).toHaveLength(15)
    expect(Object.keys(createSentinel()).sort()).toEqual(
      OPERATIONS.map((op) => op.name).sort()
    )
  })

  it.each(OPERATIONS)('$name asks $method $url', async (op) => {
    const net = stub(ok({}))
    await op.run(createSentinel({ fetch: net.fetch }))
    expect(net.sent).toHaveLength(1)
    expect(net.sent[0].method).toBe(op.method)
    expect(net.sent[0].url).toBe(`https://api.hanzo.ai${op.url}`)
  })

  it.each(OPERATIONS)('$name carries the bearer token', async (op) => {
    const net = stub(ok({}))
    await op.run(createSentinel({ fetch: net.fetch, token: 'sess-abc' }))
    expect(net.sent[0].headers.authorization).toBe('Bearer sess-abc')
  })
})

describe('the credential', () => {
  it('is absent from the headers when no token is given', async () => {
    const net = stub(ok({}))
    await createSentinel({ fetch: net.fetch }).projects()
    expect(net.sent[0].headers.authorization).toBeUndefined()
  })

  it('rides the cookie cross-origin', async () => {
    const net = stub(ok({}))
    await createSentinel({ fetch: net.fetch }).projects()
    expect(net.sent[0].credentials).toBe('include')
  })
})

describe('the address', () => {
  it('takes the host it is given', async () => {
    const net = stub(ok({}))
    await createSentinel({ fetch: net.fetch, host: 'https://api.zoo.ngo' }).projects()
    expect(net.sent[0].url).toBe('https://api.zoo.ngo/v1/sentinel/projects')
  })

  it('leaves out a query field the caller did not fill', async () => {
    const net = stub(ok({}))
    await createSentinel({ fetch: net.fetch }).issues({
      period: '24h',
      status: undefined,
      limit: 50,
    })
    expect(net.sent[0].url).toBe(
      'https://api.hanzo.ai/v1/sentinel/issues?period=24h&limit=50'
    )
  })

  it('encodes an id that would otherwise change the path', async () => {
    const net = stub(ok({}))
    await createSentinel({ fetch: net.fetch }).issue('a/b?c')
    expect(net.sent[0].url).toBe('https://api.hanzo.ai/v1/sentinel/issues/a%2Fb%3Fc')
  })
})

describe('the request body', () => {
  it('spells the issue id once, and it reaches both the path and the body', async () => {
    const net = stub(ok({}))
    await createSentinel({ fetch: net.fetch }).updateIssue('i1', {
      status: 'resolved',
      assignee: 'z@hanzo.ai',
    })
    expect(net.sent[0].url).toBe('https://api.hanzo.ai/v1/sentinel/issues/i1')
    expect(JSON.parse(net.sent[0].body!)).toEqual({
      id: 'i1',
      status: 'resolved',
      assignee: 'z@hanzo.ai',
    })
    expect(net.sent[0].headers['content-type']).toBe('application/json')
  })

  it('carries a discover query as the body, not as a query string', async () => {
    const net = stub(ok({ columns: ['type'], rows: [['TypeError']] }))
    const table = await createSentinel({ fetch: net.fetch }).discover({
      project: 'p1',
      groupBy: ['type'],
      period: '7d',
    })
    expect(net.sent[0].url).toBe('https://api.hanzo.ai/v1/sentinel/discover')
    expect(JSON.parse(net.sent[0].body!)).toEqual({
      project: 'p1',
      groupBy: ['type'],
      period: '7d',
    })
    expect(table.rows).toEqual([['TypeError']])
  })

  it('is absent, with no content type, on a read', async () => {
    const net = stub(ok({}))
    await createSentinel({ fetch: net.fetch }).projects()
    expect(net.sent[0].body).toBeUndefined()
    expect(net.sent[0].headers['content-type']).toBeUndefined()
  })
})

describe('the answer', () => {
  it('is what the envelope carried, not the envelope', async () => {
    const net = stub(ok({ items: [{ id: 'i1', count: 3 }], total: 1 }))
    const issues = await createSentinel({ fetch: net.fetch }).issues()
    expect(issues).toEqual({ items: [{ id: 'i1', count: 3 }], total: 1 })
  })

  it('is nothing at all for a delete, which answers 204', async () => {
    const net = stub({ status: 204 })
    await expect(
      createSentinel({ fetch: net.fetch }).deleteProject('p1')
    ).resolves.toBeUndefined()
  })
})

describe('a refusal', () => {
  it('throws the code and the message the face gave', async () => {
    const net = stub({
      status: 403,
      body: { status: 403, code: 'forbidden', error: 'no validated principal' },
    })
    const thrown = await createSentinel({ fetch: net.fetch })
      .issues()
      .catch((error: unknown) => error)

    expect(thrown).toBeInstanceOf(SentinelError)
    const refusal = thrown as SentinelError
    expect(refusal.status).toBe(403)
    expect(refusal.code).toBe('forbidden')
    expect(refusal.message).toBe('no validated principal')
    expect(refusal.body).toEqual({
      status: 403,
      code: 'forbidden',
      error: 'no validated principal',
    })
  })

  it('throws when the edge answers plain text instead of JSON', async () => {
    const net = stub({ status: 404, text: '404 page not found\n' })
    const thrown = await createSentinel({ fetch: net.fetch })
      .project('p1')
      .catch((error: unknown) => error)

    expect(thrown).toBeInstanceOf(SentinelError)
    const refusal = thrown as SentinelError
    expect(refusal.status).toBe(404)
    expect(refusal.code).toBe('')
    expect(refusal.message).toBe('404 page not found')
    expect(refusal.body).toBe('404 page not found\n')
  })

  it('names the status when the refusal says nothing at all', async () => {
    const net = stub({ status: 502, statusText: 'Bad Gateway', text: '' })
    const thrown = await createSentinel({ fetch: net.fetch })
      .projects()
      .catch((error: unknown) => error)

    expect((thrown as SentinelError).message).toBe('502 Bad Gateway')
  })

  it('is a throw on a delete too, never a silent success', async () => {
    const net = stub({ status: 404, body: { code: 'not_found', error: 'no such project' } })
    await expect(
      createSentinel({ fetch: net.fetch }).deleteProject('gone')
    ).rejects.toBeInstanceOf(SentinelError)
  })

  it('never comes back as undefined', async () => {
    const net = stub({ status: 500, statusText: 'Internal Server Error', text: '' })
    let answer: unknown = 'untouched'
    try {
      answer = await createSentinel({ fetch: net.fetch }).issues()
    } catch {
      answer = 'threw'
    }
    expect(answer).toBe('threw')
  })
})
