import { describe, expect, test } from "bun:test"

import { relativeTime, toEpochMs } from "./time"

const NOW = 1_700_000_000_000 // fixed reference

describe("relativeTime", () => {
  test("honest dash / now for invalid or future", () => {
    expect(relativeTime(undefined, NOW)).toBe("—")
    expect(relativeTime(0, NOW)).toBe("—")
    expect(relativeTime(NaN, NOW)).toBe("—")
    expect(relativeTime(NOW + 5000, NOW)).toBe("now")
    expect(relativeTime(NOW - 1000, NOW)).toBe("now")
  })
  test("scales seconds → years", () => {
    expect(relativeTime(NOW - 30_000, NOW)).toBe("30s ago")
    expect(relativeTime(NOW - 5 * 60_000, NOW)).toBe("5m ago")
    expect(relativeTime(NOW - 3 * 3_600_000, NOW)).toBe("3h ago")
    expect(relativeTime(NOW - 4 * 86_400_000, NOW)).toBe("4d ago")
    expect(relativeTime(NOW - 21 * 86_400_000, NOW)).toBe("3w ago")
    expect(relativeTime(NOW - 60 * 86_400_000, NOW)).toBe("2mo ago")
    expect(relativeTime(NOW - 800 * 86_400_000, NOW)).toBe("2y ago")
  })
})

describe("toEpochMs", () => {
  test("scales epoch seconds to ms, leaves ms alone", () => {
    expect(toEpochMs(1_700_000_000)).toBe(1_700_000_000_000)
    expect(toEpochMs(1_700_000_000_000)).toBe(1_700_000_000_000)
  })
  test("honest undefined for missing / non-positive", () => {
    expect(toEpochMs(0)).toBeUndefined()
    expect(toEpochMs(undefined)).toBeUndefined()
    expect(toEpochMs(null)).toBeUndefined()
  })
})
