import { describe, expect, it } from "vitest"

import {
  applyLayoutToFlow,
  createEmptyFlow,
  createFlowFromTemplate,
  createHttpFlowBackend,
  createMemoryFlowBackend,
  DEFAULT_FLOW_PALETTE,
  DEFAULT_FLOW_TEMPLATES,
  EMBEDDING_MODELS,
  ENSO_MODELS,
  evaluateCondition,
  executeFlowGraph,
  interpolateTemplate,
  layoutFlowGraph,
  validateFlowGraph,
  type FlowDefinition,
  type FlowStorageLike,
} from "./pure"

describe("catalog & models", () => {
  it("lists only the canonical live /v1/models set", () => {
    expect(ENSO_MODELS).toEqual([
      "enso",
      "enso-auto",
      "enso-pro",
      "enso-max",
      "enso-flash",
      "enso-ultra",
      "zen6",
      "zen6-coder",
      "zen6-flash",
      "zen6-max",
    ])
    expect(ENSO_MODELS).toHaveLength(10)
    expect(EMBEDDING_MODELS).toEqual(["zen-embedding-3", "zen-embedding"])
  })

  it("provides palette entries across all 5 categories", () => {
    const categories = new Set(DEFAULT_FLOW_PALETTE.map((p) => p.category))
    expect([...categories].sort()).toEqual([
      "Actions",
      "Enso AI",
      "Logic",
      "Output",
      "Triggers",
    ])
    for (const tpl of DEFAULT_FLOW_TEMPLATES) {
      const flow = createFlowFromTemplate(tpl)
      const res = validateFlowGraph(flow)
      expect(res.valid).toBe(true)
      expect(res.errors).toEqual([])
    }
  })
})

describe("validateFlowGraph", () => {
  it("passes a well-formed DAG workflow", () => {
    const flow = createEmptyFlow("Clean DAG")
    const res = validateFlowGraph(flow)
    expect(res.valid).toBe(true)
    expect(res.errors).toEqual([])
  })

  it("detects multi-node cycles", () => {
    const flow: FlowDefinition = {
      id: "cyclic",
      name: "Cyclic",
      enabled: true,
      updatedAt: "2026-11-24T00:00:00Z",
      nodes: [
        { id: "a", kind: "trigger", subtype: "manual", label: "Start" },
        {
          id: "b",
          kind: "agent",
          label: "Agent B",
          config: { model: "enso", prompt: "Step B" },
        },
        {
          id: "c",
          kind: "agent",
          label: "Agent C",
          config: { model: "enso-pro", prompt: "Step C" },
        },
      ],
      edges: [
        { id: "e1", source: "a", target: "b" },
        { id: "e2", source: "b", target: "c" },
        { id: "e3", source: "c", target: "b" },
      ],
    }
    const res = validateFlowGraph(flow)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.code === "CYCLE_DETECTED")).toBe(true)
    const cyclicNodeIds = res.errors
      .filter((e) => e.code === "CYCLE_DETECTED")
      .map((e) => e.nodeId)
      .sort()
    expect(cyclicNodeIds).toEqual(["b", "c"])
  })

  it("detects self-loops, dangling edges, disconnected nodes, and missing config", () => {
    const flow: FlowDefinition = {
      id: "broken",
      name: "Broken",
      enabled: false,
      updatedAt: "2026-11-24T00:00:00Z",
      nodes: [
        {
          id: "n1",
          kind: "trigger",
          subtype: "schedule",
          label: "Bad Cron",
          config: { cron: "invalid" },
        },
        { id: "n2", kind: "agent", label: "No Model", config: {} },
        {
          id: "n3",
          kind: "action",
          subtype: "http",
          label: "No URL",
          config: {},
        },
        { id: "n4", kind: "condition", label: "No Expr", config: {} },
        { id: "n5", kind: "output", label: "Orphan" },
      ],
      edges: [
        { id: "self", source: "n2", target: "n2" },
        { id: "ghost", source: "n1", target: "missing-node" },
        { id: "ok", source: "n1", target: "n2" },
      ],
    }

    const res = validateFlowGraph(flow)
    expect(res.valid).toBe(false)
    const codes = new Set(res.issues.map((i) => i.code))
    expect(codes.has("CYCLE_DETECTED")).toBe(true)
    expect(codes.has("DANGLING_EDGE")).toBe(true)
    expect(codes.has("DISCONNECTED_NODE")).toBe(true)
    expect(codes.has("MISSING_CONFIG")).toBe(true)
    expect(
      res.warnings.some(
        (w) => w.code === "DISCONNECTED_NODE" && w.nodeId === "n5"
      )
    ).toBe(true)
  })
})

describe("layoutFlowGraph", () => {
  it("is deterministic and byte-identical on repeated invocations", () => {
    const nodes = [{ id: "t" }, { id: "a" }, { id: "b" }, { id: "o" }]
    const edges = [
      { source: "t", target: "a" },
      { source: "t", target: "b" },
      { source: "a", target: "o" },
      { source: "b", target: "o" },
    ]
    expect(layoutFlowGraph(nodes, edges)).toEqual(layoutFlowGraph(nodes, edges))
  })

  it("layers left-to-right topologically and vertically centers columns", () => {
    const nodes = [{ id: "out" }, { id: "b1" }, { id: "b2" }, { id: "trg" }]
    const edges = [
      { source: "trg", target: "b1" },
      { source: "trg", target: "b2" },
      { source: "b1", target: "out" },
      { source: "b2", target: "out" },
    ]
    const pos = Object.fromEntries(
      layoutFlowGraph(nodes, edges, {
        columnGap: 300,
        rowGap: 100,
        originX: 0,
        originY: 0,
      }).map((p) => [p.id, p.position])
    )
    expect(pos.trg).toEqual({ x: 0, y: 50 })
    expect(pos.b1).toEqual({ x: 300, y: 0 })
    expect(pos.b2).toEqual({ x: 300, y: 100 })
    expect(pos.out).toEqual({ x: 600, y: 50 })
  })

  it("handles cycles safely without hanging", () => {
    const nodes = [{ id: "a" }, { id: "b" }, { id: "c" }]
    const edges = [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
      { source: "c", target: "a" },
    ]
    const laid = layoutFlowGraph(nodes, edges)
    expect(laid).toHaveLength(3)
  })

  it("applies layout immutably to a FlowDefinition", () => {
    const flow = createEmptyFlow("Layout Test")
    const laid = applyLayoutToFlow(flow, {
      columnGap: 250,
      originX: 10,
      originY: 10,
    })
    expect(laid.nodes[0].position?.x).toBe(10)
    expect(laid.nodes[1].position?.x).toBe(260)
    expect(laid.nodes[2].position?.x).toBe(510)
  })
})

describe("executeFlowGraph", () => {
  it("executes a branching CRM template along the true path and skips the false path", async () => {
    const flow = createFlowFromTemplate(DEFAULT_FLOW_TEMPLATES[0])
    const run = await executeFlowGraph(flow, {
      name: "Jordan Lee",
      phone: "+15550199999",
      email: "jordan@solar.example",
      score: 92,
    })

    expect(run.status).toBe("succeeded")
    expect(run.flowId).toBe(flow.id)
    expect(run.steps.length).toBe(flow.nodes.length)

    const byId = Object.fromEntries(run.steps.map((s) => [s.nodeId, s]))
    expect(byId["n-trigger"].status).toBe("succeeded")
    expect(byId["n-agent"].status).toBe("succeeded")
    expect(byId["n-cond"].status).toBe("succeeded")
    expect((byId["n-cond"].output as { matched: boolean }).matched).toBe(true)
    expect(byId["n-sms"].status).toBe("succeeded")
    expect(byId["n-email"].status).toBe("skipped")
    expect(byId["n-crm"].status).toBe("succeeded")
    expect(byId["n-out"].status).toBe("succeeded")
  })

  it("routes down the false branch when condition fails", async () => {
    const flow = createFlowFromTemplate(DEFAULT_FLOW_TEMPLATES[0])
    const run = await executeFlowGraph(flow, {
      name: "Sam Patel",
      phone: "+15550188888",
      email: "sam@solar.example",
      score: 35,
    })

    expect(run.status).toBe("succeeded")
    const byId = Object.fromEntries(run.steps.map((s) => [s.nodeId, s]))
    expect((byId["n-cond"].output as { matched: boolean }).matched).toBe(false)
    expect(byId["n-sms"].status).toBe("skipped")
    expect(byId["n-email"].status).toBe("succeeded")
    expect(byId["n-crm"].status).toBe("succeeded")
  })

  it("fails immediately on cyclic graphs", async () => {
    const cyclic: FlowDefinition = {
      id: "c1",
      name: "Loop",
      enabled: true,
      updatedAt: "2026-11-24T00:00:00Z",
      nodes: [
        {
          id: "a",
          kind: "agent",
          label: "A",
          config: { model: "enso", prompt: "a" },
        },
        {
          id: "b",
          kind: "agent",
          label: "B",
          config: { model: "enso", prompt: "b" },
        },
      ],
      edges: [
        { id: "e1", source: "a", target: "b" },
        { id: "e2", source: "b", target: "a" },
      ],
    }
    const run = await executeFlowGraph(cyclic, {})
    expect(run.status).toBe("failed")
    expect(run.error).toContain("Cycle detected")
    expect(run.steps).toEqual([])
  })

  it("invokes custom executor in topological order and isolates failures", async () => {
    const flow = createEmptyFlow("Custom Exec")
    const seen: string[] = []
    const run = await executeFlowGraph(
      flow,
      { text: "hello" },
      async ({ node, input }) => {
        seen.push(node.id)
        if (node.kind === "agent") throw new Error("upstream timeout")
        return { handled: node.id, input }
      }
    )

    expect(seen).toEqual(["node-trigger", "node-agent"])
    expect(run.status).toBe("failed")
    expect(run.error).toBe("upstream timeout")
    const byId = Object.fromEntries(run.steps.map((s) => [s.nodeId, s]))
    expect(byId["node-trigger"].status).toBe("succeeded")
    expect(byId["node-agent"].status).toBe("failed")
    expect(byId["node-output"].status).toBe("skipped")
  })

  it("supports template interpolation and condition helpers", () => {
    expect(
      interpolateTemplate("Hello {{input.name}} ({{input.score}})", {
        input: { name: "Ada", score: 99 },
      })
    ).toBe("Hello Ada (99)")

    expect(evaluateCondition("score >= 70", { score: 75 })).toBe(true)
    expect(evaluateCondition("score >= 70", { score: 40 })).toBe(false)
    expect(
      evaluateCondition("contains:solar", { topic: "Residential Solar" })
    ).toBe(true)
    expect(
      evaluateCondition("status == qualified", { status: "qualified" })
    ).toBe(true)
  })
})

describe("createMemoryFlowBackend", () => {
  it("supports CRUD, toggle, run history, and storage persistence", async () => {
    const store = new Map<string, string>()
    const mockStorage: FlowStorageLike = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => {
        store.set(k, v)
      },
    }

    const starter = createEmptyFlow("Starter", "flow-1")
    const backend = createMemoryFlowBackend([starter], {
      storageKey: "hanzo-flow-test",
      storage: mockStorage,
    })

    const initial = await backend.listFlows()
    expect(initial).toHaveLength(1)
    expect(initial[0].id).toBe("flow-1")

    const toggled = await backend.toggleFlow("flow-1", true)
    expect(toggled.enabled).toBe(true)

    const saved = await backend.saveFlow({ ...toggled, name: "Renamed" })
    expect(saved.name).toBe("Renamed")

    const run = await backend.runFlow("flow-1", { hello: "world" })
    expect(run.status).toBe("succeeded")

    const runs = await backend.listRuns("flow-1")
    expect(runs).toHaveLength(1)
    expect(runs[0].id).toBe(run.id)

    // Re-hydrating from storage restores both flows and run history
    const restored = createMemoryFlowBackend([], {
      storageKey: "hanzo-flow-test",
      storage: mockStorage,
    })
    expect((await restored.listFlows())[0].name).toBe("Renamed")
    expect(await restored.listRuns("flow-1")).toHaveLength(1)

    await backend.deleteFlow("flow-1")
    expect(await backend.listFlows()).toEqual([])
  })
})

describe("createHttpFlowBackend", () => {
  it("sends Hanzo IAM bearer auth to /v1/flows endpoints", async () => {
    const calls: Array<{ url: string; method: string; auth: string | null }> =
      []
    const mockFetch: typeof fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      const url = String(input)
      const headers = new Headers(init?.headers)
      calls.push({
        url,
        method: init?.method ?? "GET",
        auth: headers.get("authorization"),
      })
      if (url.endsWith("/v1/flows")) {
        return new Response(JSON.stringify({ flows: [] }), { status: 200 })
      }
      if (url.endsWith("/runs")) {
        return new Response(
          JSON.stringify({
            run: {
              id: "r1",
              flowId: "f1",
              status: "succeeded",
              startedAt: "2026-11-24T00:00:00Z",
              durationMs: 12,
              steps: [],
            },
          }),
          { status: 200 }
        )
      }
      return new Response(
        JSON.stringify({ flow: createEmptyFlow("Remote", "f1") }),
        { status: 200 }
      )
    }) as typeof fetch

    const http = createHttpFlowBackend({
      baseUrl: "https://flow.hanzo.ai",
      getToken: () => "iam-jwt-token",
      fetchImpl: mockFetch,
    })

    expect(await http.listFlows()).toEqual([])
    const run = await http.runFlow("f1", { ping: true })
    expect(run.id).toBe("r1")
    expect(calls[0]).toEqual({
      url: "https://flow.hanzo.ai/v1/flows",
      method: "GET",
      auth: "Bearer iam-jwt-token",
    })
    expect(calls[1]).toEqual({
      url: "https://flow.hanzo.ai/v1/flows/f1/runs",
      method: "POST",
      auth: "Bearer iam-jwt-token",
    })
  })
})
