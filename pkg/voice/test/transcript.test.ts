import { describe, expect, it, vi } from "vitest";

import { speech } from "../src/transport.js";
import { transcript } from "../src/transcript.js";
import type { Said, Speech, Stream } from "../src/types.js";

class Port {
  onmessage: ((event: { data: Float32Array }) => void) | null = null;
}
class Node {
  static last: Node | null = null;
  port = new Port();
  constructor() {
    Node.last = this;
  }
  connect() {}
  disconnect() {}
}
class Context {
  sampleRate = 16000;
  destination = {};
  audioWorklet = { addModule: async () => {} };
  createMediaStreamSource() {
    return { connect() {}, disconnect() {} };
  }
  createGain() {
    return { gain: { value: 1 }, connect() {}, disconnect() {} };
  }
  async close() {}
}

const tracks = [{ stop: vi.fn() }];
const scope = {
  navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => tracks }) } },
  AudioContext: Context,
  AudioWorkletNode: Node,
};

/** A growing transcript the test drives: each push answers what `answers` holds next. */
function growing(answers: Said[], limit = 600) {
  const pushes: number[] = [];
  let gate: (() => void) | null = null;
  const stream: Stream = {
    chunk: 250,
    limit,
    most: 64 * 1024,
    async push(pcm) {
      pushes.push(pcm.length);
      if (gate === null) return answers.shift() as Said;
      await new Promise<void>((r) => (gate = r));
      return answers.shift() as Said;
    },
    close: vi.fn(async () => answers.shift() ?? { text: "", pending: "", seconds: 0 }),
  };
  return {
    stream,
    pushes,
    hold() {
      gate = () => {};
    },
    release() {
      const g = gate;
      gate = null;
      g?.();
    },
  };
}

function listener() {
  const got = { partial: [] as string[], settled: [] as string[], refused: [] as string[] };
  return {
    got,
    heard: {
      partial: (t: string) => got.partial.push(t),
      settled: (t: string) => got.settled.push(t),
      fail: () => {},
      refused: (e: Error) => got.refused.push(e.message),
    },
  };
}

const quarter = () => Node.last?.port.onmessage?.({ data: new Float32Array(4000) });
const settle = () => new Promise((r) => setTimeout(r, 0));

describe("the live transcript", () => {
  it("pushes 250 ms at a time and reports each settled piece once", async () => {
    const g = growing([
      { text: "", pending: "hello", seconds: 0.25 },
      { text: "Hello there.", pending: "how", seconds: 0.5 },
      { text: "Hello there. How are you?", pending: "", seconds: 0.75 },
      { text: "Hello there. How are you? Fine.", pending: "", seconds: 0.75 },
    ]);
    const s: Speech = { transcribe: async () => "", stream: async () => g.stream };
    const { got, heard } = listener();
    const live = transcript(s, heard, { scope });
    await live.open();
    for (let i = 0; i < 3; i++) {
      quarter();
      await settle();
    }
    expect(g.pushes).toEqual([4000, 4000, 4000]);
    expect(got.partial).toEqual(["hello", "Hello there. how", "Hello there. How are you?"]);
    expect(got.settled).toEqual(["Hello there.", "How are you?"]);
    await live.close();
    expect(g.stream.close).toHaveBeenCalled();
    expect(got.settled.at(-1)).toBe("Fine.");
    expect(tracks[0]?.stop).toHaveBeenCalled();
  });

  it("holds audio heard during a push and sends it with the next, one push at a time", async () => {
    const g = growing([
      { text: "", pending: "a", seconds: 0.25 },
      { text: "", pending: "a b c", seconds: 0.75 },
    ]);
    const s: Speech = { transcribe: async () => "", stream: async () => g.stream };
    const { heard } = listener();
    const live = transcript(s, heard, { scope });
    await live.open();
    g.hold();
    quarter();
    await settle();
    quarter();
    quarter();
    await settle();
    expect(g.pushes).toEqual([4000]);
    g.release();
    await settle();
    await settle();
    expect(g.pushes).toEqual([4000, 8000]);
    await live.close();
  });

  it("closes a transcript near its limit and carries on in a new one", async () => {
    const first = growing([
      { text: "One.", pending: "", seconds: 596 },
      { text: "One. Two.", pending: "", seconds: 596 },
    ]);
    const second = growing([{ text: "Three.", pending: "", seconds: 0.25 }]);
    const streams = [first.stream, second.stream];
    const s: Speech = { transcribe: async () => "", stream: async () => streams.shift() as Stream };
    const { got, heard } = listener();
    const live = transcript(s, heard, { scope });
    await live.open();
    quarter();
    await settle();
    await settle();
    expect(first.stream.close).toHaveBeenCalled();
    quarter();
    await settle();
    expect(got.settled).toEqual(["One.", "Two.", "Three."]);
    expect(got.partial.at(-1)).toBe("One. Two. Three.");
    await live.close();
  });

  it("reports a refused transcript and lets go of the microphone", async () => {
    const s: Speech = {
      transcribe: async () => "",
      stream: async () => {
        throw new Error("Transcript failed (402): requires a positive balance");
      },
    };
    const { got, heard } = listener();
    await transcript(s, heard, { scope }).open();
    expect(got.refused).toEqual(["Transcript failed (402): requires a positive balance"]);
  });
});

describe("speech().stream", () => {
  it("opens with the model and language, pushes raw pcm16 and closes with DELETE", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (init.method === "POST" && url.endsWith("/v1/audio/transcript")) {
        return new Response(JSON.stringify({ id: "ats_1", chunk_ms: 250, max_seconds: 600, max_bytes: 65536 }), { status: 201 });
      }
      return new Response(JSON.stringify({ text: "hi", pending: "", seconds: 0.25 }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;
    const s = speech({ baseUrl: "https://api.example", token: "b", org: "acme", fetch });
    const live = await (s.stream as NonNullable<Speech["stream"]>)({ language: "en-US" });
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual({ model: "zen-scribe", language: "en" });
    expect(new Headers(calls[0]?.init.headers).get("X-Org-Id")).toBe("acme");
    expect(live.chunk).toBe(250);

    const said = await live.push(new Int16Array([1, -1]));
    expect(said.text).toBe("hi");
    expect(calls[1]?.url).toBe("https://api.example/v1/audio/transcript/ats_1");
    expect(new Headers(calls[1]?.init.headers).get("Content-Type")).toBe("application/octet-stream");
    expect((calls[1]?.init.body as Uint8Array).byteLength).toBe(4);

    await live.close();
    expect(calls[2]?.init.method).toBe("DELETE");
  });
});
