import { useMemo, useRef } from "react";

import type { VoiceOptions } from "./voice.js";

type Hands = Required<Pick<VoiceOptions, "onPartial" | "onUtterance">>;

/**
 * Dictation into a field the person still sends.
 *
 * Each utterance lands after what the field held when it began, never in place
 * of it: a pause between two sentences is not a reason to lose the first, and
 * neither is a word typed before the mic opened. The running transcript rides
 * after that same text while it is heard. A field that no longer begins with
 * that text was sent or rewritten underneath, and what it holds now is kept.
 */
export function dictation(read: () => string, write: (text: string) => void): Hands {
  let before: string | null = null;
  const head = () => {
    const now = read();
    if (before === null || !now.startsWith(before.trimEnd())) before = now;
    return before;
  };
  const join = (lead: string, said: string) => (lead.trim() ? `${lead.trimEnd()} ${said}` : said);
  return {
    onPartial(text) {
      write(join(head(), text));
    },
    onUtterance(text) {
      write(join(head(), text));
      before = null;
    },
  };
}

/**
 * `dictation` for a controlled field: hand it the field's value and setter, and
 * spread what it returns into `useVoice`.
 *
 * ```tsx
 * const voice = useVoice({ speech, ...useDictation(draft, setDraft) });
 * ```
 */
export function useDictation(value: string, write: (text: string) => void): Hands {
  const field = useRef({ value, write });
  field.current = { value, write };
  return useMemo(
    () => dictation(() => field.current.value, (text) => field.current.write(text)),
    [],
  );
}
