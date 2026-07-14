import { describe, expect, it } from 'vitest'

import { buildResourceGraph, resourceId } from './tree'
import type { AppTreeNode, ResourceTree } from './types'

// Application → { Service, Deployment, Ingress };
// Deployment → ReplicaSet → { Pod, Pod }.
const ref = (uid: string, kind: string, parent?: string): AppTreeNode => ({
  uid,
  kind,
  name: uid,
  namespace: 'demo',
  parentRefs: parent ? [{ uid: parent, kind: 'owner', name: parent }] : undefined,
  health: { status: 'Healthy' },
})

const tree: ResourceTree = {
  nodes: [
    ref('app-1', 'Application'),
    ref('svc-1', 'Service', 'app-1'),
    ref('deploy-1', 'Deployment', 'app-1'),
    ref('ing-1', 'Ingress', 'app-1'),
    ref('rs-1', 'ReplicaSet', 'deploy-1'),
    ref('pod-1', 'Pod', 'rs-1'),
    ref('pod-2', 'Pod', 'rs-1'),
  ],
}

describe('resourceId', () => {
  it('uses the uid when present', () => {
    expect(resourceId({ uid: 'x', kind: 'Pod', name: 'p' })).toBe('x')
  })
  it('synthesizes a stable key from group/kind/ns/name without a uid', () => {
    expect(resourceId({ group: 'apps', kind: 'Deployment', namespace: 'ns', name: 'web' })).toBe(
      'apps/Deployment/ns/web',
    )
  })
})

describe('buildResourceGraph', () => {
  it('lays out every node with depth by parent references', () => {
    const g = buildResourceGraph(tree)
    expect(g.nodes).toHaveLength(7)
    const depth = Object.fromEntries(g.nodes.map((n) => [n.id, n.depth]))
    expect(depth['app-1']).toBe(0)
    expect(depth['svc-1']).toBe(1)
    expect(depth['deploy-1']).toBe(1)
    expect(depth['ing-1']).toBe(1)
    expect(depth['rs-1']).toBe(2)
    expect(depth['pod-1']).toBe(3)
    expect(depth['pod-2']).toBe(3)
  })

  it('emits an edge per present parent→child link', () => {
    const g = buildResourceGraph(tree)
    const set = new Set(g.edges.map((e) => `${e.source}->${e.target}`))
    expect(set).toContain('app-1->svc-1')
    expect(set).toContain('app-1->deploy-1')
    expect(set).toContain('app-1->ing-1')
    expect(set).toContain('deploy-1->rs-1')
    expect(set).toContain('rs-1->pod-1')
    expect(set).toContain('rs-1->pod-2')
    expect(g.edges).toHaveLength(6)
  })

  it('flags nodes that have children', () => {
    const g = buildResourceGraph(tree)
    const has = Object.fromEntries(g.nodes.map((n) => [n.id, n.hasChildren]))
    expect(has['app-1']).toBe(true)
    expect(has['deploy-1']).toBe(true)
    expect(has['rs-1']).toBe(true)
    expect(has['svc-1']).toBe(false)
    expect(has['pod-1']).toBe(false)
  })

  it('positions deeper nodes further right and normalizes the origin to (0,0)', () => {
    const g = buildResourceGraph(tree)
    const x = Object.fromEntries(g.nodes.map((n) => [n.id, n.x]))
    expect(x['app-1']).toBeLessThan(x['deploy-1'])
    expect(x['deploy-1']).toBeLessThan(x['rs-1'])
    expect(x['rs-1']).toBeLessThan(x['pod-1'])
    const minX = Math.min(...g.nodes.map((n) => n.x))
    const minY = Math.min(...g.nodes.map((n) => n.y))
    expect(minX).toBe(0)
    expect(minY).toBe(0)
    expect(g.width).toBeGreaterThan(0)
    expect(g.height).toBeGreaterThan(0)
  })

  it('is deterministic — the same tree yields byte-identical positions', () => {
    expect(buildResourceGraph(tree)).toEqual(buildResourceGraph(tree))
  })

  it('collapsing a subtree hides its descendants but keeps the node', () => {
    const g = buildResourceGraph(tree, { collapsed: new Set(['rs-1']) })
    const ids = new Set(g.nodes.map((n) => n.id))
    expect(ids.has('rs-1')).toBe(true)
    expect(ids.has('pod-1')).toBe(false)
    expect(ids.has('pod-2')).toBe(false)
    expect(g.nodes.find((n) => n.id === 'rs-1')!.collapsed).toBe(true)
    expect(g.nodes.find((n) => n.id === 'rs-1')!.hasChildren).toBe(true)
    // No edges dangle into hidden nodes.
    for (const e of g.edges) {
      expect(ids.has(e.source)).toBe(true)
      expect(ids.has(e.target)).toBe(true)
    }
  })

  it('treats orphaned nodes as additional roots', () => {
    const withOrphan: ResourceTree = {
      ...tree,
      orphanedNodes: [ref('orphan-1', 'ConfigMap')],
    }
    const g = buildResourceGraph(withOrphan)
    expect(g.nodes.find((n) => n.id === 'orphan-1')!.depth).toBe(0)
  })
})
