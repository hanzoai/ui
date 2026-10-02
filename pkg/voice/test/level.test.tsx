import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVoice } from "../src/voice.js";

/**
 * The level is LIVE through the snapshot. The hook memoizes its return, but a
 * meter samples between renders — so `level` is a getter onto the module
 * machine, and sixty samples a second see sixty values with zero renders.
 */
describe("voice.level", () => {
  it("starts at 0 and is a live getter, not a frozen field", () => {
    const { result } = renderHook(() => useVoice({ onUtterance: () => {} }));
    expect(result.current.level).toBe(0);
    const d = Object.getOwnPropertyDescriptor(result.current, "level");
    expect(typeof d?.get).toBe("function");
  });
});
