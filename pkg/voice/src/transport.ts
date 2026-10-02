import type { Said, Speech, Stream } from "./types.js";

export interface SpeechConfig {
  /** Where `/v1/audio/*` lives. Defaults to the Hanzo gateway. */
  baseUrl?: string;
  /**
   * A bearer for the platform. Omit on a same-origin proxy that carries the
   * session cookie — this package never invents a credential.
   */
  token?: string | (() => string | null | Promise<string | null>);
  /** Transcription model, for the per-utterance ear and the growing transcript.
   *  Defaults to Hanzo's own, `zen-scribe`. */
  ear?: string;
  /** The organization to bill, when the bearer belongs to several. */
  org?: string;
  /**
   * Speech model, the voice it reads in, and the container it answers with.
   * Defaults to `zen-voice-mini` reading in `af_heart` as mp3. `name` is the
   * speech service's own voice id; a call to `speak` may name another.
   */
  voice?: { model?: string; name?: string; format?: string };
  fetch?: typeof fetch;
}

const BASE = "https://api.hanzo.ai";

/** Hanzo's own speech models, and the voice a reply is read in unless one is named. */
const EAR = "zen-scribe";
const MOUTH = "zen-voice-mini";
const VOICE = "af_heart";

/**
 * The platform's speech services: `POST /v1/audio/transcriptions` and
 * `POST /v1/audio/speech`, both OpenAI-compatible, both metered.
 *
 * The same two paths serve every Hanzo surface, so a surface that fronts them
 * with its own proxy only has to change `baseUrl` — never the shape.
 */
export function speech(config: SpeechConfig = {}): Speech {
  const base = (config.baseUrl ?? BASE).replace(/\/+$/, "");
  const send = config.fetch ?? globalThis.fetch;
  const voice = config.voice ?? {};

  const authorize = async (headers: Headers) => {
    const source = config.token;
    const token = typeof source === "function" ? await source() : source;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (config.org) headers.set("X-Org-Id", config.org);
  };

  const fail = async (response: Response, what: string): Promise<never> => {
    const body = await response.text().catch(() => "");
    throw new Error(`${what} failed (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`);
  };

  return {
    async transcribe(audio, { language, signal } = {}) {
      const form = new FormData();
      form.append("file", audio, `turn.${extension(audio.type)}`);
      form.append("model", config.ear ?? EAR);
      if (language) form.append("language", language.split("-")[0] as string);
      const headers = new Headers();
      await authorize(headers);
      const response = await send(`${base}/v1/audio/transcriptions`, {
        method: "POST",
        headers,
        body: form,
        credentials: "include",
        signal,
      });
      if (!response.ok) await fail(response, "Transcription");
      const result = (await response.json()) as { text?: string };
      return result.text ?? "";
    },

    async speak(text, { signal, voice: name } = {}) {
      const headers = new Headers({ "Content-Type": "application/json" });
      await authorize(headers);
      const response = await send(`${base}/v1/audio/speech`, {
        method: "POST",
        headers,
        credentials: "include",
        signal,
        body: JSON.stringify({
          model: voice.model ?? MOUTH,
          voice: name ?? voice.name ?? VOICE,
          response_format: voice.format ?? "mp3",
          input: text,
        }),
      });
      if (!response.ok) await fail(response, "Speech");
      return await response.blob();
    },

    // The growing transcript: POST opens it, each POST to its id carries raw
    // pcm16 and answers what has been heard so far, DELETE settles the tail.
    async stream({ language, signal } = {}): Promise<Stream> {
      const headers = new Headers({ "Content-Type": "application/json" });
      await authorize(headers);
      const opened = await send(`${base}/v1/audio/transcript`, {
        method: "POST",
        headers,
        credentials: "include",
        signal,
        body: JSON.stringify({
          model: config.ear ?? EAR,
          ...(language ? { language: language.split("-")[0] } : {}),
        }),
      });
      if (!opened.ok) await fail(opened, "Transcript");
      const session = (await opened.json()) as {
        id: string;
        chunk_ms?: number;
        max_seconds?: number;
        max_bytes?: number;
      };
      const at = `${base}/v1/audio/transcript/${encodeURIComponent(session.id)}`;
      const said = async (response: Response, what: string): Promise<Said> => {
        if (!response.ok) await fail(response, what);
        const body = (await response.json()) as Partial<Said>;
        return { text: body.text ?? "", pending: body.pending ?? "", seconds: body.seconds ?? 0 };
      };
      return {
        chunk: session.chunk_ms ?? 250,
        limit: session.max_seconds ?? 600,
        most: session.max_bytes ?? 64 * 1024,
        async push(pcm) {
          const headers = new Headers({ "Content-Type": "application/octet-stream" });
          await authorize(headers);
          const body = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength).slice();
          return said(await send(at, { method: "POST", headers, credentials: "include", body }), "Transcript push");
        },
        async close() {
          const headers = new Headers();
          await authorize(headers);
          return said(await send(at, { method: "DELETE", headers, credentials: "include" }), "Transcript close");
        },
      };
    },
  };
}

function extension(type: string): string {
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mp4")) return "m4a";
  if (type.includes("wav")) return "wav";
  return "webm";
}
