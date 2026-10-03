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
 * A live transcript on `/v1/audio/transcript`: the microphone streams up as
 * 16 kHz pcm16 and the text grows as it is heard.
 *
 * The endpoint admits one push at a time, so audio heard while a push is in
 * flight waits and rides with the next one, up to the most a push may carry. A
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
  let busy = false;
  let waiting: Int16Array[] = [];
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
    heard.refused(error as Error);
  };

  const release = () => {
    mic?.close();
    mic = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  };

  // Close the full transcript and carry on in a new one. What it settled stays
  // in front of everything the next one hears.
  const roll = async () => {
    const full = current as Stream;
    current = null;
    report(await full.close());
    before = `${before} ${settled}`.trim();
    settled = "";
    current = await (speech.stream as NonNullable<Speech["stream"]>)({ language: options.language });
  };

  const drain = async () => {
    if (busy || !current || !waiting.length) return;
    busy = true;
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
        const said = await current.push(pcm);
        report(said);
        if (said.seconds >= current.limit - MARGIN) await roll();
      }
    } catch (error) {
      fault(error);
    } finally {
      busy = false;
    }
  };

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
        current = await speech.stream({ language: options.language });
        open = true;
        mic = await tap(
          stream,
          Math.round((RATE * current.chunk) / 1000),
          (pcm, level) => {
            heard.level?.(level);
            if (!open) return;
            waiting.push(pcm);
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
      open = false;
      release();
      waiting = [];
      const last = current;
      current = null;
      if (!last) return;
      try {
        report(await last.close());
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
    const sitting = transcript(
      latest.current.speech,
      {
        partial: (text) => {
          setListening(true);
          latest.current.onPartial?.(text);
        },
        settled: (text) => latest.current.onSettled?.(text),
        level: (value) => {
          level.current = value;
        },
        fail: (reason) => {
          stop();
          setBlocked(reason);
        },
        refused: (error) => {
          stop();
          setRefused({ service: "ear", error, covered: false });
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
