/**
 * Sample data for tests and the demo — a small but realistic application with a
 * mixed-health resource tree, a managed resource carrying a diff, events, logs and
 * a rollback history. Not part of the public component API; just illustrative rows
 * shaped like the `/v1/gitops` payloads.
 */
import type {
  AppEvent,
  AppTreeNode,
  GitopsApplication,
  LogLine,
  ManagedResource,
  ResourceTree,
  RevisionHistory,
} from './types'

const HOUR = 3600_000
const now = () => 1_700_000_000_000

export const demoApp: GitopsApplication = {
  name: 'hanzo-cloud',
  namespace: 'hanzo',
  project: 'default',
  health: 'Degraded',
  sync: 'OutOfSync',
  revision: 'a1b2c3d4e5f6',
  source: { repoURL: 'https://github.com/hanzoai/cloud.git', path: 'deploy', targetRevision: 'main' },
  destination: { server: 'https://kubernetes.default.svc', namespace: 'hanzo' },
  createdAt: now() - 48 * HOUR,
}

export const demoApps: GitopsApplication[] = [
  demoApp,
  { name: 'hanzo-iam', namespace: 'hanzo', project: 'default', health: 'Healthy', sync: 'Synced', revision: 'f00dcafe1234', source: { repoURL: 'https://github.com/hanzoai/iam.git', path: '.' }, createdAt: now() - 120 * HOUR },
  { name: 'hanzo-kms', namespace: 'hanzo', project: 'platform', health: 'Healthy', sync: 'Synced', revision: 'beefbeef5678', source: { repoURL: 'https://github.com/hanzoai/kms.git', path: 'k8s' }, createdAt: now() - 12 * HOUR },
  { name: 'hanzo-chat', namespace: 'hanzo', project: 'platform', health: 'Progressing', sync: 'OutOfSync', revision: 'c0ffee901234', source: { repoURL: 'https://github.com/hanzoai/chat.git', path: 'deploy' }, createdAt: now() - 2 * HOUR },
  { name: 'adnexus-ssp', namespace: 'adnexus', project: 'adtech', health: 'Missing', sync: 'Unknown', source: { repoURL: 'https://github.com/hanzoai/adnexus.git', path: 'ssp' }, createdAt: now() - 1 * HOUR },
]

const node = (
  uid: string,
  kind: string,
  parent: string | undefined,
  health: AppTreeNode['health'],
  sync?: AppTreeNode['sync'],
  name = uid,
): AppTreeNode => ({
  uid,
  kind,
  name,
  namespace: 'hanzo',
  parentRefs: parent ? [{ uid: parent, kind: 'owner', name: parent }] : undefined,
  health,
  sync,
})

// Identity is the uid — the Deployment shares the release name `hanzo-cloud` with
// the Application but has its own uid, and the ReplicaSet owns off the Deployment.
export const demoTree: ResourceTree = {
  nodes: [
    node('hanzo-cloud', 'Application', undefined, { status: 'Degraded' }, 'OutOfSync'),
    node('hanzo-cloud-svc', 'Service', 'hanzo-cloud', { status: 'Healthy' }, 'Synced'),
    node('hanzo-cloud-ing', 'Ingress', 'hanzo-cloud', { status: 'Healthy' }, 'Synced'),
    node('hanzo-cloud-cm', 'ConfigMap', 'hanzo-cloud', { status: 'Healthy' }, 'OutOfSync'),
    node('hanzo-cloud-deploy', 'Deployment', 'hanzo-cloud', { status: 'Degraded' }, 'OutOfSync', 'hanzo-cloud'),
    node('hanzo-cloud-7f9', 'ReplicaSet', 'hanzo-cloud-deploy', { status: 'Progressing' }, 'Synced'),
    node('hanzo-cloud-7f9-abc', 'Pod', 'hanzo-cloud-7f9', { status: 'Healthy' }, 'Synced'),
    node('hanzo-cloud-7f9-def', 'Pod', 'hanzo-cloud-7f9', { status: 'Degraded', message: 'CrashLoopBackOff' }, 'Synced'),
  ],
}

export const demoDeploymentResource: ManagedResource = {
  uid: 'hanzo-cloud-deploy',
  kind: 'Deployment',
  name: 'hanzo-cloud',
  namespace: 'hanzo',
  liveState: [
    'apiVersion: apps/v1',
    'kind: Deployment',
    'metadata:',
    '  name: hanzo-cloud',
    'spec:',
    '  replicas: 2',
    '  template:',
    '    spec:',
    '      containers:',
    '        - name: cloud',
    '          image: ghcr.io/hanzoai/cloud:v1.799.0',
  ].join('\n'),
  targetState: [
    'apiVersion: apps/v1',
    'kind: Deployment',
    'metadata:',
    '  name: hanzo-cloud',
    'spec:',
    '  replicas: 3',
    '  template:',
    '    spec:',
    '      containers:',
    '        - name: cloud',
    '          image: ghcr.io/hanzoai/cloud:v1.799.1',
  ].join('\n'),
}

export const demoEvents: AppEvent[] = [
  { reason: 'ScalingReplicaSet', type: 'Normal', message: 'Scaled up replica set hanzo-cloud-7f9 to 3', count: 1, lastTimestamp: now() - 2 * HOUR },
  { reason: 'BackOff', type: 'Warning', message: 'Back-off restarting failed container cloud in pod hanzo-cloud-7f9-def', count: 7, lastTimestamp: now() - 6 * 60_000 },
]

export const demoLogs: LogLine[] = [
  { timestamp: now() - 3 * 60_000, content: 'INFO  server listening on :8080' },
  { timestamp: now() - 2 * 60_000, content: 'INFO  connected to postgres' },
  { timestamp: now() - 1 * 60_000, content: 'ERROR panic: nil map write (recovered)' },
]

export const demoHistory: RevisionHistory[] = [
  { id: 3, revision: 'a1b2c3d4e5f6', deployedAt: now() - 2 * HOUR },
  { id: 2, revision: 'f0e1d2c3b4a5', deployedAt: now() - 26 * HOUR },
  { id: 1, revision: '0123456789ab', deployedAt: now() - 72 * HOUR },
]
