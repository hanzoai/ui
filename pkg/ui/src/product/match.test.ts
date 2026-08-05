import { describe, expect, it } from "vitest"

import { match, survivors, type Op } from "./match"

const route = (group: string, label: string, method = "GET", hint?: string): Op => ({
  id: `${method} /v1/${group}/${label}`,
  group,
  label,
  method,
  hint,
})

const local = (group: string, label: string): Op => ({ id: `${group}:${label}`, group, label })

describe("match", () => {
  it("finds a GET command fuzzily", () => {
    const op = route("projects", "deployments-list")
    expect(match(op, "deployments")).toBeGreaterThan(0)
    expect(match(op, "projects deploy")).toBeGreaterThan(0)
    // subsequence — the letters in order, not adjacent
    expect(match(op, "pjdl")).toBeGreaterThan(0)
    expect(match(op, "billing")).toBe(0)
  })

  it("also reads the summary, so prose is searchable", () => {
    const op = route("o11y", "traces-read", "GET", "Read one distributed trace")
    expect(match(op, "distributed")).toBeGreaterThan(0)
  })

  // The rule this module exists for: typing "delete" must not offer four dozen
  // destructive fleet operations to somebody who wanted to delete a project.
  it("hides an unsafe command from a fuzzy search", () => {
    const op = route("platform", "apps-rollback", "POST")
    expect(match(op, "rollback")).toBe(0)
    expect(match(op, "apps-rollback")).toBe(0)
    expect(match(op, "pl app")).toBe(0)
  })

  it("shows an unsafe command only to an exact prefix of `group label`", () => {
    const op = route("platform", "apps-rollback", "POST")
    expect(match(op, "platform")).toBeGreaterThan(0)
    expect(match(op, "platform apps-roll")).toBeGreaterThan(0)
    expect(match(op, "PLATFORM APPS")).toBeGreaterThan(0) // case is not the point
  })

  it("guards every unsafe method, not just POST", () => {
    for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(match(route("deploy", "artifact-drop", m), "artifact")).toBe(0)
      expect(match(route("deploy", "artifact-drop", m), "deploy art")).toBeGreaterThan(0)
    }
  })

  // 2,323 rows on open is a stalled browser, not a list.
  it("hides every route command until something is typed", () => {
    expect(match(route("projects", "list"), "")).toBe(0)
    expect(match(route("projects", "list"), "   ")).toBe(0)
    expect(match(route("platform", "apps-rollback", "POST"), "")).toBe(0)
  })

  it("always shows a local command — it has no method and nothing to guard", () => {
    const op = local("Navigate to", "Dashboard")
    expect(match(op, "")).toBe(1)
    expect(match(op, "dash")).toBeGreaterThan(0)
    expect(match(op, "zzz")).toBe(0)
  })
})

describe("survivors", () => {
  const ops: Op[] = [
    local("Navigate to", "Dashboard"),
    local("Navigate to", "Connectors"),
    route("projects", "list"),
    route("projects", "create", "POST"),
    route("deploy", "list"),
  ]

  it("opens on the surface's own commands and no routes", () => {
    expect(survivors(ops, "")).toEqual([["Navigate to", [ops[0], ops[1]]]])
  })

  it("keeps the caller's group order and drops groups that match nothing", () => {
    const got = survivors(ops, "list")
    expect(got.map(([g]) => g)).toEqual(["projects", "deploy"])
    expect(got.every(([, items]) => items.length === 1)).toBe(true)
  })

  it("leaves the unsafe command out until it is named", () => {
    expect(survivors(ops, "create").flatMap(([, i]) => i)).toEqual([])
    expect(survivors(ops, "projects cre").flatMap(([, i]) => i.map((o) => o.label))).toEqual([
      "create",
    ])
  })

  it("caps each group, because one keystroke may match hundreds", () => {
    const many = Array.from({ length: 500 }, (_, i) => route("projects", `list-${i}`))
    const [[, items]] = survivors(many, "list", 25)
    expect(items).toHaveLength(25)
    expect(survivors(many, "list").flatMap(([, i]) => i)).toHaveLength(50) // the default
  })

  it("ranks within a group and keeps the caller's order on a tie", () => {
    const exact = route("projects", "list")
    const looser = route("projects", "deployments-list")
    const [[, items]] = survivors([looser, exact], "list")
    expect(items[0]).toBe(exact)
  })
})
