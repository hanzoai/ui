import { describe, expect, test } from "bun:test"

import {
  DEFAULT_STATUS_PALETTE,
  normalizeServiceStatus,
  statusColors,
  statusLabel,
  statusPulses,
} from "./status"

describe("normalizeServiceStatus", () => {
  test("maps known active words", () => {
    for (const w of [
      "running",
      "live",
      "ready",
      "OK",
      "Succeeded",
      "green",
      "Healthy",
    ]) {
      expect(normalizeServiceStatus(w)).toBe("active")
    }
  })
  test("maps deploying / queued / crashed / sleeping / removed", () => {
    expect(normalizeServiceStatus("building")).toBe("deploying")
    expect(normalizeServiceStatus("provisioning")).toBe("deploying")
    expect(normalizeServiceStatus("queued")).toBe("queued")
    expect(normalizeServiceStatus("pending")).toBe("queued")
    expect(normalizeServiceStatus("failed")).toBe("crashed")
    expect(normalizeServiceStatus("CrashLoopBackOff")).toBe("crashed")
    expect(normalizeServiceStatus("stopped")).toBe("sleeping")
    expect(normalizeServiceStatus("deleting")).toBe("removed")
  })
  test("empty / unknown is honest unknown, never guessed active", () => {
    expect(normalizeServiceStatus("")).toBe("unknown")
    expect(normalizeServiceStatus(undefined)).toBe("unknown")
    expect(normalizeServiceStatus(null)).toBe("unknown")
    expect(normalizeServiceStatus("wat")).toBe("unknown")
  })
  test("compound strings fall back on contained words", () => {
    expect(normalizeServiceStatus("1/2 running")).toBe("active")
    expect(normalizeServiceStatus("deploy in progress")).toBe("deploying")
    expect(normalizeServiceStatus("image pull error")).toBe("crashed")
  })
})

describe("palette + labels", () => {
  test("statusColors honors an override, else default", () => {
    expect(statusColors("active")).toBe(DEFAULT_STATUS_PALETTE.active)
    const custom = { dot: "#000", fg: "#111", soft: "rgba(0,0,0,0.1)" }
    expect(statusColors("active", { active: custom })).toBe(custom)
    // unmapped status in override → default
    expect(statusColors("crashed", { active: custom })).toBe(
      DEFAULT_STATUS_PALETTE.crashed
    )
  })
  test("every status has a palette + label", () => {
    for (const s of [
      "active",
      "deploying",
      "queued",
      "crashed",
      "sleeping",
      "removed",
      "unknown",
    ] as const) {
      expect(DEFAULT_STATUS_PALETTE[s]).toBeDefined()
      expect(typeof statusLabel(s)).toBe("string")
    }
  })
  test("only active + deploying pulse", () => {
    expect(statusPulses("active")).toBe(true)
    expect(statusPulses("deploying")).toBe(true)
    expect(statusPulses("crashed")).toBe(false)
    expect(statusPulses("sleeping")).toBe(false)
  })
})
