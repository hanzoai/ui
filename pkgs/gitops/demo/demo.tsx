/**
 * Static demo generator — server-renders the real @hanzo/gitops components over
 * the fixtures into a single self-contained HTML page (`demo/index.html`), so the
 * surface can be seen (and screenshotted) without a running app. Reproduce with:
 *
 *   esbuild demo/demo.tsx --bundle --platform=node --format=esm --jsx=automatic \
 *     '--external:react*' --alias:@hanzo/canvas/pure=../canvas/src/pure.ts \
 *     --outfile=demo/demo.bundle.mjs && node demo/demo.bundle.mjs
 */
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  GITOPS_CSS,
  GitopsAppList,
  GitopsAppTree,
  GitopsNodeInfo,
  GitopsSyncPanel,
  THEME_VARS,
} from '../src/index'
import {
  demoApp,
  demoApps,
  demoDeploymentResource,
  demoEvents,
  demoLogs,
  demoTree,
} from '../src/fixtures'

const deployNode = demoTree.nodes.find((n) => n.kind === 'Deployment')!
const now = 1_700_000_000_000

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return h(
    'section',
    { style: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 } },
    h('h2', { style: { margin: 0, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--hz-fg-muted)' } }, title),
    children,
  )
}

const app = h(
  'div',
  { className: 'hz-gitops', style: { ...THEME_VARS.dark, background: 'var(--hz-surface)', minHeight: '100vh', padding: '28px 32px' } },
  h('header', { style: { marginBottom: 24 } },
    h('h1', { style: { margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--hz-fg-strong)' } }, '@hanzo/gitops'),
    h('p', { style: { margin: '4px 0 0', color: 'var(--hz-fg-muted)', fontSize: 14 } }, 'Argo-CD-class CD/GitOps components — applications list, resource-tree topology, node drill-in, sync & rollback. Presentational, data-prop-driven.'),
  ),
  h(Section, { title: 'Application — sync panel + resource tree + node drill-in' },
    h(GitopsSyncPanel, { app: demoApp, onSync: () => {}, onRefresh: () => {}, onRollback: () => {} }),
    h('div', { style: { display: 'flex', gap: 12, height: 460 } },
      h(GitopsAppTree, { tree: demoTree, height: 460, style: { flex: 1, minWidth: 0 } }),
      h(GitopsNodeInfo, {
        node: deployNode,
        resource: demoDeploymentResource,
        events: demoEvents,
        logs: demoLogs,
        defaultTab: 'diff',
        now,
        style: { width: 440, flexShrink: 0, height: 460 },
      }),
    ),
  ),
  h(Section, { title: 'Applications list' }, h(GitopsAppList, { applications: demoApps, now })),
)

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>@hanzo/gitops demo</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
${GITOPS_CSS}</style></head>
<body>${renderToStaticMarkup(app)}</body></html>`

const out = fileURLToPath(new URL('./index.html', import.meta.url))
writeFileSync(out, html)
console.log('wrote', out, `(${html.length} bytes)`)
