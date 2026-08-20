import { describe, it, expect, vi } from 'vitest'
import { TeamClient, TeamError } from '../client'

// A recording fetch mock that answers IAM endpoints from a small in-memory
// fixture, so we can assert the client speaks the exact /v1/iam contract.

interface Call {
  url: string
  method: string
  headers: Record<string, string>
  body?: any
}

function makeFetch(fixture: {
  roles?: any[]
  users?: any[]
  role?: Record<string, any>
}) {
  const calls: Call[] = []
  const impl = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    const headers = (init?.headers ?? {}) as Record<string, string>
    const body = init?.body ? JSON.parse(init.body as string) : undefined
    calls.push({ url, method, headers, body })

    const ok = (data: unknown) =>
      ({ ok: true, status: 200, json: async () => ({ status: 'ok', data }) }) as unknown as Response

    if (url.includes('/v1/iam/get-roles')) return ok(fixture.roles ?? [])
    if (url.includes('/v1/iam/get-users')) return ok(fixture.users ?? [])
    if (url.includes('/v1/iam/get-role')) {
      const id = new URL(url, 'http://x').searchParams.get('id') ?? ''
      const name = id.split('/')[1]
      return ok(fixture.role?.[name] ?? null)
    }
    if (url.includes('/v1/iam/add-invitation')) return ok({ name: body?.name })
    if (url.includes('/v1/iam/send-invitation')) return ok(true)
    if (url.includes('/v1/iam/update-role')) return ok(true)
    return ok(null)
  })
  return { impl: impl as unknown as typeof fetch, calls }
}

describe('TeamClient — /v1/iam contract', () => {
  it('requires an org', () => {
    expect(() => new TeamClient({ org: '' })).toThrow(TeamError)
  })

  it('lists members: joins roles+users, keeps highest role, is org-scoped', async () => {
    const { impl, calls } = makeFetch({
      roles: [
        { owner: 'acme', name: 'billing:viewer', users: ['acme/carol'] },
        { owner: 'acme', name: 'billing:admin', users: ['acme/bob'] },
        { owner: 'acme', name: 'org:owner', users: ['acme/alice'] },
        // another org's role must be ignored even if returned
        { owner: 'globex', name: 'billing:admin', users: ['globex/mallory'] },
        // bob also appears as viewer — highest (admin) must win
        { owner: 'acme', name: 'billing:viewer', users: ['acme/carol', 'acme/bob'] },
      ],
      users: [
        { owner: 'acme', name: 'alice', email: 'alice@acme.co', displayName: 'Alice', createdTime: '2026-01-01' },
        { owner: 'acme', name: 'bob', email: 'bob@acme.co', displayName: 'Bob' },
        { owner: 'acme', name: 'carol', email: 'carol@acme.co', displayName: 'Carol' },
      ],
    })
    const client = new TeamClient({ org: 'acme', getToken: () => 'tok', fetchImpl: impl })
    const members = await client.listMembers('billing')

    // org-scoped: the get-roles + get-users both pass owner=acme
    const rolesCall = calls.find((c) => c.url.includes('get-roles'))!
    expect(rolesCall.url).toContain('owner=acme')
    expect(rolesCall.headers.Authorization).toBe('Bearer tok')

    // globex/mallory excluded; three acme members
    expect(members.map((m) => m.id).sort()).toEqual(['acme/alice', 'acme/bob', 'acme/carol'])
    // highest-role wins for bob
    expect(members.find((m) => m.id === 'acme/bob')!.roleKey).toBe('billing:admin')
    // org owner shown on the billing surface
    expect(members.find((m) => m.id === 'acme/alice')!.roleKey).toBe('org:owner')
    // sorted highest-rank first
    expect(members[0].roleKey).toBe('org:owner')
  })

  it('invite posts add-invitation carrying the role in signupGroup, then sends', async () => {
    const { impl, calls } = makeFetch({})
    const client = new TeamClient({ org: 'acme', getToken: () => 'tok', fetchImpl: impl })
    await client.invite('billing', 'new@acme.co', 'billing:viewer')

    const add = calls.find((c) => c.url.includes('add-invitation'))!
    expect(add.method).toBe('POST')
    expect(add.url).toContain('/v1/iam/add-invitation')
    expect(add.body.owner).toBe('acme')
    expect(add.body.email).toBe('new@acme.co')
    expect(add.body.application).toBe('billing')
    expect(add.body.signupGroup).toBe('billing:viewer') // role carried here
    // and delivery attempted, scoped by id=acme/<name>
    const send = calls.find((c) => c.url.includes('send-invitation'))!
    expect(send.url).toContain('id=acme%2Finvite-billing')
  })

  it('changeRole removes from other app roles then adds to target (guarded update-role)', async () => {
    const { impl, calls } = makeFetch({
      role: {
        'billing:viewer': { owner: 'acme', name: 'billing:viewer', users: ['acme/bob'] },
        'billing:admin': { owner: 'acme', name: 'billing:admin', users: [] },
      },
    })
    const client = new TeamClient({ org: 'acme', getToken: () => 'tok', fetchImpl: impl })
    await client.changeRole('billing', 'acme/bob', 'billing:admin')

    const updates = calls.filter((c) => c.url.includes('update-role'))
    // one update removes bob from billing:viewer, one adds him to billing:admin
    const removed = updates.find((c) => c.body.name === 'billing:viewer')!
    expect(removed.body.users).not.toContain('acme/bob')
    const added = updates.find((c) => c.body.name === 'billing:admin')!
    expect(added.body.users).toContain('acme/bob')
    // every update-role is org-scoped by id
    for (const u of updates) expect(u.url).toContain('id=acme%2F')
  })

  it('remove strips the member from every app role', async () => {
    const { impl, calls } = makeFetch({
      role: {
        'billing:viewer': { owner: 'acme', name: 'billing:viewer', users: ['acme/bob'] },
        'billing:admin': { owner: 'acme', name: 'billing:admin', users: ['acme/bob'] },
      },
    })
    const client = new TeamClient({ org: 'acme', getToken: () => 'tok', fetchImpl: impl })
    await client.remove('billing', 'acme/bob')
    const updates = calls.filter((c) => c.url.includes('update-role'))
    expect(updates.length).toBe(2)
    for (const u of updates) expect(u.body.users).not.toContain('acme/bob')
  })

  it('surfaces IAM masked authz errors as TeamError', async () => {
    const impl = vi.fn(async () =>
      ({ ok: true, status: 200, json: async () => ({ status: 'error', msg: 'Unauthorized operation' }) }) as unknown as Response,
    ) as unknown as typeof fetch
    const client = new TeamClient({ org: 'acme', getToken: () => 'tok', fetchImpl: impl })
    await expect(client.listMembers('billing')).rejects.toThrow('Unauthorized operation')
  })

  it('omits Authorization when no token is available', async () => {
    const { impl, calls } = makeFetch({})
    const client = new TeamClient({ org: 'acme', fetchImpl: impl })
    await client.listMembers('billing')
    expect(calls[0].headers.Authorization).toBeUndefined()
  })
})
