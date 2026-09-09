import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

import { GitopsAppList } from './ApplicationsList'
import { GitopsDiffView } from './DiffView'
import { GitopsNodeInfo } from './NodeInfoPanel'
import { GitopsAppTree } from './ResourceTree'
import { HealthBadge } from './HealthBadge'
import { SyncBadge } from './SyncBadge'
import {
  demoApps,
  demoDeploymentResource,
  demoEvents,
  demoLogs,
  demoTree,
} from './fixtures'
import type { AppTreeNode } from './types'

afterEach(cleanup)

describe('GitopsAppTree', () => {
  it('renders a card per resource with SVG edges', () => {
    const { container } = render(<GitopsAppTree tree={demoTree} />)
    // Distinctly-named nodes are on screen.
    expect(screen.getByText('hanzo-cloud-svc')).toBeTruthy()
    expect(screen.getByText('hanzo-cloud-ing')).toBeTruthy()
    expect(screen.getByText('hanzo-cloud-7f9-abc')).toBeTruthy()
    expect(screen.getByText('hanzo-cloud-7f9-def')).toBeTruthy()
    // Node cards and connective edges are drawn.
    expect(container.querySelectorAll('.hz-gitops-node').length).toBe(demoTree.nodes.length)
    expect(container.querySelectorAll('svg path').length).toBeGreaterThan(0)
  })

  it('collapsing a ReplicaSet hides its pods', () => {
    render(<GitopsAppTree tree={demoTree} />)
    expect(screen.getByText('hanzo-cloud-7f9-abc')).toBeTruthy()
    const rsCard = screen.getByText('hanzo-cloud-7f9').closest('.hz-gitops-node')!
    const toggle = rsCard.parentElement!.querySelector('.hz-gitops-collapse') as HTMLButtonElement
    expect(toggle).toBeTruthy()
    fireEvent.click(toggle)
    expect(screen.queryByText('hanzo-cloud-7f9-abc')).toBeNull()
    expect(screen.queryByText('hanzo-cloud-7f9-def')).toBeNull()
    // The ReplicaSet itself remains.
    expect(screen.getByText('hanzo-cloud-7f9')).toBeTruthy()
  })

  it('selecting a node fires onSelect', () => {
    let picked: AppTreeNode | null = null
    render(<GitopsAppTree tree={demoTree} onSelect={(n) => (picked = n)} />)
    fireEvent.click(screen.getByText('hanzo-cloud-svc'))
    expect(picked).not.toBeNull()
    expect(picked!.kind).toBe('Service')
  })
})

describe('GitopsNodeInfo', () => {
  const node = demoTree.nodes.find((n) => n.kind === 'Deployment')!

  it('shows the live manifest by default and switches to the diff', () => {
    render(<GitopsNodeInfo node={node} resource={demoDeploymentResource} events={demoEvents} logs={demoLogs} />)
    // Manifest tab (default) shows live YAML.
    expect(screen.getByText(/ghcr.io\/hanzoai\/cloud:v1.799.0/)).toBeTruthy()
    // Switch to Diff — the replicas change shows as add + del rows.
    fireEvent.click(screen.getByRole('button', { name: 'Diff' }))
    const del = document.querySelector('.hz-gitops-diff-del')!
    const add = document.querySelector('.hz-gitops-diff-add')!
    expect(del.textContent).toContain('replicas: 2')
    expect(add.textContent).toContain('replicas: 3')
  })

  it('shows events and logs tabs', () => {
    render(<GitopsNodeInfo node={node} resource={demoDeploymentResource} events={demoEvents} logs={demoLogs} />)
    fireEvent.click(screen.getByRole('button', { name: 'Events' }))
    expect(screen.getByText(/Back-off restarting/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Logs' }))
    expect(screen.getByText(/panic: nil map write/)).toBeTruthy()
  })
})

describe('GitopsDiffView', () => {
  it('classes added and removed lines and tallies the stats', () => {
    const { container } = render(
      <GitopsDiffView live={'a\nb\nc'} desired={'a\nB\nc\nd'} />,
    )
    expect(container.querySelectorAll('.hz-gitops-diff-del').length).toBe(1)
    expect(container.querySelectorAll('.hz-gitops-diff-add').length).toBe(2)
    expect(container.textContent).toContain('+2')
    expect(container.textContent).toContain('−1')
  })

  it('reports a clean match honestly', () => {
    render(<GitopsDiffView live={'same\nfile'} desired={'same\nfile'} />)
    expect(screen.getByText(/live matches desired/)).toBeTruthy()
  })
})

describe('badges', () => {
  it('render the status label', () => {
    const { container: h } = render(<HealthBadge status="Degraded" />)
    expect(h.textContent).toContain('Degraded')
    expect(h.querySelector('svg')).toBeTruthy()
    const { container: s } = render(<SyncBadge status="OutOfSync" />)
    expect(s.textContent).toContain('OutOfSync')
  })
})

describe('GitopsAppList', () => {
  it('renders a row per application and filters by search', () => {
    render(<GitopsAppList applications={demoApps} />)
    const table = document.querySelector('.hz-gitops-table') as HTMLElement
    expect(within(table).getByText('hanzo-cloud')).toBeTruthy()
    expect(within(table).getByText('hanzo-iam')).toBeTruthy()
    // Count summary reflects the full set.
    expect(screen.getByText(`${demoApps.length} of ${demoApps.length}`)).toBeTruthy()
    // Search narrows the rows.
    fireEvent.change(screen.getByPlaceholderText('Search applications…'), { target: { value: 'kms' } })
    expect(within(table).getByText('hanzo-kms')).toBeTruthy()
    expect(within(table).queryByText('hanzo-iam')).toBeNull()
    expect(screen.getByText(`1 of ${demoApps.length}`)).toBeTruthy()
  })
})
