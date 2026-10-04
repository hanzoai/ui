import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { capability, streamBlocker } from "./capability.js";
import { audioContext, capture, RATE, refusal, tap } from "./mic.js";
import type { Tap } from "./mic.js";
import { REASON } from "./types.js";
import type { Blocker, Refusal, Said, Speech, State, Stream } from "./types.js";

/** What a live transcript reports while it is open. */
export interface Transcribed {
  /** Everything heard so far in this sitting: the settled text and the tail
   *  still being decoded. It grows, and its tail may still change. */
  partial(text: string): void;
  /** Text that has settled since the last time: it will not change again. */
  settled(text: string): void;
  /** The live input level, 0..1. */
  level?(value: number): void;
  /** The microphone cannot open. */
  fail(reason: Blocker): void;
  /** The platform refused the transcript. */
  refused(error: Error): void;
}

export interface Live {
  open(): Promise<void>;
  /** Stop listening and settle the tail. */
  close(): Promise<void>;
}

/** Seconds short of a transcript's limit at which it is closed and a new one opened. */
const MARGIN = 5;

/**
 * How long, in ms, a live transcript keeps trying to deliver what it heard before
 * it calls the platform gone. A rate limit, a server fault or a dropped connection
 * is a wait, not a refusal: the audio stays queued and goes up in order once the
 * platform takes it. A minute because that is the gateway's rate window, so a
 * `Retry-After` it sends always lands inside it; a wait it names past the window
 * ends the transcript at once rather than after a minute of hoping.
 */
export const RETRY_WINDOW = 60_000;

/** The first wait when the platform names none, in ms; it doubles to `LONGEST_WAIT`. */
const FIRST_WAIT = 500;
const LONGEST_WAIT = 8_000;

/** A 429 that names one of these is a spent allowance, not a busy server. */
const SPENT_CODES = ["free_plan_cap", "usage_cap_exceeded", "public_allowance_spent"];

/**
 * How long to wait before trying a call again, or null when the answer is final.
 * Final: 402 and 403 (no funds, no permission), every other refusal of the
 * request itself (401, 404 and 409 for a session that is gone, 413), and a 429
 * that names a spent allowance. Passing: any other 429, a 5xx, and a fetch that
 * never reached the platform.
 */
export function backoff(error: unknown, attempt: number): number | null {
  const { status, code, retry, name } = (error ?? {}) as {
    status?: number;
    code?: string;
    retry?: number;
    name?: string;
  };
  if (status === undefined) {
    if (name !== "TypeError") return null; // fetch rejects with TypeError when the network fails
  } else if (status === 429) {
    if (code && SPENT_CODES.includes(code)) return null;
  } else if (status < 500) {
    return null;
  }
  if (typeof retry === "number" && retry >= 0) return retry;
  return Math.min(LONGEST_WAIT, FIRST_WAIT * 2 ** attempt);
}

/**
 * A live transcript on `/v1/audio/transcript`: the microphone streams up as
 * 16 kHz pcm16 and the text grows as it is heard.
 *
 * The endpoint admits one push at a time, so audio heard while a push is in
 * flight waits and rides with the next one, up to the most a push may carry. A
 * push the platform cannot take yet (`backoff`) is sent again after the wait
 * while new audio queues behind it, so nothing heard is dropped or reordered; it
 * refuses only on a final answer or after `RETRY_WINDOW` without delivering. A
 * transcript accepts a bounded length of audio, so near its end it is closed —
 * which settles its tail — and the next one opened in the same breath. Silence
 * is not billed: the speech service decodes and meters only what it hears.
 */
export function transcript(
  speech: Speech,
  heard: Transcribed,
  options: { language?: string; scope?: unknown } = {},
): Live {
  const scope = options.scope ?? globalThis;
  let stream: MediaStream | null = null;
  let mic: Tap | null = null;
  let current: Stream | null = null;
  let open = false;
  let draining: Promise<void> | null = null;
  let waiting: Int16Array[] = [];
  let queued = 0;
  let before = "";
  let settled = "";

  const report = (said: Said) => {
    if (said.text.length > settled.length && said.text.startsWith(settled)) {
      const fresh = said.text.slice(settled.length).trim();
      if (fresh) heard.settled(fresh);
    } else if (said.text !== settled && said.text.trim()) {
      heard.settled(said.text.trim());
    }
    settled = said.text;
    heard.partial(`${before} ${said.text} ${said.pending}`.replace(/\s+/g, " ").trim());
  };

  const fault = (error: unknown) => {
    open = false;
    release();
    waiting = [];
    queued = 0;
    heard.refused(error as Error);
  };

  const release = () => {
    mic?.close();
    mic = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  };

  // One call, tried until the platform takes it, gives a final answer, or the
  // window runs out. The window is measured from the first failure, so a wait the
  // platform names past its end fails now instead of after it. Inside a
  // transcript no single wait outlasts the transcript's idle life (`within`): a
  // session left untouched longer than that is dropped, and the wait would lose
  // the very audio it was protecting — so a long wait is taken in steps, each
  // retry keeping the session alive.
  const persist = async <T>(call: () => Promise<T>, within = Infinity): Promise<T> => {
    let since = 0;
    for (let attempt = 0; ; attempt++) {
      try {
        return await call();
      } catch (error) {
        const wait = backoff(error, attempt);
        const now = Date.now();
        since ||= now;
        if (wait === null || now + wait - since > RETRY_WINDOW) throw error;
        await new Promise((resume) => setTimeout(resume, Math.min(wait, within)));
      }
    }
  };

  /** The longest one wait may be inside a transcript, in ms. */
  const alive = (session: Stream) => Math.max(1, session.idle - MARGIN) * 1000;

  const begin = () => persist(() => (speech.stream as NonNullable<Speech["stream"]>)({ language: options.language }));

  // Close the full transcript and carry on in a new one. What it settled stays
  // in front of everything the next one hears.
  const roll = async () => {
    const full = current as Stream;
    report(await persist(() => full.close(), alive(full)));
    current = null;
    before = `${before} ${settled}`.trim();
    settled = "";
    current = await begin();
  };

  const pump = async () => {
    try {
      while (open && current && waiting.length) {
        const most = current.most >> 1;
        let size = 0;
        const take: Int16Array[] = [];
        while (waiting.length && size + (waiting[0] as Int16Array).length <= most) {
          const next = waiting.shift() as Int16Array;
          take.push(next);
          size += next.length;
        }
        if (!take.length) take.push(waiting.shift() as Int16Array);
        const pcm = new Int16Array(take.reduce((n, part) => n + part.length, 0));
        let at = 0;
        for (const part of take) {
          pcm.set(part, at);
          at += part.length;
        }
        const into = current;
        const said = await persist(() => into.push(pcm), alive(into));
        if (!open) return; // refused while this push waited; that has been said
        queued -= pcm.length;
        report(said);
        if (said.seconds >= current.limit - MARGIN) await roll();
      }
    } catch (error) {
      if (open) fault(error);
    }
  };

  // The one pump: a second caller joins the push in flight rather than starting
  // another, which is what keeps the pushes one at a time and in order.
  const drain = (): Promise<void> =>
    (draining ??= pump().finally(() => {
      draining = null;
    }));

  return {
    async open() {
      if (open) return;
      if (!speech.stream) {
        heard.refused(new Error("Transcript failed: this transport has no live transcript"));
        return;
      }
      // Made before the first await, so it is made inside the click (Safari).
      const made = audioContext(scope);
      try {
        stream = await capture(scope);
      } catch (error) {
        void made.close();
        heard.fail(refusal(error));
        return;
      }
      try {
        current = await begin();
        open = true;
        mic = await tap(
          stream,
          Math.round((RATE * current.chunk) / 1000),
          (pcm, level) => {
            heard.level?.(level);
            if (!open) return;
            waiting.push(pcm);
            queued += pcm.length;
            // The queue is bounded by the same window as the retries: audio that
            // has waited longer than that is audio the platform is not taking.
            if (queued > (RATE * RETRY_WINDOW) / 1000) {
              fault(new Error(`Transcript failed: nothing delivered for ${RETRY_WINDOW / 1000}s`));
              return;
            }
            void drain();
          },
          scope,
          made,
        );
      } catch (error) {
        if (!mic) void made.close();
        fault(error);
      }
    },

    async close() {
      if (!open) return;
      // Stop hearing, then deliver what was heard — a push waiting out a rate
      // limit included — before settling the tail.
      release();
      await drain();
      if (!open) return; // the platform refused the rest; fault has said so
      open = false;
      const last = current;
      current = null;
      if (!last) return;
      try {
        report(await persist(() => last.close(), alive(last)));
      } catch (error) {
        heard.refused(error as Error);
      }
    },
  };
}

export interface TranscriptOptions {
  /** The platform's speech services; the live transcript is `speech.stream`. */
  speech: Speech;
  language?: string;
  /** Everything heard so far in this sitting, tail included. */
  onPartial?: (text: string) => void;
  /** Text that has settled and will not change. */
  onSettled?: (text: string) => void;
}

/** A live transcript, drawn by `<Voice/>` like the other machines are. */
export interface TranscriptMachine {
  state: State;
  open: boolean;
  level: number;
  blocked: Blocker | null;
  reason: string | null;
  refusal: Refusal | null;
  toggle: () => void;
}

/** A live transcript that a click opens and a click settles, one per hook. */
export function useTranscript(options: TranscriptOptions): TranscriptMachine {
  const latest = useRef(options);
  latest.current = options;
  const live = useRef<Live | null>(null);
  const level = useRef(0);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [refused, setRefused] = useState<Refusal | null>(null);
  const [blocked, setBlocked] = useState<Blocker | null>(null);

  useEffect(() => {
    setBlocked(streamBlocker(capability()));
    return () => {
      void live.current?.close();
      live.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    void live.current?.close();
    live.current = null;
    level.current = 0;
    setOpen(false);
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (blocked) return;
    if (live.current) return stop();
    setRefused(null);
    setOpen(true);
    // A sitting that was closed still delivers what it heard, so its text lands
    // after the click that stopped it — but it no longer drives the button, and a
    // newer sitting's text is never written over by an older one's.
    const current = () => live.current === sitting;
    const ours = () => current() || live.current === null;
    const sitting = transcript(
      latest.current.speech,
      {
        partial: (text) => {
          if (current()) setListening(true);
          if (ours()) latest.current.onPartial?.(text);
        },
        settled: (text) => {
          if (ours()) latest.current.onSettled?.(text);
        },
        level: (value) => {
          level.current = value;
        },
        fail: (reason) => {
          stop();
          setBlocked(reason);
        },
        refused: (error) => {
          if (current()) stop();
          if (ours()) setRefused({ service: "ear", error, covered: false });
        },
      },
      { language: latest.current.language },
    );
    live.current = sitting;
    void sitting.open().then(() => {
      if (live.current === sitting) setListening(true);
    });
  }, [blocked, stop]);

  return useMemo(
    () => ({
      state: listening ? "listening" : "idle",
      open,
      get level() {
        return level.current;
      },
      blocked,
      reason: blocked ? REASON[blocked] : null,
      refusal: refused,
      toggle,
    }),
    [listening, open, blocked, refused, toggle],
  );
}
