/**
 * RED adversarial suite — feeds hostile / malformed /v1/deploy JSON to the adapter
 * and the shared @hanzo/gitops folds, asserting the view degrades honestly and
 * NEVER (a) crashes, (b) wedges the tree builder into a hang, or (c) mislabels a
 * bad state as Healthy/Synced. Written by Red; not part of Blue's suite.
 */
import { describe, expect, it } from "vitest"
import { buildResourceGraph, foldHealth, foldSync } from "@hanzo/gitops"

import {
  manifestText,
  normalizeDeployApp,
  parseApplications,
  toGitopsApp,
  toLogLines,
  toManagedResource,
  toResourceTree,
  toRollbackHistory,
} from "./adapt"

// A wall-clock guard: proves a call TERMINATES (no infinite loop) fast.
function within<T>(ms: number, fn: () => T): T {
  const t0 = Date.now()
  const out = fn()
  const dt = Date.now() - t0
  expect(dt).toBeLessThan(ms)
  return out
}

// ── A. Robustness: hostile top-level inputs never throw ──────────────────────

describe("RED robustness — malformed payloads never crash", () => {
  const junk: unknown[] = [null, undefined, 42, "str", true, [], {}, { applications: null }, { apps: 7 }, NaN]

  it("parseApplications tolerates any junk → array, never throws", () => {
    for (const j of junk) expect(Array.isArray(parseApplications(j))).toBe(true)
  })
  it("normalizeDeployApp of junk → safe defaults", () => {
    for (const j of junk) {
      const a = normalizeDeployApp(j)
      expect(typeof a.name).toBe("string")
      expect(a.namespace).toBe("hanzo") // default
      expect(Array.isArray(a.endpoints)).toBe(true)
    }
  })
  it("toResourceTree / toManagedResource / toLogLines tolerate junk", () => {
    for (const j of junk) {
      expect(Array.isArray(toResourceTree(j).nodes)).toBe(true)
      expect(() => toManagedResource(j)).not.toThrow()
      expect(Array.isArray(toLogLines(j))).toBe(true)
    }
  })
  it("wrong-typed fields (health object, numeric name) degrade to empty, dropped", () => {
    const rows = parseApplications({ applications: [{ name: 123, health: { evil: 1 }, sync: ["x"] }, { name: "ok" }] })
    expect(rows.map((r) => r.name)).toEqual(["ok"]) // numeric-name row dropped
    const g = toGitopsApp(normalizeDeployApp({ name: "z", health: { nested: true } }))
    expect(g.health).toBe("Unknown") // object health → '' → Unknown, NOT guessed up
  })
})

// ── B. CYCLE SAFETY — the headline #3 case ───────────────────────────────────
// Adversarial parentRefs must not wedge buildResourceGraph into an infinite loop.

const treeJSON = (nodes: object[]) => toResourceTree({ nodes })
const node = (ref: string, kind: string, parents: string[] = []) => ({
  ref,
  kind,
  name: ref,
  namespace: "demo",
  parentRefs: parents.map((p) => ({ ref: p })),
})

describe("RED cycle safety — buildResourceGraph terminates on hostile parentRefs", () => {
  it("self-referencing parent (A→A) terminates; node survives as a root", () => {
    const g = within(1000, () => buildResourceGraph(treeJSON([node("A", "Pod", ["A"])])))
    expect(g.nodes.map((n) => n.id)).toContain("A")
    expect(g.nodes.find((n) => n.id === "A")!.depth).toBe(0)
    expect(g.edges).toHaveLength(0) // self-edge dropped
  })

  // ── HIGH-1 (FIXED): buildResourceGraph used to THROW whenever a node's parent
  // appeared LATER in the array — `children` was seeded lazily per-node, so
  // `children.get(pid)!.push(id)` dereferenced undefined. That is EVERY cycle AND
  // any tree listing a child before its parent (K8s lists are not topologically
  // sorted), and with no error boundary the whole SPA white-screened. `children`
  // is now pre-seeded for every id, so order and cycles are both safe. These are
  // the regression tests: each MUST build a graph, never throw. ───────────────
  it("BENIGN acyclic tree that lists a child before its parent builds", () => {
    // Deployment listed before the Application that owns it — a totally normal,
    // non-adversarial ordering a backend may emit.
    const g = within(1000, () =>
      buildResourceGraph(treeJSON([node("dep", "Deployment", ["app"]), node("app", "Application")])),
    )
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["app", "dep"])
    expect(g.nodes.find((n) => n.id === "app")!.depth).toBe(0)
    expect(g.nodes.find((n) => n.id === "dep")!.depth).toBe(1)
  })

  it("2-cycle with NO external root (A↔B) does not crash", () => {
    const g = within(1000, () =>
      buildResourceGraph(treeJSON([node("A", "Pod", ["B"]), node("B", "Pod", ["A"])])),
    )
    expect(Array.isArray(g.nodes)).toBe(true) // unreachable-from-a-root nodes may drop; must not throw
  })

  it("2-cycle WITH an external root (R→A, A↔B) renders R, A, B", () => {
    const g = within(1000, () =>
      buildResourceGraph(treeJSON([node("R", "App"), node("A", "Pod", ["R", "B"]), node("B", "Pod", ["A"])])),
    )
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["A", "B", "R"])
  })

  it("3-cycle (A→B→C→A) with a root renders 4 nodes", () => {
    const g = within(1000, () =>
      buildResourceGraph(
        treeJSON([node("R", "App"), node("A", "Pod", ["R", "C"]), node("B", "Pod", ["A"]), node("C", "Pod", ["B"])]),
      ),
    )
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["A", "B", "C", "R"])
  })

  it("dangling parent (points at a non-existent uid) → node is a root, no crash", () => {
    const g = within(1000, () => buildResourceGraph(treeJSON([node("A", "Pod", ["ghost-does-not-exist"])])))
    expect(g.nodes.find((n) => n.id === "A")!.depth).toBe(0)
  })

  it("large deep chain (2000 nodes) terminates quickly", () => {
    const chain = Array.from({ length: 2000 }, (_, i) => node(`n${i}`, "Pod", i ? [`n${i - 1}`] : []))
    const g = within(6000, () => buildResourceGraph(treeJSON(chain)))
    expect(g.nodes.length).toBe(2000)
  })

  it("every node self-parents (all self-cycles) → all render as roots, terminates", () => {
    const many = Array.from({ length: 500 }, (_, i) => node(`s${i}`, "Pod", [`s${i}`]))
    const g = within(4000, () => buildResourceGraph(treeJSON(many)))
    expect(g.nodes.length).toBe(500)
  })
})

// ── C. MISLABEL — the fold's one dangerous direction: bad → Healthy/Synced ────

describe("RED mislabel (FIXED) — a BAD state is never up-guessed to a GOOD one", () => {
  it("health words that MEAN broken never fold to Healthy", () => {
    // The positive substring up-guess is gone: unrecognized → honest Unknown.
    expect(foldHealth("Broken")).toBe("Unknown") // contains 'ok'
    expect(foldHealth("revoked")).toBe("Unknown") // cert/token revoked
    expect(foldHealth("invoked")).toBe("Unknown")
    expect(foldHealth("NotReady")).toBe("Unknown") // contains 'ready'
    expect(foldHealth("unavailable")).toBe("Unknown") // contains 'available'
    expect(foldHealth("MinimumReplicasUnavailable")).toBe("Unknown")
    // The canonical vocabulary cloud actually emits still folds exactly:
    expect(foldHealth("healthy")).toBe("Healthy")
    expect(foldHealth("")).toBe("Unknown")
    expect(foldHealth("degraded")).toBe("Degraded")
    expect(foldHealth("CrashLoopBackOff")).toBe("Degraded") // bad-substring — safe direction
  })

  it("sync words that MEAN not-synced never fold to Synced", () => {
    expect(foldSync("notsynced")).toBe("Unknown") // means NOT synced
    expect(foldSync("unsynced")).toBe("Unknown")
    expect(foldSync("NotSynced")).toBe("Unknown")
    // Canonical + separator-normalized cases still fold exactly:
    expect(foldSync("synced")).toBe("Synced")
    expect(foldSync("out-of-sync")).toBe("OutOfSync") // hyphens normalized at the source
    expect(foldSync("out-of-sync".replace(/[-_]/g, ""))).toBe("OutOfSync")
    expect(foldSync("")).toBe("Unknown")
  })

  it("SAFE: a Degraded app is never shown Healthy through the adapter", () => {
    const g = toGitopsApp(normalizeDeployApp({ name: "x", health: "degraded" }))
    expect(g.health).toBe("Degraded")
  })
})

// ── D. Honest sync derivation (no fabricated Synced) ─────────────────────────

describe("RED honest sync — derived state does not fabricate Synced", () => {
  it("missing sync + version drift → OutOfSync", () => {
    expect(toGitopsApp(normalizeDeployApp({ name: "a", version: "v2", runningVersion: "v1" })).sync).toBe("OutOfSync")
  })
  it("missing sync + equal version → Synced (declared==running proxy)", () => {
    expect(toGitopsApp(normalizeDeployApp({ name: "a", version: "v1", runningVersion: "v1" })).sync).toBe("Synced")
  })
  it("missing sync + BOTH versions empty → Synced (''==''), a benign over-report", () => {
    // documents: an app the plane reports with no versions folds to Synced, not Unknown.
    expect(toGitopsApp(normalizeDeployApp({ name: "a" })).sync).toBe("Synced")
  })
})

// ── E. Manifest handling — object/string/circular ────────────────────────────

describe("RED manifest — object/string/circular never throw", () => {
  it("circular object manifest → '' (no throw)", () => {
    const circular: Record<string, unknown> = { kind: "Deployment" }
    circular.self = circular
    expect(manifestText(circular)).toBe("")
    const m = toManagedResource({ ref: "r", liveManifest: circular })
    expect(m.liveState).toBe("")
  })
  it("object manifest → pretty JSON; string manifest → verbatim; null → ''", () => {
    expect(toManagedResource({ ref: "r", liveManifest: { a: 1 } }).liveState).toContain('"a": 1')
    expect(toManagedResource({ ref: "r", liveManifest: "raw yaml here" }).liveState).toBe("raw yaml here")
    expect(toManagedResource({ ref: "r", liveManifest: null }).liveState).toBe("")
  })
  it("a manifest string carrying HTML is passed through as TEXT (React escapes on render)", () => {
    const evil = "<img src=x onerror=alert(document.cookie)>"
    // The adapter must NOT interpret it; it stays a plain string (rendered via {text}).
    expect(toManagedResource({ ref: "r", liveManifest: evil }).liveState).toBe(evil)
  })
})

// ── F. Logs — array gap + unbounded blob (no client cap) ─────────────────────

describe("RED logs (FIXED) — fidelity + bound", () => {
  it("logs delivered as an ARRAY yield lines (blob AND array shapes)", () => {
    expect(toLogLines({ pod: "p", logs: ["line-1", "line-2"] })).toEqual([
      { content: "line-1", podName: "p" },
      { content: "line-2", podName: "p" },
    ])
    // the blob shape still works
    expect(toLogLines({ pod: "p", logs: "a\nb" }).map((l) => l.content)).toEqual(["a", "b"])
  })
  it("a huge blob is line-capped client-side (keeps the most recent lines)", () => {
    const blob = Array.from({ length: 50_000 }, (_, i) => `l${i}`).join("\n")
    const out = toLogLines({ pod: "p", logs: blob })
    expect(out.length).toBe(2000) // MAX_LOG_LINES
    expect(out[out.length - 1].content).toBe("l49999") // tail kept, not head
  })
  it("a single enormous line is clamped (no one-megabyte text node)", () => {
    const huge = "x".repeat(50_000)
    const out = toLogLines({ pod: "p", logs: huge })
    expect(out[0].content.length).toBeLessThanOrEqual(4001) // MAX_LOG_LINE + ellipsis
  })
})

// ── G. Rollback semver filter — injection + hygiene ──────────────────────────

describe("RED rollback — only clean semver, current excluded, no injection", () => {
  it("drops non-semver + injection-shaped tags, excludes current, newest-first, dedupes", () => {
    const h = toRollbackHistory("v1.800.1", [
      "v1.800.0",
      "latest",
      "main",
      "deadbeef",
      "v1.800.1", // == current → excluded
      "v1.799.15",
      "v1.799.15", // dup
      "v1.2.3; rm -rf /", // injection shape → not semver → dropped
      "'; DROP TABLE apps;--",
    ])
    expect(h.map((r) => r.revision)).toEqual(["v1.800.0", "v1.799.15"])
    expect(h[0].id).toBeGreaterThan(h[1].id)
  })
  it("pre-release semver IS offered as a rollback target (documents the accepted grammar)", () => {
    const h = toRollbackHistory("v2.0.0", ["v1.9.9-rc.1", "v1.9.9"])
    expect(h.map((r) => r.revision)).toContain("v1.9.9-rc.1")
  })
  it("empty history → []", () => {
    expect(toRollbackHistory("v1.0.0", [])).toEqual([])
  })
})
