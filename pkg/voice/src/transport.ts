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
   * The visitor's lane: transcription for a page with nobody signed in, on
   * Hanzo's own transcriber, a minute at a time within a day per visitor. No
   * credential is sent and no speech or live transcript is offered; past the day
   * the platform refuses and the browser's recogniser stands in.
   */
  public?: boolean;
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

/** The platform said no: the status, the code its error envelope named, and how
 *  long it asked to be left alone (`Retry-After`, in ms) when it said. */
export class SpeechError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retry?: number;
  /** When the platform answered, in ms since the epoch: `retry` counts from here. */
  readonly at = Date.now();
  constructor(message: string, status: number, code?: string, retry?: number) {
    super(message);
    this.name = "SpeechError";
    this.status = status;
    this.code = code;
    this.retry = retry;
  }
}

/**
 * The wait the platform asked for, in ms: `Retry-After` as delay-seconds or an
 * HTTP date (RFC 9110 §10.2.3), else the seconds its message names ("retry after
 * 12s", "resets in 20440 seconds") — the header is only readable cross-origin
 * where the edge exposes it.
 */
function after(header: string | null, message: string): number | undefined {
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    const at = Date.parse(header);
    if (!Number.isNaN(at)) return Math.max(0, at - Date.now());
  }
  const named = /(?:retry after|resets in) (\d+) ?s/i.exec(message);
  return named ? Number(named[1]) * 1000 : undefined;
}

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
    let code: string | undefined;
    let message = "";
    try {
      const error = (JSON.parse(body) as { error?: { code?: string; message?: string } }).error;
      code = error?.code;
      message = error?.message ?? "";
    } catch {
      code = undefined;
    }
    throw new SpeechError(
      `${what} failed (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
      response.status,
      code,
      after(response.headers.get("Retry-After"), message),
    );
  };

  const transcribe: Speech["transcribe"] = async (audio, { language, signal } = {}) => {
    const form = new FormData();
    form.append("file", audio, `turn.${extension(audio.type)}`);
    form.append("model", config.ear ?? EAR);
    if (language) form.append("language", language.split("-")[0] as string);
    const headers = new Headers();
    if (!config.public) await authorize(headers);
    const path = config.public ? "/v1/audio/transcriptions/public" : "/v1/audio/transcriptions";
    const response = await send(`${base}${path}`, {
      method: "POST",
      headers,
      body: form,
      credentials: config.public ? "omit" : "include",
      signal,
    });
    if (!response.ok) await fail(response, "Transcription");
    const result = (await response.json()) as { text?: string };
    return result.text ?? "";
  };

  if (config.public) return { transcribe };

  return {
    transcribe,

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
        idle_seconds?: number;
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
        idle: session.idle_seconds ?? 30,
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
