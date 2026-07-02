import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { TeamManagement } from '../team-management'
import type { TeamClient, TeamMember } from '../client'

// A stub TeamClient so the component test exercises UI + gating without HTTP.
function stubClient(members: TeamMember[]) {
  return {
    listMembers: vi.fn(async () => members),
    invite: vi.fn(async () => {}),
    changeRole: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  } as unknown as TeamClient
}

const MEMBERS: TeamMember[] = [
  { id: 'acme/alice', email: 'alice@acme.co', name: 'Alice', roleKey: 'org:owner', addedAt: '2026-01-01' },
  { id: 'acme/bob', email: 'bob@acme.co', name: 'Bob', roleKey: 'billing:admin', addedAt: '2026-02-01' },
  { id: 'acme/carol', email: 'carol@acme.co', name: 'Carol', roleKey: 'billing:viewer', addedAt: '2026-03-01' },
]

beforeEach(() => cleanup())

describe('<TeamManagement>', () => {
  it('loads and renders members for the app surface', async () => {
    const client = stubClient(MEMBERS)
    render(<TeamManagement app="billing" org="acme" currentUserRoles={['billing:admin']} client={client} />)
    await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument())
    expect(client.listMembers).toHaveBeenCalledWith('billing')
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  it('hides invite controls for a viewer (cannot manage)', async () => {
    const client = stubClient(MEMBERS)
    render(<TeamManagement app="billing" org="acme" currentUserRoles={['billing:viewer']} client={client} />)
    await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument())
    expect(screen.queryByPlaceholderText('colleague@company.com')).not.toBeInTheDocument()
    expect(screen.getByText(/View who has access/i)).toBeInTheDocument()
  })

  it('shows invite for a billing admin, and the role picker offers ONLY assignable roles', async () => {
    const client = stubClient(MEMBERS)
    render(<TeamManagement app="billing" org="acme" currentUserRoles={['billing:admin']} client={client} />)
    await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument())

    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement
    const options = Array.from(roleSelect.options).map((o) => o.value)
    // billing admin may assign billing viewer + admin — and NOT org:owner or console
    expect(options).toEqual(['billing:viewer', 'billing:admin'])
    expect(options).not.toContain('org:owner')
    expect(options).not.toContain('console:admin')
  })

  it('invites via the client with the chosen app-scoped role', async () => {
    const client = stubClient(MEMBERS)
    render(<TeamManagement app="billing" org="acme" currentUserRoles={['billing:admin']} client={client} />)
    await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('colleague@company.com'), { target: { value: 'new@acme.co' } })
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'billing:admin' } })
    fireEvent.click(screen.getByText('Invite'))

    await waitFor(() => expect(client.invite).toHaveBeenCalledWith('billing', 'new@acme.co', 'billing:admin'))
  })

  it('an org owner is not demotable from an app surface (no role picker for owner)', async () => {
    const client = stubClient(MEMBERS)
    render(<TeamManagement app="billing" org="acme" currentUserRoles={['org:owner']} client={client} />)
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    // Alice is org:owner — she has no per-member role <select> / Remove control
    expect(screen.queryByLabelText('Role for Alice')).not.toBeInTheDocument()
    // but Bob (billing:admin) does
    expect(screen.getByLabelText('Role for Bob')).toBeInTheDocument()
  })

  it('changes a member role through the client', async () => {
    const client = stubClient(MEMBERS)
    render(<TeamManagement app="billing" org="acme" currentUserRoles={['org:owner']} client={client} />)
    await waitFor(() => expect(screen.getByText('Carol')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Role for Carol'), { target: { value: 'billing:admin' } })
    await waitFor(() => expect(client.changeRole).toHaveBeenCalledWith('billing', 'acme/carol', 'billing:admin'))
  })

  it('removes a member through the client', async () => {
    const client = stubClient(MEMBERS)
    render(<TeamManagement app="billing" org="acme" currentUserRoles={['billing:admin']} client={client} />)
    await waitFor(() => expect(screen.getByText('Carol')).toBeInTheDocument())

    // Carol's row Remove button
    const carolRow = screen.getByText('Carol').closest('div.flex.flex-wrap') as HTMLElement
    fireEvent.click(carolRow.querySelector('button')!)
    await waitFor(() => expect(client.remove).toHaveBeenCalledWith('billing', 'acme/carol'))
  })

  it('fails safe with no org: shows a sign-in prompt, no fetch, no throw', async () => {
    render(<TeamManagement app="billing" org="" currentUserRoles={[]} />)
    await waitFor(() => expect(screen.getByText(/Sign in to manage your team/i)).toBeInTheDocument())
    // no invite controls without an org
    expect(screen.queryByPlaceholderText('colleague@company.com')).not.toBeInTheDocument()
  })

  it('surfaces client errors', async () => {
    const client = {
      listMembers: vi.fn(async () => {
        throw new Error('Unauthorized operation')
      }),
      invite: vi.fn(),
      changeRole: vi.fn(),
      remove: vi.fn(),
    } as unknown as TeamClient
    const onError = vi.fn()
    render(
      <TeamManagement app="console" org="acme" currentUserRoles={['console:admin']} client={client} onError={onError} />,
    )
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Unauthorized operation'))
    expect(onError).toHaveBeenCalled()
  })
})
