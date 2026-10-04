import { describe, expect, it, vi } from "vitest";

import { refused, speech, SpeechError, SPENT, REFUSED } from "../src/index.js";

/** A fetch that records each request and answers with the given response. */
function wire(answer: () => Response) {
  const asked: { url: string; init: RequestInit }[] = [];
  const send = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    asked.push({ url: String(url), init: init ?? {} });
    return answer();
  });
  return { asked, send: send as unknown as typeof fetch };
}

const audio = () => new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm;codecs=opus" });

describe("the visitor's lane", () => {
  it("transcribes on the public path with no credential, and offers nothing else", async () => {
    const { asked, send } = wire(() => Response.json({ text: "What is the capital of France?" }));
    const ear = speech({ public: true, token: "never-sent", org: "acme", fetch: send });

    expect(await ear.transcribe(audio(), { language: "en-US" })).toBe("What is the capital of France?");
    expect(ear.speak).toBeUndefined();
    expect(ear.stream).toBeUndefined();

    const { url, init } = asked[0]!;
    expect(url).toBe("https://api.hanzo.ai/v1/audio/transcriptions/public");
    expect(init.credentials).toBe("omit");
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBeNull();
    expect(headers.get("X-Org-Id")).toBeNull();
    const form = init.body as FormData;
    expect(form.get("model")).toBe("zen-scribe");
    expect(form.get("language")).toBe("en");
  });

  it("a signed-in reader keeps the metered path and their credential", async () => {
    const { asked, send } = wire(() => Response.json({ text: "hi" }));
    const ear = speech({ token: "t0k", fetch: send });
    await ear.transcribe(audio(), {});
    expect(asked[0]!.url).toBe("https://api.hanzo.ai/v1/audio/transcriptions");
    expect(new Headers(asked[0]!.init.headers).get("Authorization")).toBe("Bearer t0k");
    expect(ear.speak).toBeTypeOf("function");
  });

  it("a spent day is a SpeechError naming its code, and wears the spent note", async () => {
    const { send } = wire(() =>
      Response.json(
        { error: { message: "You've used today's free dictation.", type: "insufficient_quota", code: "public_allowance_spent" } },
        { status: 429 },
      ),
    );
    const error = await speech({ public: true, fetch: send })
      .transcribe(audio(), {})
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SpeechError);
    expect((error as SpeechError).status).toBe(429);
    expect((error as SpeechError).code).toBe("public_allowance_spent");

    expect(refused({ service: "ear", error: error as Error, covered: true })).toBe(SPENT.covered);
    expect(refused({ service: "ear", error: error as Error, covered: false })).toBe(SPENT.lost);
    // Any other refusal reads as one.
    const other = new SpeechError("Transcription failed (503)", 503, "public_lane_unavailable");
    expect(refused({ service: "ear", error: other, covered: true })).toBe(REFUSED.covered);
  });
});

describe("a limit", () => {
  const quota = (headers: Record<string, string>) =>
    wire(() =>
      Response.json(
        { error: { message: "Usage limit reached for this 8h. It resets in 20440 seconds.", type: "quota_error", code: 429 } },
        { status: 429, headers },
      ),
    );
  const clock = (at: number) => new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  it("is worded as the limit it is, with the moment it lifts from Retry-After", async () => {
    const { send } = quota({ "Retry-After": "3600" });
    const error = (await speech({ token: "t", fetch: send }).transcribe(audio(), {}).catch((e: unknown) => e)) as SpeechError;
    expect(error.status).toBe(429);
    expect(error.retry).toBe(3_600_000);
    const lifts = clock(error.at + 3_600_000);
    expect(refused({ service: "ear", error, covered: false })).toBe(`Today's Hanzo dictation limit is reached. It resets at ${lifts}.`);
    expect(refused({ service: "ear", error, covered: true })).toBe(
      `Today's Hanzo dictation limit is reached. It resets at ${lifts} — this browser is standing in.`,
    );
    expect(refused({ service: "mouth", error, covered: false })).toMatch(/^Today's Hanzo read-aloud limit is reached\./);
  });

  it("reads the moment from the message when the edge hides the header", async () => {
    const { send } = quota({});
    const error = (await speech({ token: "t", fetch: send }).transcribe(audio(), {}).catch((e: unknown) => e)) as SpeechError;
    expect(error.retry).toBe(20_440_000);
    expect(refused({ service: "ear", error, covered: false })).toBe(
      `Today's Hanzo dictation limit is reached. It resets at ${clock(error.at + 20_440_000)}.`,
    );
  });

  it("names no moment it was not told, and never reads as an outage", () => {
    const error = new SpeechError("Transcript push failed (429): rate limit exceeded", 429);
    expect(refused({ service: "ear", error, covered: false })).toBe("Today's Hanzo dictation limit is reached.");
    expect(refused({ service: "ear", error, covered: true })).toBe("Today's Hanzo dictation limit is reached — this browser is standing in.");
    for (const covered of [true, false]) expect(refused({ service: "ear", error, covered })).not.toMatch(/unavailable/i);
  });
});
