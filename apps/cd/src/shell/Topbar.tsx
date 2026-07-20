/**
 * The Hanzo CD topbar — the shared shell chrome for the dedicated dashboard: the
 * small Hanzo mark + wordmark (top-left), the environment scope switcher (the CD
 * "project" dimension — main/test/dev, the operator namespaces), a refresh, and
 * sign-out. Lean + self-contained (dark, Geist) so the static SPA has no heavy
 * shell dependency; the org/project↔IAM switcher lights up when /v1/iam is routed
 * on cd.hanzo.ai (today the SuperAdmin cookie sees the whole fleet).
 */

const MARK = (size: number, fill: string) => (
  <svg width={size} height={size} viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M22.21 67V44.6369H0V67H22.21Z" fill={fill} />
    <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill={fill} />
    <path d="M22.21 0H0V22.3184H22.21V0Z" fill={fill} />
    <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill={fill} />
    <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill={fill} />
  </svg>
)

export interface EnvOption {
  id: string
  label: string
  count: number
}

export function Topbar({
  envs,
  env,
  onEnv,
  onRefresh,
  refreshing,
  onSignOut,
}: {
  envs: EnvOption[]
  env: string
  onEnv: (id: string) => void
  onRefresh: () => void
  refreshing?: boolean
  onSignOut: () => void
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderBottom: "1px solid var(--cd-border)",
        background: "var(--cd-surface)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        flexWrap: "wrap",
      }}
    >
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: "var(--cd-fg-strong)" }}>
        <span style={{ display: "inline-flex" }}>{MARK(18, "#fff")}</span>
        <span style={{ fontWeight: 800, letterSpacing: "-0.02em", fontSize: 15 }}>Hanzo CD</span>
      </a>

      {envs.length > 1 ? (
        <div style={{ display: "inline-flex", gap: 2, background: "var(--cd-surface-2)", borderRadius: 8, padding: 2, border: "1px solid var(--cd-border)" }}>
          {[{ id: "", label: "All", count: envs.reduce((n, e) => n + e.count, 0) }, ...envs].map((o) => {
            const on = o.id === env
            return (
              <button
                key={o.id || "all"}
                type="button"
                onClick={() => onEnv(o.id)}
                className="cd-mono"
                style={{
                  border: 0,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 6,
                  background: on ? "var(--cd-border-strong)" : "transparent",
                  color: on ? "var(--cd-fg-strong)" : "var(--cd-fg-muted)",
                }}
              >
                {o.label}
                <span style={{ opacity: 0.6, marginLeft: 5 }}>{o.count}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      <span style={{ flex: 1 }} />

      <button type="button" className="cd-btn" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
      <button type="button" className="cd-btn" onClick={onSignOut}>
        Sign out
      </button>
    </header>
  )
}

export { MARK }
