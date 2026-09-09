import { describe, expect, test } from "bun:test"

import { layoutGraph } from "./layout"

describe("layoutGraph", () => {
  test("is deterministic — same graph, byte-identical positions", () => {
    const nodes = [{ id: "a" }, { id: "b" }, { id: "c" }]
    const edges = [{ source: "a", target: "b" }]
    expect(layoutGraph(nodes, edges)).toEqual(layoutGraph(nodes, edges))
  })

  test("layers along edges: domain → app → resource land in columns 0,1,2", () => {
    const nodes = [{ id: "app" }, { id: "db" }, { id: "dom" }]
    const edges = [
      { source: "dom", target: "app" },
      { source: "app", target: "db" },
    ]
    const pos = Object.fromEntries(
      layoutGraph(nodes, edges, { columnGap: 100, rowGap: 100 }).map((p) => [
        p.id,
        p.position,
      ])
    )
    expect(pos.dom.x).toBe(0)
    expect(pos.app.x).toBe(100)
    expect(pos.db.x).toBe(200)
  })

  test("isolated nodes stack in column 0, centered", () => {
    const nodes = [{ id: "x" }, { id: "y" }]
    const laid = layoutGraph(nodes, [], { columnGap: 100, rowGap: 100 })
    expect(laid.every((p) => p.position.x === 0)).toBe(true)
    // two rows centered on axis 50 → y = 0 and 100
    const ys = laid.map((p) => p.position.y).sort((a, b) => a - b)
    expect(ys).toEqual([0, 100])
  })

  test("preserves input order + one position per node", () => {
    const nodes = [{ id: "c" }, { id: "a" }, { id: "b" }]
    const laid = layoutGraph(nodes, [])
    expect(laid.map((p) => p.id)).toEqual(["c", "a", "b"])
  })

  test("a cycle never wedges the layout", () => {
    const nodes = [{ id: "a" }, { id: "b" }, { id: "c" }]
    const edges = [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
      { source: "c", target: "a" },
    ]
    const laid = layoutGraph(nodes, edges)
    expect(laid).toHaveLength(3)
  })

  test("ignores edges referencing missing / self nodes", () => {
    const nodes = [{ id: "a" }, { id: "b" }]
    const edges = [
      { source: "a", target: "ghost" },
      { source: "b", target: "b" },
    ]
    const laid = layoutGraph(nodes, edges, { columnGap: 100 })
    // no valid edge advances a column → both in column 0
    expect(laid.every((p) => p.position.x === 0)).toBe(true)
  })
})
