/**
 * The fleet view — every operator App CR as a row, health + sync + revision +
 * source, with the shared @hanzo/cd `GitopsAppList` (search, health/sync
 * filters, sortable). A compact KPI band up top gives the at-a-glance fleet stats.
 * Data-prop-driven: the app fetches `/v1/deploy/applications` and hands the folded
 * rows in; nothing is fabricated.
 */
import { useMemo } from "react"
import { GitopsAppList } from "@hanzo/cd"

import { toGitopsApp, type DeployApp } from "../lib/adapt"

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 104,
        border: "1px solid var(--cd-border-strong)",
        borderRadius: 10,
        padding: "12px 14px",
        background: "var(--cd-surface)",
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, color: tone && value > 0 ? tone : "var(--cd-fg-strong)" }}>{value}</div>
      <div className="cd-muted" style={{ fontSize: 13, marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}

export function FleetView({ apps, onOpen }: { apps: DeployApp[]; onOpen: (name: string) => void }) {
  const gitopsApps = useMemo(() => apps.map(toGitopsApp), [apps])

  const kpi = useMemo(() => {
    const s = { total: 0, healthy: 0, progressing: 0, degraded: 0, outOfSync: 0 }
    for (const a of gitopsApps) {
      s.total++
      if (a.health === "Healthy") s.healthy++
      else if (a.health === "Progressing") s.progressing++
      else if (a.health === "Degraded" || a.health === "Missing") s.degraded++
      if (a.sync === "OutOfSync") s.outOfSync++
    }
    return s
  }, [gitopsApps])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Fleet</h1>
        <p className="cd-muted" style={{ margin: 0, fontSize: 14, maxWidth: "60ch" }}>
          Every Hanzo App reconciled by the operator — declarative, versioned, auto-synced from git to your clusters. Open
          one for its resource tree, logs, and sync/rollback.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Applications" value={kpi.total} />
        <Stat label="Healthy" value={kpi.healthy} tone="#18BE94" />
        <Stat label="Progressing" value={kpi.progressing} tone="#0DADEA" />
        <Stat label="Degraded" value={kpi.degraded} tone="#E96D76" />
        <Stat label="Out of sync" value={kpi.outOfSync} tone="#f4c030" />
      </div>

      <GitopsAppList
        applications={gitopsApps}
        theme="dark"
        view="table"
        onOpen={(a) => onOpen(a.name)}
        emptyLabel="No applications reported by the deploy plane yet."
      />
    </div>
  )
}
