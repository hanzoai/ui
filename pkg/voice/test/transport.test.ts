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
