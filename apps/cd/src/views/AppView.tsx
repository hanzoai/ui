/**
 * The application detail — the ArgoCD-grade drill-in, composed from the shared
 * @hanzo/cd components: `GitopsSyncPanel` (health/sync/revision + Sync /
 * Refresh / History), `GitopsAppTree` (the owned-resource topology), `GitopsNodeInfo`
 * (a node's manifest / desired-vs-live diff / events / logs), and `GitopsRollbackDialog`.
 *
 * Composed (not the fixed `GitopsAppDetails`) so a node's manifest + logs are
 * fetched LAZILY on selection (the plane's `/resource` + `/logs` reads) rather than
 * pre-fetched for the whole tree. Every effect is a real `/v1/deploy` call; honest
 * loading/empty/error states, never fabricated.
 */
import { useCallback, useEffect, useState } from "react"
import {
  GitopsAppTree,
  GitopsNodeInfo,
  GitopsRollbackDialog,
  GitopsSyncPanel,
  type AppTreeNode,
  type LogLine,
  type ManagedResource,
  type ResourceTree,
  type SyncOptions,
} from "@hanzo/cd"

import { DeployApi } from "../lib/deploy"
import { toGitopsApp, toRollbackHistory, type DeployApp } from "../lib/adapt"

export function AppView({
  app,
  onBack,
  onChanged,
  notify,
}: {
  app: DeployApp
  onBack: () => void
  onChanged: () => void
  notify: (msg: string, err?: boolean) => void
}) {
  const gitopsApp = toGitopsApp(app)
  const [tree, setTree] = useState<ResourceTree | null | undefined>(undefined)
  const [treeErr, setTreeErr] = useState<string>("")
  const [logs, setLogs] = useState<LogLine[]>([])
  const [selected, setSelected] = useState<AppTreeNode | null>(null)
  const [resource, setResource] = useState<ManagedResource | undefined>(undefined)
  const [rollbackOpen, setRollbackOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const history = toRollbackHistory(app.version, app.revisions)

  const load = useCallback(() => {
    let live = true
    setTree(undefined)
    setTreeErr("")
    setSelected(null)
    DeployApi.tree(app.name)
      .then((t) => live && setTree(t))
      .catch((e) => {
        if (live) {
          setTree(null)
          setTreeErr(e instanceof Error ? e.message : "failed to load")
        }
      })
    DeployApi.logs(app.name)
      .then((l) => live && setLogs(l))
      .catch(() => live && setLogs([]))
    return () => {
      live = false
    }
  }, [app.name])
  useEffect(() => load(), [load])

  const onSelect = useCallback(
    (node: AppTreeNode | null) => {
      setSelected(node)
      setResource(undefined)
      if (!node) return
      DeployApi.resource(app.name, node.uid ?? "")
        .then(setResource)
        .catch(() => setResource(undefined))
    },
    [app.name],
  )

  const onSync = useCallback(
    async (_opts: SyncOptions) => {
      setBusy(true)
      try {
        await DeployApi.sync(app.name)
        notify(`Sync requested for ${app.name}`)
        onChanged()
        load()
      } catch (e) {
        notify(`Sync failed: ${e instanceof Error ? e.message : e}`, true)
      } finally {
        setBusy(false)
      }
    },
    [app.name, notify, onChanged, load],
  )

  const onRollback = useCallback(
    async (revision: string) => {
      setBusy(true)
      try {
        await DeployApi.rollback(app.name, revision)
        notify(`Rolled back ${app.name} → ${revision}`)
        onChanged()
        load()
      } catch (e) {
        notify(`Rollback failed: ${e instanceof Error ? e.message : e}`, true)
      } finally {
        setBusy(false)
      }
    },
    [app.name, notify, onChanged, load],
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="cd-btn" onClick={onBack}>
          ← Fleet
        </button>
        <span className="cd-muted">/</span>
        <span className="cd-mono" style={{ color: "var(--cd-fg-strong)", fontWeight: 700 }}>
          {app.name}
        </span>
        {app.env ? (
          <span className="cd-mono cd-muted" style={{ fontSize: 12 }}>
            · {app.env}
          </span>
        ) : null}
      </div>

      <GitopsSyncPanel
        app={gitopsApp}
        theme="dark"
        busy={busy}
        onSync={onSync}
        onRefresh={load}
        onRollback={() => setRollbackOpen(true)}
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        {tree === undefined ? (
          <div className="cd-muted" style={{ padding: 24 }}>
            Loading topology…
          </div>
        ) : tree === null ? (
          <div className="cd-muted" style={{ padding: 24 }}>
            Could not load the resource tree{treeErr ? `: ${treeErr}` : ""}.
          </div>
        ) : tree.nodes.length === 0 ? (
          <div className="cd-muted" style={{ padding: 24 }}>
            No owned resources reported.
          </div>
        ) : (
          <>
            <GitopsAppTree
              tree={tree}
              theme="dark"
              onSelect={onSelect}
              selectedId={selected?.uid ?? null}
              height={400}
              style={{ flex: 1, minWidth: 280 }}
            />
            {selected ? (
              <GitopsNodeInfo
                node={selected}
                theme="dark"
                resource={resource}
                logs={logs}
                onClose={() => onSelect(null)}
                style={{ width: "min(440px, 100%)", height: 400, flexShrink: 0 }}
              />
            ) : null}
          </>
        )}
      </div>

      <GitopsRollbackDialog
        open={rollbackOpen}
        history={history}
        theme="dark"
        busy={busy}
        onClose={() => setRollbackOpen(false)}
        onRollback={(entry) => {
          setRollbackOpen(false)
          void onRollback(entry.revision)
        }}
      />
    </div>
  )
}
