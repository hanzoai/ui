import { describe, expect, it } from "vitest";

import { blocker, capability, speech } from "../src/index.js";

const nothing = { isSecureContext: true, navigator: {} };
const recogniser = { ...nothing, SpeechRecognition: class {} };
const recorder = {
  isSecureContext: true,
  MediaRecorder: class {},
  navigator: { mediaDevices: { getUserMedia: () => {} } },
};

describe("what a browser can do", () => {
  it("reads a recogniser, a recorder and a voice off the environment", () => {
    expect(capability(recogniser).recognition).toBe(true);
    expect(capability(recogniser).recorder).toBe(false);
    expect(capability(recorder).recorder).toBe(true);
  });

  it("takes the webkit-prefixed recogniser as a recogniser", () => {
    expect(capability({ ...nothing, webkitSpeechRecognition: class {} }).recognition).toBe(true);
  });

  it("lets a recogniser run alone, and a recorder only with the platform behind it", () => {
    const platform = speech({ token: "t" });
    expect(blocker(capability(recogniser))).toBeNull();
    expect(blocker(capability(recorder))).toBe("unsupported");
    expect(blocker(capability(recorder), platform)).toBeNull();
    expect(blocker(capability(nothing), platform)).toBe("unsupported");
  });

  it("refuses an insecure origin before anything else", () => {
    expect(blocker(capability({ ...recogniser, isSecureContext: false }))).toBe("insecure");
  });
});

describe("the platform's speech services", () => {
  it("transcribes against POST /v1/audio/transcriptions", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const platform = speech({
      token: "hk-test",
      fetch: (async (url: string, init: RequestInit) => {
        seen = { url, init };
        return new Response(JSON.stringify({ text: "hello there" }), { status: 200 });
      }) as unknown as typeof fetch,
    });

    const text = await platform.transcribe(new Blob(["x"], { type: "audio/webm" }), {
      language: "en-US",
    });

    expect(text).toBe("hello there");
    expect(seen!.url).toBe("https://api.hanzo.ai/v1/audio/transcriptions");
    expect(new Headers(seen!.init.headers).get("Authorization")).toBe("Bearer hk-test");
    const form = seen!.init.body as FormData;
    // Hanzo's own transcriber, unless the caller names another.
    expect(form.get("model")).toBe("zen-scribe");
    expect(form.get("language")).toBe("en");
  });

  it("speaks against POST /v1/audio/speech and hands back the audio", async () => {
    let sent: unknown = null;
    const platform = speech({
      baseUrl: "https://hanzo.chat/",
      fetch: (async (url: string, init: RequestInit) => {
        sent = { url, body: JSON.parse(init.body as string) };
        return new Response(new Blob(["mp3"]), { status: 200 });
      }) as unknown as typeof fetch,
    });

    const audio = await platform.speak!("read this", {});

    expect(audio.size).toBeGreaterThan(0);
    expect(sent).toMatchObject({
      url: "https://hanzo.chat/v1/audio/speech",
      // Hanzo's own voice model, reading in its default voice.
      body: { model: "zen-voice-mini", voice: "af_heart", input: "read this", response_format: "mp3" },
    });
  });

  it("reads in the voice a sentence names, over the transport's own", async () => {
    const bodies: Record<string, unknown>[] = [];
    const platform = speech({
      voice: { name: "bm_george" },
      fetch: (async (_url: string, init: RequestInit) => {
        bodies.push(JSON.parse(init.body as string));
        return new Response(new Blob(["mp3"]), { status: 200 });
      }) as unknown as typeof fetch,
    });

    await platform.speak!("as configured", {});
    await platform.speak!("as named", { voice: "af_nova" });

    expect(bodies.map((body) => body.voice)).toEqual(["bm_george", "af_nova"]);
    expect(bodies.every((body) => body.model === "zen-voice-mini")).toBe(true);
  });

  it("sends the models a caller names instead of Hanzo's", async () => {
    let form: FormData | null = null;
    let body: Record<string, unknown> | null = null;
    const platform = speech({
      ear: "other-ear",
      voice: { model: "other-voice", format: "wav" },
      fetch: (async (url: string, init: RequestInit) => {
        if (url.endsWith("/transcriptions")) {
          form = init.body as FormData;
          return new Response(JSON.stringify({ text: "" }), { status: 200 });
        }
        body = JSON.parse(init.body as string);
        return new Response(new Blob(["wav"]), { status: 200 });
      }) as unknown as typeof fetch,
    });

    await platform.transcribe(new Blob(["x"]), {});
    await platform.speak!("x", {});

    expect(form!.get("model")).toBe("other-ear");
    expect(body).toMatchObject({ model: "other-voice", voice: "af_heart", response_format: "wav" });
  });

  it("carries the failure up rather than returning silence", async () => {
    const platform = speech({
      fetch: (async () =>
        new Response("insufficient balance", { status: 402 })) as unknown as typeof fetch,
    });
    await expect(platform.transcribe(new Blob(["x"]), {})).rejects.toThrow(/402/);
  });
});
