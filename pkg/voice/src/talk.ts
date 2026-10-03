import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { capability, streamBlocker } from "./capability.js";
import { audioContext, base64, capture, RATE, refusal, samples, tap } from "./mic.js";
import type { Tap } from "./mic.js";
import { REASON } from "./types.js";
import type { Blocker, Refusal, State } from "./types.js";

export interface TalkConfig {
  /** Where `/v1/voice` lives. Defaults to the Hanzo gateway. */
  baseUrl?: string;
  /** A bearer for the platform. The socket itself carries none: the bearer is
   *  spent on the session call, which answers a one-use ticket. */
  token?: string | (() => string | null | Promise<string | null>);
  /** The organization to bill, when the bearer belongs to several. */
  org?: string;
  fetch?: typeof fetch;
}

/** What the talk socket reports while a conversation is open. */
export interface Talked {
  /** `listening` while the floor is the person's, `speaking` while a reply plays. */
  state(state: State): void;
  /** The reply's running transcript, as it is spoken. */
  reply?(text: string): void;
  /** One whole reply. */
  done?(text: string): void;
  /** The live input level, 0..1. */
  level?(value: number): void;
  /** The microphone cannot open. */
  fail(reason: Blocker): void;
  /** The platform refused the conversation, or ended it. */
  refused(error: Error): void;
  /** The platform answered a turn with an error and kept the conversation. */
  error?(message: string): void;
}

/** An open conversation. */
export interface Talk {
  open(): Promise<void>;
  close(): void;
}

const BASE = "https://api.hanzo.ai";

/** Audio sent per message: 100 ms of 16 kHz pcm16. */
const FRAME = RATE / 10;

type Event = { type: string; delta?: string; error?: { message?: string } };

/**
 * A spoken conversation over one socket: `/v1/voice`, the OpenAI realtime wire.
 *
 * The microphone streams up as 16 kHz pcm16 and the reply streams down as 24 kHz
 * pcm16 with its transcript beside it. Turn-taking is the server's: it decides
 * when the person has finished, answers, and says so with
 * `input_audio_buffer.speech_started` when they talk over the reply, which is
 * where playback stops. Nothing here decides a turn.
 *
 * Two calls, because a browser cannot put a header on a WebSocket: the bearer is
 * spent on `POST /v1/voice/session`, and what goes in the socket's URL is the
 * one-use ticket that answers.
 */
export function talk(config: TalkConfig, heard: Talked, scope: unknown = globalThis): Talk {
  const base = (config.baseUrl ?? BASE).replace(/\/+$/, "");
  const send = config.fetch ?? globalThis.fetch;
  const Socket = (scope as { WebSocket?: typeof WebSocket })?.WebSocket ?? globalThis.WebSocket;

  let stream: MediaStream | null = null;
  let mic: Tap | null = null;
  let sock: WebSocket | null = null;
  let closed = false;
  let reply = "";
  // Playback: each delta is scheduled after the one before, on the tap's own
  // context, and every source still sounding is kept so a barge-in can stop it.
  const sounding = new Set<AudioBufferSourceNode>();
  let next = 0;
  let speaking = false;

  const tell = (state: State) => heard.state(state);
  const hush = () => {
    for (const source of sounding) {
      source.onended = null;
      source.stop();
    }
    sounding.clear();
    next = 0;
    if (speaking) {
      speaking = false;
      tell("listening");
    }
  };

  const play = (b64: string) => {
    const context = mic?.context;
    if (!context) return;
    const pcm = samples(b64);
    if (!pcm.length) return;
    const clip = context.createBuffer(1, pcm.length, 24000);
    clip.copyToChannel(pcm, 0);
    const source = context.createBufferSource();
    source.buffer = clip;
    source.connect(context.destination);
    const at = Math.max(context.currentTime, next);
    source.start(at);
    next = at + clip.duration;
    sounding.add(source);
    source.onended = () => {
      sounding.delete(source);
      if (!sounding.size && speaking) {
        speaking = false;
        tell("listening");
      }
    };
    if (!speaking) {
      speaking = true;
      tell("speaking");
    }
  };

  const end = () => {
    closed = true;
    hush();
    mic?.close();
    mic = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (sock && sock.readyState <= 1) sock.close();
    sock = null;
  };

  const ticket = async (): Promise<string> => {
    const headers = new Headers();
    const source = config.token;
    const token = typeof source === "function" ? await source() : source;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (config.org) headers.set("X-Org-Id", config.org);
    const response = await send(`${base}/v1/voice/session`, { method: "POST", headers, credentials: "include" });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Talk failed (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`);
    }
    const { ticket } = (await response.json()) as { ticket?: string };
    if (!ticket) throw new Error("Talk failed: the session named no ticket");
    return ticket;
  };

  return {
    async open() {
      if (sock || closed) return;
      // Made before the first await, so it is made inside the click (Safari).
      const made = audioContext(scope);
      try {
        stream = await capture(scope);
      } catch (error) {
        void made.close();
        heard.fail(refusal(error));
        return;
      }
      let pass: string;
      try {
        pass = await ticket();
      } catch (error) {
        void made.close();
        end();
        heard.refused(error as Error);
        return;
      }
      if (closed) {
        void made.close();
        return;
      }
      const url = `${base.replace(/^http/, "ws")}/v1/voice?ticket=${encodeURIComponent(pass)}`;
      const socket = new Socket(url, ["realtime"]);
      sock = socket;
      socket.onmessage = (message: MessageEvent<string>) => {
        let event: Event;
        try {
          event = JSON.parse(message.data) as Event;
        } catch {
          return;
        }
        switch (event.type) {
          case "input_audio_buffer.speech_started":
            hush();
            break;
          case "response.audio.delta":
            if (event.delta) play(event.delta);
            break;
          case "response.audio_transcript.delta":
            reply += event.delta ?? "";
            heard.reply?.(reply);
            break;
          case "response.done":
            if (reply) heard.done?.(reply);
            reply = "";
            break;
          case "error":
            heard.error?.(event.error?.message ?? "the conversation could not answer that");
            break;
        }
      };
      socket.onclose = () => {
        if (closed) return;
        end();
        heard.refused(new Error("Talk ended: the conversation closed"));
      };
      socket.onopen = () => {
        void tap(
          stream as MediaStream,
          FRAME,
          (pcm, level) => {
            heard.level?.(level);
            if (socket.readyState === 1) {
              socket.send(JSON.stringify({ type: "input_audio_buffer.append", audio: base64(pcm) }));
            }
          },
          scope,
          made,
        ).then(
          (opened) => {
            if (closed) return opened.close();
            mic = opened;
            tell("listening");
          },
          (error: Error) => {
            end();
            heard.refused(error);
          },
        );
      };
    },

    close() {
      end();
    },
  };
}

export interface TalkOptions extends TalkConfig {
  /** The reply's running transcript, as it is spoken. */
  onReply?: (text: string) => void;
  /** One whole reply. */
  onDone?: (text: string) => void;
  /** A turn the platform answered with an error. */
  onError?: (message: string) => void;
}

/** A talk conversation, drawn by `<Voice/>` like the dictation machine is. */
export interface TalkMachine {
  state: State;
  open: boolean;
  /** The latest input level, 0..1. A getter: sample it, never render from it. */
  level: number;
  blocked: Blocker | null;
  reason: string | null;
  refusal: Refusal | null;
  toggle: () => void;
  /** The reply being spoken, or the last one, until the next begins. */
  reply: string;
}

/**
 * Talk mode: a hands-free spoken conversation on `/v1/voice`, one per hook.
 *
 * One click opens the microphone and the socket, the reply is spoken back and
 * its words arrive in `reply`; talking over it stops it. A second click hangs up,
 * as does unmounting the surface that drew it.
 */
export function useTalk(options: TalkOptions): TalkMachine {
  const latest = useRef(options);
  latest.current = options;
  const live = useRef<Talk | null>(null);
  const level = useRef(0);
  const [state, setState] = useState<State>("idle");
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [refused, setRefused] = useState<Refusal | null>(null);
  const [blocked, setBlocked] = useState<Blocker | null>(null);

  useEffect(() => {
    setBlocked(streamBlocker(capability()));
    return () => {
      live.current?.close();
      live.current = null;
    };
  }, []);

  const hangUp = useCallback(() => {
    live.current?.close();
    live.current = null;
    level.current = 0;
    setOpen(false);
    setState("idle");
  }, []);

  const toggle = useCallback(() => {
    if (blocked) return;
    if (live.current) return hangUp();
    setRefused(null);
    setReply("");
    setOpen(true);
    const o = latest.current;
    const conversation = talk(
      { baseUrl: o.baseUrl, token: o.token, org: o.org, fetch: o.fetch },
      {
        state: setState,
        reply: (text) => {
          setReply(text);
          latest.current.onReply?.(text);
        },
        done: (text) => latest.current.onDone?.(text),
        error: (message) => latest.current.onError?.(message),
        level: (value) => {
          level.current = value;
        },
        fail: (reason) => {
          hangUp();
          setBlocked(reason);
        },
        refused: (error) => {
          hangUp();
          setRefused({ service: "talk", error, covered: false });
        },
      },
    );
    live.current = conversation;
    void conversation.open();
  }, [blocked, hangUp]);

  return useMemo(
    () => ({
      state,
      open,
      get level() {
        return level.current;
      },
      blocked,
      reason: blocked ? REASON[blocked] : null,
      refusal: refused,
      toggle,
      reply,
    }),
    [state, open, blocked, refused, toggle, reply],
  );
}
