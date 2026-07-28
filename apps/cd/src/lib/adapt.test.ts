/**
 * The /v1/deploy → @hanzo/cd adapter — pins the console CD app against cloud's
 * REAL clients/deploy shapes (the hyphenated sync verdict, object manifests,
 * parentRefs tree edges, the logs blob, clean-semver rollback).
 */
import { describe, expect, it } from "vitest"

import {
  normalizeDeployApp,
  parseApplications,
  toGitopsApp,
  toLogLines,
  toManagedResource,
  toResourceTree,
  toRollbackHistory,
} from "./adapt"

describe("toGitopsApp", () => {
  it("folds the hyphenated cloud sync verdict (the foldSync hyphen bug)", () => {
    const a = parseApplications({
      applications: [
        { name: "iam", namespace: "hanzo", env: "main", repository: "ghcr.io/hanzoai/iam", version: "v1.4.11", runningVersion: "v1.4.10", health: "progressing", healthMessage: "rolling", sync: "out-of-sync" },
      ],
    })[0]
    const g = toGitopsApp(a)
    expect(g.sync).toBe("OutOfSync") // 'out-of-sync' must NOT fall through to Unknown
    expect(g.health).toBe("Progressing")
    expect(g.revision).toBe("v1.4.11")
    expect(g.source).toEqual({ repoURL: "ghcr.io/hanzoai/iam" })
    expect(g.message).toBe("rolling")
    expect(g.project).toBe("main")
  })
  it("derives sync from declared-vs-running when the plane omits it", () => {
    const [drift, synced] = parseApplications([
      { name: "a", repository: "r", version: "v2", runningVersion: "v1" },
      { name: "b", repository: "r", version: "v1", runningVersion: "v1" },
    ])
    expect(toGitopsApp(drift).sync).toBe("OutOfSync")
    expect(toGitopsApp(synced).sync).toBe("Synced")
  })
})

describe("parseApplications", () => {
  it("tolerates a bare array and drops nameless rows", () => {
    expect(parseApplications([{ name: "cloud" }, { name: "" }]).map((a) => a.name)).toEqual(["cloud"])
  })
})

describe("toResourceTree", () => {
  it("maps parentRefs[].ref into linking AppTreeNodes (uid == ref token)", () => {
    const tree = toResourceTree({
      nodes: [
        { group: "hanzo.ai", version: "v1", kind: "App", namespace: "hanzo", name: "iam", ref: "hanzo.ai:App:hanzo:iam", parentRefs: [] },
        { group: "apps", version: "v1", kind: "Deployment", namespace: "hanzo", name: "iam", ref: "apps:Deployment:hanzo:iam", health: "progressing", parentRefs: [{ ref: "hanzo.ai:App:hanzo:iam" }] },
      ],
    })
    expect(tree.nodes).toHaveLength(2)
    const dep = tree.nodes.find((n) => n.kind === "Deployment")!
    expect(dep.uid).toBe("apps:Deployment:hanzo:iam")
    expect(dep.parentRefs?.[0].uid).toBe("hanzo.ai:App:hanzo:iam") // matches the App node's uid → the tree links
    expect(dep.health?.status).toBe("Progressing")
  })
})

describe("toManagedResource", () => {
  it("stringifies object manifests + reads the nested desired manifest", () => {
    const m = toManagedResource({
      ref: { group: "apps", version: "v1", kind: "Deployment", namespace: "hanzo", name: "iam", ref: "apps:Deployment:hanzo:iam" },
      liveManifest: { kind: "Deployment", spec: { replicas: 1 } },
      diff: { modified: true, desiredManifest: { kind: "Deployment", spec: { replicas: 2 } } },
    })
    expect(m.uid).toBe("apps:Deployment:hanzo:iam")
    expect(m.liveState).toContain('"replicas": 1')
    expect(m.targetState).toContain('"replicas": 2')
  })
})

describe("toLogLines", () => {
  it("splits the /v1/deploy logs blob and tags the pod", () => {
    const lines = toLogLines({ pod: "iam-abc", logs: "first\nsecond\n" })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toEqual({ content: "first", podName: "iam-abc" })
  })
  it("honest empty when no logs", () => {
    expect(toLogLines({ pod: "", logs: "" })).toEqual([])
  })
})

describe("toRollbackHistory", () => {
  it("offers only clean-semver releases, current excluded, newest first", () => {
    const h = toRollbackHistory("v1.800.1", ["v1.800.0", "latest", "v1.799.15", "v1.800.1", "main"])
    expect(h.map((r) => r.revision)).toEqual(["v1.800.0", "v1.799.15"])
    expect(h[0].id).toBeGreaterThan(h[1].id) // monotonic ids for the dialog
  })
})

// ── the ACTUAL argoproj shape /v1/deploy/applications serves in production ────
// Captured live (cloud v1.801.109). The first cut read only flat keys, so the
// fleet bound to zero rows against real data; this pins the real contract.
describe("live argoproj-shaped application", () => {
  const LIVE = {
    apiVersion: "argoproj.io/v1alpha1",
    kind: "Application",
    metadata: {
      name: "admin-guard",
      namespace: "hanzo",
      uid: "257fcb88-974d-46fc-8ac2-6f8b86a1f15f",
      creationTimestamp: "2026-07-15T05:31:10Z",
      labels: { "hanzo.ai/env": "main", "hanzo.ai/instance": "admin-guard" },
    },
    spec: {
      source: { repoURL: "https://git.hanzo.ai/hanzoai/universe", path: "infra/k8s/operator/crs", targetRevision: "main" },
      destination: { server: "https://kubernetes.default.svc", namespace: "hanzo" },
      project: "default",
    },
    status: {
      sync: { status: "Synced", revision: "v0.1.4" },
      health: { status: "Healthy", message: "Running: available" },
      resources: [],
      summary: { images: ["ghcr.io/hanzoai/admin-guard:v0.1.4"] },
    },
  }

  it("binds name/env/health/sync/revision/repository from the nested shape", () => {
    const a = normalizeDeployApp(LIVE)
    expect(a.name).toBe("admin-guard")
    expect(a.namespace).toBe("hanzo")
    expect(a.env).toBe("main")
    expect(a.health).toBe("Healthy")
    expect(a.sync).toBe("Synced")
    expect(a.version).toBe("v0.1.4")
    expect(a.repository).toBe("ghcr.io/hanzoai/admin-guard")
    expect(a.runningVersion).toBe("v0.1.4")
  })

  it("folds to a Healthy/Synced gitops app (the fleet row renders)", () => {
    const g = toGitopsApp(normalizeDeployApp(LIVE))
    expect(g.name).toBe("admin-guard")
    expect(g.health).toBe("Healthy")
    expect(g.sync).toBe("Synced")
  })

  it("still reads the flat native shape (both wires supported)", () => {
    const a = normalizeDeployApp({ name: "x", health: "degraded", sync: "out-of-sync", version: "v1.2.3" })
    expect(a.name).toBe("x")
    expect(a.health).toBe("degraded")
    expect(toGitopsApp(a).sync).toBe("OutOfSync")
  })
})
