import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { speech, SpeechError } from "../src/transport.js";
import { backoff, gone, RETRY_WINDOW, transcript } from "../src/transcript.js";
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
    idle: 30,
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

/**
 * A transcript whose pushes answer from a script: an Error is thrown, anything
 * else is the state. Every push is recorded as the marks of the quarters it
 * carried, so the order audio reached the platform can be read back.
 */
function scripted(script: (Error | Said)[]) {
  const attempts: number[][] = [];
  const delivered: number[] = [];
  let seconds = 0;
  const stream: Stream = {
    chunk: 250,
    limit: 600,
    most: 64 * 1024,
    idle: 30,
    async push(pcm) {
      const marks: number[] = [];
      for (let i = 0; i < pcm.length; i += 4000) marks.push(pcm[i] as number);
      attempts.push(marks);
      const next = script.shift();
      if (next instanceof Error) throw next;
      delivered.push(...marks);
      seconds += pcm.length / 16000;
      return next ?? { text: "", pending: "", seconds };
    },
    close: vi.fn(async () => ({ text: "", pending: "", seconds })),
  };
  return { stream, attempts, delivered };
}

/** A quarter second whose every sample carries `k`, so it can be told apart. */
const marked = (k: number) => Node.last?.port.onmessage?.({ data: new Float32Array(4000).fill(k / 1000) });
const mark = (k: number) => Math.trunc((k / 1000) * 0x7fff);
const limited = (seconds?: number) =>
  new SpeechError("Transcript push failed (429): rate limit exceeded", 429, "rate_limit_exceeded", seconds === undefined ? undefined : seconds * 1000);

describe("a push the platform cannot take yet", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const tick = (ms = 0) => vi.advanceTimersByTimeAsync(ms);

  async function opened(script: (Error | Said)[]) {
    const t = scripted(script);
    const s: Speech = { transcribe: async () => "", stream: async () => t.stream };
    const { got, heard } = listener();
    const live = transcript(s, heard, { scope });
    await live.open();
    return { ...t, got, live };
  }

  it("waits out a 429's Retry-After, then sends the held audio in order with nothing lost", async () => {
    const { attempts, delivered, got, live } = await opened([limited(2)]);
    marked(1);
    await tick();
    marked(2);
    marked(3);
    await tick(1999);
    expect(attempts).toEqual([[mark(1)]]);
    expect(got.refused).toEqual([]);
    await tick(1);
    await tick();
    expect(attempts).toEqual([[mark(1)], [mark(1)], [mark(2), mark(3)]]);
    expect(delivered).toEqual([mark(1), mark(2), mark(3)]);
    expect(got.refused).toEqual([]);
    await live.close();
  });

  it("a single 429 with no Retry-After backs off and carries on", async () => {
    const { delivered, got, live } = await opened([limited()]);
    marked(1);
    await tick();
    marked(2);
    await tick(500);
    await tick();
    expect(delivered).toEqual([mark(1), mark(2)]);
    expect(got.refused).toEqual([]);
    await live.close();
  });

  it("a 5xx and a dropped connection are waits too", async () => {
    const { delivered, got, live } = await opened([
      new SpeechError("Transcript push failed (502)", 502),
      new TypeError("Failed to fetch"),
    ]);
    marked(1);
    await tick(500);
    await tick(1000);
    await tick();
    expect(delivered).toEqual([mark(1)]);
    expect(got.refused).toEqual([]);
    await live.close();
  });

  for (const status of [402, 403]) {
    it(`a ${status} refuses at once and is not tried again`, async () => {
      const { attempts, got } = await opened([new SpeechError(`Transcript push failed (${status})`, status)]);
      marked(1);
      await tick();
      expect(got.refused).toEqual([`Transcript push failed (${status})`]);
      await tick(RETRY_WINDOW);
      expect(attempts).toHaveLength(1);
      expect(tracks[0]?.stop).toHaveBeenCalled();
    });
  }

  it("a 429 for a spent allowance is a refusal, not a wait", async () => {
    const { attempts, got } = await opened([
      new SpeechError("Transcript push failed (429): free plan", 429, "free_plan_cap"),
    ]);
    marked(1);
    await tick();
    expect(got.refused).toHaveLength(1);
    expect(attempts).toHaveLength(1);
  });

  it("refuses once the platform has taken nothing for the whole window", async () => {
    const { got } = await opened(Array.from({ length: 100 }, () => limited()));
    marked(1);
    await tick(RETRY_WINDOW / 2);
    expect(got.refused).toEqual([]);
    await tick(RETRY_WINDOW);
    expect(got.refused).toEqual(["Transcript push failed (429): rate limit exceeded"]);
  });

  it("a sustained 5xx refuses at the same window", async () => {
    const { got } = await opened(Array.from({ length: 100 }, () => new SpeechError("Transcript push failed (503)", 503)));
    marked(1);
    await tick(RETRY_WINDOW / 2);
    expect(got.refused).toEqual([]);
    await tick(RETRY_WINDOW);
    expect(got.refused).toEqual(["Transcript push failed (503)"]);
  });

  it("a long wait is taken in steps the transcript survives, so the session is not lost to it", async () => {
    // A 502 that names a minute: the session lives 30 s untouched, so the retry
    // comes at 25 s rather than at 60, when the session would already be gone.
    const named = new SpeechError("Transcript push failed (502)", 502, undefined, 60_000);
    const { attempts, delivered, got, live } = await opened([named]);
    marked(1);
    await tick();
    expect(attempts).toHaveLength(1);
    await tick(24_999);
    expect(attempts).toHaveLength(1);
    await tick(1);
    await tick();
    expect(attempts).toHaveLength(2);
    expect(delivered).toEqual([mark(1)]);
    expect(got.refused).toEqual([]);
    await live.close();
  });

  it("a wait named past the window refuses now, not after it", async () => {
    const { got } = await opened([limited(RETRY_WINDOW / 1000 + 1)]);
    marked(1);
    await tick();
    expect(got.refused).toHaveLength(1);
  });

  it("the queue is bounded: audio held for the whole window ends the transcript", async () => {
    // A push that never answers holds the pump; the microphone keeps hearing.
    const t = scripted([]);
    t.stream.push = () => new Promise<Said>(() => {});
    const s: Speech = { transcribe: async () => "", stream: async () => t.stream };
    const { got, heard } = listener();
    await transcript(s, heard, { scope }).open();
    for (let i = 0; i < (RETRY_WINDOW / 250); i++) marked(1);
    await tick();
    expect(got.refused).toEqual([]);
    marked(1);
    await tick();
    expect(got.refused).toEqual([`Transcript failed: nothing delivered for ${RETRY_WINDOW / 1000}s`]);
  });

  it("closing during a wait delivers the held audio before settling", async () => {
    const { delivered, stream, got, live } = await opened([limited(1)]);
    marked(1);
    await tick();
    marked(2);
    const closing = live.close();
    await tick(1000);
    await closing;
    expect(delivered).toEqual([mark(1), mark(2)]);
    expect(stream.close).toHaveBeenCalledTimes(1);
    expect(got.refused).toEqual([]);
  });
});

describe("a session the platform loses", () => {
  const lostAt = (status: number) => new SpeechError(`Transcript push failed (${status})`, status);

  /** Sessions in the order they are opened, each answering from its own script. */
  function sessions(...scripts: (Error | Said)[][]) {
    const made = scripts.map((script) => scripted(script));
    let opened = 0;
    const s: Speech = {
      transcribe: async () => "",
      stream: async () => {
        const next = made[opened++];
        if (!next) throw new SpeechError("Transcript failed (503)", 503);
        return next.stream;
      },
    };
    return { s, made, opened: () => opened };
  }

  for (const status of [404, 409]) {
    it(`a ${status} mid-dictation opens a new session that takes the unanswered push and all after it, in order`, async () => {
      const { s, made } = sessions(
        [{ text: "In Paris,", pending: "the first", seconds: 0.25 }, lostAt(status)],
        [
          { text: "train", pending: "", seconds: 0.25 },
          { text: "train", pending: "", seconds: 0.5 },
        ],
      );
      const { got, heard } = listener();
      const live = transcript(s, heard, { scope });
      await live.open();
      marked(1);
      await settle();
      marked(2);
      await settle();
      await settle();
      marked(3);
      await settle();
      await settle();
      expect(made[0]?.delivered).toEqual([mark(1)]);
      expect(made[1]?.attempts[0]).toEqual([mark(2)]);
      expect([...(made[1]?.delivered ?? [])]).toEqual([mark(2), mark(3)]);
      expect(got.refused).toEqual([]);
      expect(got.settled).toEqual(["In Paris,", "the first", "train"]);
      expect(got.partial.at(-1)).toBe("In Paris, the first train");
      await live.close();
      expect(made[1]?.stream.close).toHaveBeenCalled();
    });
  }

  it("a close answered 409 keeps what the session said rather than refusing", async () => {
    const t = scripted([{ text: "Hello", pending: "there", seconds: 0.25 }]);
    (t.stream.close as ReturnType<typeof vi.fn>).mockRejectedValueOnce(lostAt(409));
    const s: Speech = { transcribe: async () => "", stream: async () => t.stream };
    const { got, heard } = listener();
    const live = transcript(s, heard, { scope });
    await live.open();
    marked(1);
    await settle();
    await live.close();
    expect(got.refused).toEqual([]);
    expect(got.settled).toEqual(["Hello", "there"]);
  });

  it("losing a session every push is the platform gone: it refuses after a few", async () => {
    const { s, opened } = sessions(...Array.from({ length: 6 }, () => [lostAt(409)]));
    const { got, heard } = listener();
    const live = transcript(s, heard, { scope });
    await live.open();
    marked(1);
    for (let i = 0; i < 10; i++) await settle();
    expect(got.refused).toEqual(["Transcript push failed (409)"]);
    expect(opened()).toBe(4);
    expect(tracks[0]?.stop).toHaveBeenCalled();
  });

  it("402 and 403 still refuse; only a lost session reopens", () => {
    expect(gone(lostAt(404))).toBe(true);
    expect(gone(lostAt(409))).toBe(true);
    for (const status of [400, 401, 402, 403, 413, 429, 503]) expect(gone(lostAt(status))).toBe(false);
  });
});

describe("backoff", () => {
  it("says which answers are waits and how long", () => {
    expect(backoff(new SpeechError("x", 429, undefined, 3000), 0)).toBe(3000);
    expect(backoff(new SpeechError("x", 429), 0)).toBe(500);
    expect(backoff(new SpeechError("x", 429), 3)).toBe(4000);
    expect(backoff(new SpeechError("x", 503), 10)).toBe(8000);
    expect(backoff(new TypeError("Failed to fetch"), 0)).toBe(500);
    for (const status of [400, 401, 402, 403, 404, 409, 413]) expect(backoff(new SpeechError("x", status), 0)).toBeNull();
    expect(backoff(new SpeechError("x", 429, "usage_cap_exceeded"), 0)).toBeNull();
    expect(backoff(new SyntaxError("bad json"), 0)).toBeNull();
  });
});

describe("speech().stream", () => {
  it("a refused push carries the platform's Retry-After, in ms", async () => {
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      if (init.method === "POST" && url.endsWith("/v1/audio/transcript")) {
        return new Response(JSON.stringify({ id: "ats_1", chunk_ms: 250 }), { status: 201 });
      }
      return new Response(JSON.stringify({ error: { message: "rate limit exceeded: retry after 7s", code: "rate_limit_exceeded" } }), {
        status: 429,
        headers: { "Retry-After": "7" },
      });
    }) as unknown as typeof globalThis.fetch;
    const live = await (speech({ baseUrl: "https://api.example", fetch }).stream as NonNullable<Speech["stream"]>)({});
    const error = (await live.push(new Int16Array([1])).catch((e: unknown) => e)) as SpeechError;
    expect(error).toBeInstanceOf(SpeechError);
    expect(error.status).toBe(429);
    expect(error.retry).toBe(7000);
    expect(backoff(error, 0)).toBe(7000);
  });

  it("opens with the model and language, pushes raw pcm16 and closes with DELETE", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (init.method === "POST" && url.endsWith("/v1/audio/transcript")) {
        return new Response(JSON.stringify({ id: "ats_1", chunk_ms: 250, max_seconds: 600, max_bytes: 65536, idle_seconds: 20 }), { status: 201 });
      }
      return new Response(JSON.stringify({ text: "hi", pending: "", seconds: 0.25 }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;
    const s = speech({ baseUrl: "https://api.example", token: "b", org: "acme", fetch });
    const live = await (s.stream as NonNullable<Speech["stream"]>)({ language: "en-US" });
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual({ model: "zen-scribe", language: "en" });
    expect(new Headers(calls[0]?.init.headers).get("X-Org-Id")).toBe("acme");
    expect(live.chunk).toBe(250);
    expect(live.idle).toBe(20);

    const said = await live.push(new Int16Array([1, -1]));
    expect(said.text).toBe("hi");
    expect(calls[1]?.url).toBe("https://api.example/v1/audio/transcript/ats_1");
    expect(new Headers(calls[1]?.init.headers).get("Content-Type")).toBe("application/octet-stream");
    expect((calls[1]?.init.body as Uint8Array).byteLength).toBe(4);

    await live.close();
    expect(calls[2]?.init.method).toBe("DELETE");
  });
});
