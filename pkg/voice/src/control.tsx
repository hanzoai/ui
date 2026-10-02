import { useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { REFUSED } from "./types.js";
import type { Blocker, Refusal, State } from "./types.js";

/** What the button draws: any of this package's machines — the dictation and
 *  conversation machine (`useVoice`), talk mode (`useTalk`) or a live transcript
 *  (`useTranscript`). */
export interface Machine {
  state: State;
  open: boolean;
  /** Sampled on animation frames for the meter. */
  level: number;
  blocked: Blocker | null;
  reason: string | null;
  refusal: Refusal | null;
  toggle: () => void;
}

export interface VoiceProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> {
  /** The machine, from `useVoice`, `useTalk` or `useTranscript`. */
  voice: Machine;
  /** Disabled for the surface's own reasons — mid-submit, say. */
  disabled?: boolean;
  /** Override the glyph. Given the state, so it can change with it. */
  children?: ReactNode | ((state: State) => ReactNode);
  /** What the button says in each state, where the surface's meaning differs
   *  from a conversation — a dictation mic, a transcript. */
  says?: Partial<Record<State, string>>;
}

const SAY: Record<State, string> = {
  idle: "Talk to Hanzo",
  listening: "Listening — click to stop",
  speaking: "Speaking — talk to interrupt",
};

/**
 * The one microphone.
 *
 * It draws a machine and nothing else: no transcript, no timer, no colour. The
 * surface supplies the chrome through `className`, which is why the same
 * control sits inside hanzo.chat's composer and hanzo.app's console bar without
 * either of them carrying a copy of it.
 *
 * When voice cannot run the button stays, disabled, wearing the reason — a
 * control that quietly disappears teaches the user nothing. It wears a platform
 * refusal the same way: a browser standing in for a refused speech service
 * sounds like success, and only the label says otherwise.
 */
export function Voice({ voice, disabled, children, says, ...rest }: VoiceProps) {
  const { state, open, blocked, reason, refusal, toggle } = voice;
  const stood = refusal ? REFUSED[refusal.covered ? "covered" : "lost"] : null;
  const label = [reason ?? says?.[state] ?? SAY[state], stood].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={open}
      aria-disabled={blocked ? true : undefined}
      data-state={state}
      data-refusal={refusal ? refusal.service : undefined}
      title={label}
      disabled={disabled || !!blocked}
      onClick={toggle}
      {...rest}
    >
      {typeof children === "function"
        ? children(state)
        : (children ?? (state === "listening" ? <Meter voice={voice} /> : <Glyph />))}
    </button>
  );
}

/** A microphone, in one colour: whatever the surface is already using. */
function Glyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  );
}


/**
 * The waveform, while listening — five bars breathing with the live input.
 *
 * The machine RETAINS `level` (mutated in place, no render per frame); this
 * samples it on animation frames and writes transform directly, so sixty
 * updates a second cost zero reconciliation. Bars scale from a short history,
 * centre-weighted, so speech reads as a wave rather than five equal columns.
 * One colour — currentColor, like the glyph it replaces: the surface already
 * chose the ink. Reduced-motion users keep the static glyph; a meter is
 * motion by definition.
 */
function Meter({ voice }: { voice: Machine }) {
  const bars = useRef<Array<SVGRectElement | null>>([]);
  const history = useRef<number[]>([0, 0, 0, 0, 0]);
  const reduce =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    const tick = () => {
      const h = history.current;
      h.push(Math.min(1, voice.level * 3)); // speech RMS is small; 3x reads right
      h.shift();
      // Centre-weighted: newest in the middle, older toward the edges.
      const order = [h[0], h[2], h[4], h[3], h[1]];
      bars.current.forEach((bar, i) => {
        if (!bar) return;
        const scale = 0.25 + (order[i] ?? 0) * 0.75;
        bar.style.transform = `scaleY(${scale})`;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [voice, reduce]);

  if (reduce) return <Glyph />;

  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {[4, 8, 12, 16, 20].map((x, i) => (
        <rect
          key={x}
          ref={(el) => {
            bars.current[i] = el;
          }}
          x={x - 1.25}
          y={4}
          width={2.5}
          height={16}
          rx={1.25}
          style={{ transform: "scaleY(0.25)", transformOrigin: "center", transformBox: "fill-box" }}
        />
      ))}
    </svg>
  );
}
