import { afterEach, describe, expect, it, vi } from "vitest";
import { capture, choose } from "../src/mic";

const scope = (impl: (c: MediaStreamConstraints) => Promise<MediaStream>) => ({
  navigator: { mediaDevices: { getUserMedia: vi.fn(impl) } } as unknown as Navigator,
});
const stream = {} as MediaStream;

afterEach(() => choose(null));

describe("capture", () => {
  it("opens the system's default when nothing is chosen", async () => {
    const s = scope(async () => stream);
    await capture(s);
    const asked = (s.navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(asked.audio.deviceId).toBeUndefined();
  });

  it("opens the chosen input", async () => {
    choose("usb-1");
    const s = scope(async () => stream);
    await capture(s);
    const asked = (s.navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(asked.audio.deviceId).toEqual({ exact: "usb-1" });
  });

  it("falls back to the default when the chosen input is gone", async () => {
    choose("gone");
    const s = scope(async (c) => {
      if ((c.audio as MediaTrackConstraints).deviceId) throw Object.assign(new Error("x"), { name: "OverconstrainedError" });
      return stream;
    });
    expect(await capture(s)).toBe(stream);
  });

  it("does not hide a refusal behind the fallback", async () => {
    choose("usb-1");
    const s = scope(async () => {
      throw Object.assign(new Error("no"), { name: "NotAllowedError" });
    });
    await expect(capture(s)).rejects.toThrow("no");
  });
});
