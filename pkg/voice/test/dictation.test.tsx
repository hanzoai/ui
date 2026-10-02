import { act, render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { dictation, useDictation } from "../src/index.js";

/** A field, as a surface holds one: its value, and a setter that renders later. */
function field(initial = "") {
  let value = initial;
  return { read: () => value, write: (text: string) => (value = text), get value() { return value; } };
}

describe("dictation into a field the person still sends", () => {
  it("adds each utterance after the last, never in place of it", () => {
    const box = field();
    const hands = dictation(box.read, box.write);

    hands.onPartial("book a table");
    hands.onUtterance("book a table");
    hands.onPartial("for two");
    hands.onUtterance("for two at eight");

    expect(box.value).toBe("book a table for two at eight");
  });

  it("keeps what was typed before the mic opened", () => {
    const box = field("Dinner:");
    const hands = dictation(box.read, box.write);

    hands.onPartial("somewhere");
    hands.onPartial("somewhere quiet");
    expect(box.value).toBe("Dinner: somewhere quiet");
    hands.onUtterance("somewhere quiet please");

    expect(box.value).toBe("Dinner: somewhere quiet please");
  });

  it("starts from what the field holds when it was sent underneath", () => {
    const box = field("first thought");
    const hands = dictation(box.read, box.write);

    hands.onPartial("and");
    box.write(""); // sent mid-sentence
    hands.onUtterance("and another");

    expect(box.value).toBe("and another");
  });

  it("holds its place across the renders a controlled field makes", async () => {
    let said!: ReturnType<typeof useDictation>;
    let shown = "";
    function Field() {
      const [draft, setDraft] = useState("hello");
      said = useDictation(draft, setDraft);
      shown = draft;
      return null;
    }
    render(<Field />);

    // The platform's ear reports a turn whole: partial and utterance together,
    // before the field has rendered the first.
    await act(async () => {
      said.onPartial("world");
      said.onUtterance("world");
    });
    expect(shown).toBe("hello world");

    // The browser's ear reports word by word, a render between each.
    await act(async () => said.onPartial("how"));
    await act(async () => said.onPartial("how are"));
    await act(async () => said.onUtterance("how are you"));
    expect(shown).toBe("hello world how are you");
  });
});
