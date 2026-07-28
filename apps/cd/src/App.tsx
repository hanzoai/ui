/**
 * Hanzo CD — the dedicated deploy dashboard (cd.hanzo.ai). A static SPA over the
 * cloud CD plane (`/v1/deploy`): the fleet of operator App CRs with health, sync,
 * resource topology, logs, and sync/rollback, built on the shared @hanzo/cd
 * components. Auth is the first-party `hanzo_iam_token` cookie (set by the PKCE
 * login); a missing/expired session lands on the sign-in screen — never a fake row.
 */
import { useCallback, useEffect, useMemo, useState } from "react"

import { DeployApi, hasSession, isAuthError } from "./lib/deploy"
import type { DeployApp } from "./lib/adapt"
import { Topbar, type EnvOption } from "./shell/Topbar"
import { FleetView } from "./views/FleetView"
import { AppView } from "./views/AppView"

const POLL_MS = 20_000

type Phase = "signin" | "loading" | "error" | "ready"

const parseHash = (): string => {
  const m = /^#\/app\/(.+)$/.exec(location.hash)
  return m ? decodeURIComponent(m[1]) : ""
}

function SignIn() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <svg width={52} height={52} viewBox="0 0 64 64" style={{ marginBottom: 18 }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="#fff" />
          <g transform="translate(8,8) scale(0.716)">
            <path d="M22.21 67V44.6369H0V67H22.21Z" fill="#000" />
            <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="#000" />
            <path d="M22.21 0H0V22.3184H22.21V0Z" fill="#000" />
            <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="#000" />
            <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="#000" />
          </g>
        </svg>
        <h2 style={{ fontSize: 22, margin: "0 0 6px", fontWeight: 700 }}>Hanzo CD</h2>
        <p className="cd-muted" style={{ margin: "0 0 26px", fontSize: 14 }}>
          Sign in with your Hanzo account to manage the fleet.
        </p>
        <button type="button" className="cd-btn cd-btn--primary" style={{ width: "100%", justifyContent: "center", padding: "13px 18px" }} onClick={() => (location.href = "/login.html")}>
          Sign in with Hanzo
        </button>
        <div className="cd-muted" style={{ marginTop: 28, fontSize: 12 }}>
          Powered by Hanzo IAM · SuperAdmin access
        </div>
      </div>
    </div>
  )
}

export function App() {
  const [phase, setPhase] = useState<Phase>(hasSession() ? "loading" : "signin")
  const [apps, setApps] = useState<DeployApp[]>([])
  const [errMsg, setErrMsg] = useState("")
  const [env, setEnv] = useState("")
  const [selected, setSelected] = useState<string>(parseHash())
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  const load = useCallback(() => {
    if (!hasSession()) {
      setPhase("signin")
      return
    }
    setRefreshing(true)
    DeployApi.applications()
      .then((rows) => {
        setApps(rows)
        setPhase("ready")
      })
      .catch((e) => {
        if (isAuthError(e)) setPhase("signin")
        else {
          setPhase("error")
          setErrMsg(e instanceof Error ? e.message : "failed to load")
        }
      })
      .finally(() => setRefreshing(false))
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, POLL_MS)
    const onHash = () => setSelected(parseHash())
    window.addEventListener("hashchange", onHash)
    return () => {
      clearInterval(t)
      window.removeEventListener("hashchange", onHash)
    }
  }, [load])

  const notify = useCallback((msg: string, err?: boolean) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const envs: EnvOption[] = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of apps) if (a.env) counts.set(a.env, (counts.get(a.env) ?? 0) + 1)
    return Array.from(counts, ([id, count]) => ({ id, label: id, count })).sort((x, y) => x.id.localeCompare(y.id))
  }, [apps])

  const visibleApps = useMemo(() => (env ? apps.filter((a) => a.env === env) : apps), [apps, env])
  const selectedApp = selected ? apps.find((a) => a.name === selected) ?? null : null

  const openApp = (name: string) => {
    location.hash = `#/app/${encodeURIComponent(name)}`
  }
  const backToFleet = () => {
    location.hash = ""
  }
  const signOut = () => {
    document.cookie = "hanzo_iam_token=; path=/; max-age=0"
    location.href = "/login.html"
  }

  if (phase === "signin") return <SignIn />

  return (
    <div className="cd-app">
      <Topbar envs={envs} env={env} onEnv={setEnv} onRefresh={load} refreshing={refreshing} onSignOut={signOut} />
      <main className="cd-main">
        {phase === "loading" ? (
          <div className="cd-muted" style={{ padding: 40 }}>
            Loading the fleet…
          </div>
        ) : phase === "error" ? (
          <div style={{ padding: 24, border: "1px solid var(--cd-border-strong)", borderRadius: 10, background: "var(--cd-surface)" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Could not reach the deploy plane</div>
            <div className="cd-muted" style={{ fontSize: 14, marginBottom: 14 }}>
              {errMsg || "The CD read (GET /v1/deploy/applications) failed."}
            </div>
            <button type="button" className="cd-btn" onClick={load}>
              Retry
            </button>
          </div>
        ) : selectedApp ? (
          <AppView app={selectedApp} onBack={backToFleet} onChanged={load} notify={notify} />
        ) : (
          <FleetView apps={visibleApps} onOpen={openApp} />
        )}
      </main>

      {toast ? (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            maxWidth: "calc(100vw - 32px)",
            padding: "11px 16px",
            borderRadius: 10,
            background: toast.err ? "#3d1418" : "var(--cd-surface-2)",
            border: `1px solid ${toast.err ? "#E96D76" : "var(--cd-border-strong)"}`,
            color: "var(--cd-fg-strong)",
            fontSize: 13.5,
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          }}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  )
}
