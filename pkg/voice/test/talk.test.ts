import { describe, expect, it, vi } from "vitest";

import { talk } from "../src/talk.js";
import type { Talked } from "../src/talk.js";

// A browser, faked at the seams talk() reaches through: the mic, the audio graph,
// the worklet's port, the socket and the session call. Each fake records what it
// was asked so a test can say what crossed the wire.

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

class Source {
  started: number[] = [];
  stopped = false;
  onended: (() => void) | null = null;
  buffer: unknown = null;
  connect() {}
  start(at: number) {
    this.started.push(at);
  }
  stop() {
    this.stopped = true;
  }
}

class Context {
  static last: Context | null = null;
  sampleRate = 48000;
  currentTime = 0;
  destination = {};
  sources: Source[] = [];
  closed = false;
  audioWorklet = { addModule: vi.fn(async () => {}) };
  constructor() {
    Context.last = this;
  }
  createMediaStreamSource() {
    return { connect() {}, disconnect() {} };
  }
  createGain() {
    return { gain: { value: 1 }, connect() {}, disconnect() {} };
  }
  createBuffer(_channels: number, length: number, rate: number) {
    return { duration: length / rate, copyToChannel() {} };
  }
  createBufferSource() {
    const source = new Source();
    this.sources.push(source);
    return source;
  }
  async close() {
    this.closed = true;
  }
}

class Socket {
  static last: Socket | null = null;
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(
    public url: string,
    public protocols: string[],
  ) {
    Socket.last = this;
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
  }
  // test helpers
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  say(event: object) {
    this.onmessage?.({ data: JSON.stringify(event) });
  }
}

function browser(options: { denied?: boolean } = {}) {
  const tracks = [{ stop: vi.fn() }];
  return {
    tracks,
    scope: {
      navigator: {
        mediaDevices: {
          getUserMedia: vi.fn(async () => {
            if (options.denied) throw Object.assign(new Error("no"), { name: "NotAllowedError" });
            return { getTracks: () => tracks };
          }),
        },
      },
      AudioContext: Context,
      AudioWorkletNode: Node,
      WebSocket: Socket,
    },
  };
}

function ears() {
  const heard = {
    states: [] as string[],
    replies: [] as string[],
    done: [] as string[],
    failed: [] as string[],
    refused: [] as string[],
    errors: [] as string[],
  };
  const on: Talked = {
    state: (s) => heard.states.push(s),
    reply: (t) => heard.replies.push(t),
    done: (t) => heard.done.push(t),
    fail: (r) => heard.failed.push(r),
    refused: (e) => heard.refused.push(e.message),
    error: (m) => heard.errors.push(m),
  };
  return { heard, on };
}

const ticketing = (status = 200) =>
  vi.fn(async (_url: string, _init?: RequestInit) =>
    status === 200
      ? new Response(JSON.stringify({ ticket: "t-1", rate: 24000 }), { status })
      : new Response(JSON.stringify({ error: { message: "authentication required" } }), { status }),
  );

const settle = () => new Promise((r) => setTimeout(r, 0));

async function opened(fetch = ticketing()) {
  const { scope, tracks } = browser();
  const { heard, on } = ears();
  const t = talk({ baseUrl: "https://api.example", token: "bearer-1", org: "acme", fetch: fetch as unknown as typeof globalThis.fetch }, on, scope);
  await t.open();
  const sock = Socket.last as Socket;
  sock.open();
  await settle();
  return { t, sock, heard, fetch, tracks };
}

describe("talk", () => {
  it("spends the bearer on the session and opens the socket with the ticket alone", async () => {
    const { sock, fetch } = await opened();
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example/v1/voice/session");
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer bearer-1");
    expect(headers.get("X-Org-Id")).toBe("acme");
    expect(sock.url).toBe("wss://api.example/v1/voice?ticket=t-1");
    expect(sock.protocols).toEqual(["realtime"]);
    expect(sock.url).not.toContain("bearer-1");
  });

  it("streams the mic up as 16 kHz pcm16, 100 ms a message", async () => {
    const { sock, heard } = await opened();
    expect(heard.states).toContain("listening");
    // 100 ms at 48 kHz is 4800 samples, averaged three to one into 1600.
    Node.last?.port.onmessage?.({ data: new Float32Array(4800).fill(0.5) });
    expect(sock.sent).toHaveLength(1);
    const event = JSON.parse(sock.sent[0] as string) as { type: string; audio: string };
    expect(event.type).toBe("input_audio_buffer.append");
    const bytes = atob(event.audio);
    expect(bytes.length).toBe(3200);
    const first = (bytes.charCodeAt(1) << 8) | bytes.charCodeAt(0);
    expect(first).toBe(Math.trunc(0.5 * 0x7fff));
  });

  it("collects the reply's words and reports the whole reply once", async () => {
    const { sock, heard } = await opened();
    sock.say({ type: "response.audio_transcript.delta", delta: "The capital" });
    sock.say({ type: "response.audio_transcript.delta", delta: " is Paris." });
    sock.say({ type: "response.done" });
    expect(heard.replies).toEqual(["The capital", "The capital is Paris."]);
    expect(heard.done).toEqual(["The capital is Paris."]);
  });

  it("plays each audio delta after the last, and talking over it stops it", async () => {
    const { sock, heard } = await opened();
    const pcm = btoa(String.fromCharCode(...new Uint8Array(new Int16Array(2400).buffer)));
    sock.say({ type: "response.audio.delta", delta: pcm });
    sock.say({ type: "response.audio.delta", delta: pcm });
    const sources = (Context.last as Context).sources;
    expect(sources).toHaveLength(2);
    expect(sources[1]?.started[0]).toBeCloseTo(0.1);
    expect(heard.states.at(-1)).toBe("speaking");

    sock.say({ type: "input_audio_buffer.speech_started" });
    expect(sources.every((s) => s.stopped)).toBe(true);
    expect(heard.states.at(-1)).toBe("listening");
  });

  it("says a turn's error and keeps the conversation", async () => {
    const { sock, heard } = await opened();
    sock.say({ type: "error", error: { message: "nothing was said" } });
    expect(heard.errors).toEqual(["nothing was said"]);
    expect(heard.refused).toEqual([]);
    expect(sock.readyState).toBe(1);
  });

  it("reports a refused session and holds no microphone", async () => {
    const { scope, tracks } = browser();
    const { heard, on } = ears();
    await talk({ baseUrl: "https://api.example", token: "x", fetch: ticketing(401) as unknown as typeof globalThis.fetch }, on, scope).open();
    expect(heard.refused[0]).toMatch(/^Talk failed \(401\)/);
    expect(tracks[0]?.stop).toHaveBeenCalled();
  });

  it("names a microphone that was refused", async () => {
    const { scope } = browser({ denied: true });
    const { heard, on } = ears();
    await talk({ fetch: ticketing() as unknown as typeof globalThis.fetch }, on, scope).open();
    expect(heard.failed).toEqual(["denied"]);
  });

  it("reports a socket the platform closed, and not one it closed itself", async () => {
    const first = await opened();
    first.sock.onclose?.();
    expect(first.heard.refused).toEqual(["Talk ended: the conversation closed"]);

    const second = await opened();
    second.t.close();
    second.sock.onclose?.();
    expect(second.heard.refused).toEqual([]);
    expect(second.tracks[0]?.stop).toHaveBeenCalled();
    expect((Context.last as Context).closed).toBe(true);
  });
});
