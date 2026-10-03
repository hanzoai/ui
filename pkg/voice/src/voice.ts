import { useCallback, useEffect, useMemo, useState } from "react";

import { blocker, capability } from "./capability.js";
import { listen } from "./listen.js";
import { mouth } from "./speak.js";
import { REASON } from "./types.js";
import type { Blocker, Ear, Mouth, Refusal, Side, Speech, State } from "./types.js";

export interface VoiceOptions {
  /** The running transcript, as it is heard. Show it in the composer. */
  onPartial?: (text: string) => void;
  /**
   * One finished utterance. Send it through the composer's EXISTING submit
   * path — voice is a way of typing, not a second way of sending.
   */
  onUtterance: (text: string) => void;
  /** The platform's speech services. Without them the browser stands in. */
  speech?: Speech;
  /** Which side to try first. The platform's, unless the caller says otherwise. */
  prefer?: Side;
  /** The platform refused, and the browser is standing in or cannot. Fires once
   *  per conversation per service; also readable as `refusal` on the machine. */
  onRefusal?: (refusal: Refusal) => void;
  /** BCP-47. Defaults to the browser's own language. */
  language?: string;
  /** Silence, in ms, that ends an utterance. */
  pause?: number;
  /** The reading voice, by `speechSynthesis` voice name. Browser leg only —
   *  the platform's voice is the transport's, or the one `say` names. */
  voice?: string;
  /** The live input level, 0..1, while the mic is open — for a meter or a
   *  waveform. Fires many times a second; keep the handler cheap. */
  onLevel?: (value: number) => void;
}

/**
 * THE conversation. One per page, module-owned, because an open microphone is
 * a fact about the page and not about any component drawing a button for it.
 *
 * The old shape kept `live` at module scope but the ear inside each hook
 * instance, and that split is exactly where "the voice will not stop" came
 * from: every mounted composer resurrected its own ear, the visible button
 * closed only its own, and the others kept listening with no control attached.
 * Here there is one ear, one mouth, one owner — the most recently mounted
 * composer — and any button anywhere ends the whole thing.
 */
type Machine = {
  /** Latest input level, 0..1 — retained for the control's meter. */
  level: number;
  live: boolean;
  ear: Ear | null;
  lips: Mouth | null;
  speaking: boolean;
  /** Counts sentences handed to `say`, so each knows whether it is still the one playing. */
  turn: number;
  state: State;
  open: boolean;
  /** The platform's last refusal in this conversation, or null. */
  refusal: Refusal | null;
  /** The composer currently speaking for the page. */
  owner: { current: VoiceOptions } | null;
  owners: { current: VoiceOptions }[];
  watchers: Set<() => void>;
};

const machine: Machine = {
  level: 0,
  live: false,
  ear: null,
  lips: null,
  speaking: false,
  turn: 0,
  state: "idle",
  open: false,
  refusal: null,
  owner: null,
  owners: [],
  watchers: new Set(),
};

function tell() {
  machine.watchers.forEach((watcher) => watcher());
}

function report(state: State, open: boolean) {
  machine.state = state;
  machine.open = open;
  if (!open) machine.level = 0;
  tell();
}

function close() {
  machine.ear?.close();
  machine.ear = null;
  machine.lips?.hush();
  machine.speaking = false;
  report("idle", false);
}

function start(onFail: (reason: Blocker) => void) {
  const options = () => machine.owner?.current;
  // A fresh conversation asks the platform again, so it starts with no refusal
  // held against it.
  machine.refusal = null;
  const refused = (refusal: Refusal) => {
    machine.refusal = refusal;
    options()?.onRefusal?.(refusal);
    tell();
  };
  const opened = listen({
    language: options()?.language,
    pause: options()?.pause,
    speech: options()?.speech,
    prefer: options()?.prefer,
    heard: {
      refused,
      partial: (text) => options()?.onPartial?.(text),
      utterance: (text) => options()?.onUtterance(text),
      // Barge-in: a word over the reply stops it and begins the next turn.
      onset: () => {
        if (!machine.speaking) return;
        machine.lips?.hush();
        machine.speaking = false;
        report("listening", true);
      },
      fail: (reason) => {
        machine.live = false;
        close();
        onFail(reason);
      },
      level: (value) => {
        // Retained ON the machine so a control can sample it per animation
        // frame without a React render per frame; forwarded to the surface's
        // own listener as before.
        machine.level = value;
        options()?.onLevel?.(value);
      },
    },
  });
  machine.ear = opened;
  machine.lips = mouth({
    speech: options()?.speech,
    voice: () => options()?.voice,
    refused,
  });
  machine.live = true;
  // `open` is the user's intent, and it is true from the click. `state` is
  // what is actually happening, and it does not claim to be listening until
  // the microphone really is — a permission prompt is not a live mic.
  report("idle", true);
  void opened.open().then(() => {
    if (machine.ear === opened) report("listening", true);
  });
}

export interface Voice {
  state: State;
  /** True from the first click to the second. A conversation, not a keypress. */
  open: boolean;
  /** The latest input level, 0..1, while the mic is open. Mutated in place —
   *  sample it (rAF), never render from it. */
  level: number;
  /** Why voice cannot run here, or `null`. */
  blocked: Blocker | null;
  /** One sentence a person can act on, or `null`. */
  reason: string | null;
  /** The platform's refusal in this conversation, or `null`. Render it: a
   *  service that refused and a service that worked sound the same. */
  refusal: Refusal | null;
  /** Start the conversation, or end it. */
  toggle: () => void;
  /** Read a reply aloud, in `voice` — the speech service's voice id — where
   *  given. A no-op unless the conversation is live. Resolves `true` when the
   *  sentence played to its end, `false` when it was spoken over, hushed,
   *  replaced or never read — so a reply read in parts stops where it was
   *  interrupted instead of carrying on over the speaker. */
  say: (text: string, voice?: string) => Promise<boolean>;
  /** Stop mid-word. */
  hush: () => void;
}

/**
 * A spoken conversation with the composer it is attached to.
 *
 * One click opens the microphone and it stays open: the transcript streams into
 * the composer as it is heard, each pause sends a turn through the composer's
 * own submit path, and the reply is read back. Speaking over the reply stops it
 * and starts the next turn. A second click — on ANY mic on the page — ends it.
 *
 * The conversation outlives the composer drawing it: sending the first turn is
 * exactly what makes a chat surface swap `/c/new` for `/c/<id>`, which remounts
 * the composer, and a remount is not hanging up. In memory only — a fresh page
 * load starts closed, because nobody has asked for the microphone yet.
 *
 * The caller keeps the machine (it needs `say`); `<Voice/>` only draws it.
 */
export function useVoice(options: VoiceOptions): Voice {
  const [blocked, setBlocked] = useState<Blocker | null>(null);
  const [, bump] = useState(0);

  // The machine calls whoever most recently mounted — the active surface.
  const latest = useMemo(() => ({ current: options }), []);
  latest.current = options;

  useEffect(() => {
    machine.owners.push(latest);
    machine.owner = latest;
    const tell = () => bump((n) => n + 1);
    machine.watchers.add(tell);
    // Pick the conversation back up after a remount: the previous owner's
    // unmount tore down its subscription, never the page's conversation.
    if (machine.live && !machine.ear) start(setBlocked);
    return () => {
      machine.watchers.delete(tell);
      machine.owners = machine.owners.filter((o) => o !== latest);
      machine.owner = machine.owners[machine.owners.length - 1] ?? null;
      // The LAST composer leaving takes the microphone with it: with no owner
      // there is nobody to receive an utterance, and a mic with no surface is
      // exactly the "it will not stop" bug. `live` stays true so a remount in
      // the same breath (a route swap) resumes the conversation.
      if (!machine.owner) {
        machine.ear?.close();
        machine.ear = null;
        machine.lips?.hush();
        machine.speaking = false;
        machine.state = "idle";
        machine.open = false;
      }
    };
  }, [latest]);

  useEffect(() => {
    setBlocked(blocker(capability(), options.speech));
    // Probed once per speech transport — capability does not change under us.
  }, [options.speech]);

  const toggle = useCallback(() => {
    if (blocked) return;
    if (machine.ear) {
      machine.live = false;
      close();
    } else {
      // The mic that was pressed speaks for the page: its composer receives the
      // turns, not whichever mounted last — a page's own composer and the shell's
      // footer bar are both on screen, and the words belong where the click was.
      machine.owners = [...machine.owners.filter((o) => o !== latest), latest];
      machine.owner = latest;
      start(setBlocked);
    }
  }, [blocked, latest]);

  const say = useCallback(async (text: string, voice?: string) => {
    const said = text.trim();
    // Replies are spoken inside a conversation. Typed turns stay quiet.
    if (!said || !machine.ear || !machine.lips) return false;
    const mine = ++machine.turn;
    machine.speaking = true;
    report("speaking", true);
    let played = false;
    try {
      await machine.lips.say(said, voice);
    } finally {
      // Still this sentence's turn and still speaking: nobody spoke over it,
      // hushed it, hung up or handed `say` the next one.
      played = machine.speaking && machine.turn === mine;
      if (played) {
        machine.speaking = false;
        report(machine.ear ? "listening" : "idle", machine.open);
      }
    }
    return played;
  }, []);

  const hush = useCallback(() => {
    machine.lips?.hush();
    machine.speaking = false;
    report(machine.ear ? "listening" : "idle", machine.open);
  }, []);

  return useMemo(
    () => ({
      state: machine.state,
      open: machine.open,
      // A GETTER, deliberately: the snapshot is memoized per render, but the
      // meter samples level on animation frames between renders. The getter
      // reads the module machine live on every access — sixty samples a
      // second, zero React renders.
      get level() {
        return machine.level;
      },
      blocked,
      reason: blocked ? REASON[blocked] : null,
      refusal: machine.refusal,
      toggle,
      say,
      hush,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- machine.state/open
    // /refusal are read fresh each render; watchers bump renders when they change.
    [machine.state, machine.open, machine.refusal, blocked, toggle, say, hush],
  );
}
