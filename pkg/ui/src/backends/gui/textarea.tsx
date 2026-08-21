"use client"

import * as React from "react"
import { TextArea } from "@hanzo/gui"
import { FIELD } from "./control"
import { slot } from "./slot"

/** Floor for the grown row count. */
const MIN_ROWS = 3

const rowsOf = (v: unknown) =>
  typeof v === "string" ? v.split("\n").length : 0

/**
 * Textarea — standard-token multiline field that grows with what is in it.
 *
 * Growth used to be LINE-DRIVEN — `rows` from `value.split('\n').length` — on
 * the stated grounds that counting newlines is the one measurement web, native
 * and desktop agree on. It counts the wrong thing. A draft that wraps without
 * ever containing a newline never raises the count, so the most ordinary input
 * there is, one long paragraph, scrolls inside the floor while you type.
 * Measured in Chromium at 420px wide: 700 characters and no `\n` gave
 * `clientHeight 44` around `scrollHeight 160`.
 *
 * The fix is to measure the content. Two things that look like the measurement
 * are not available here, and both were tried:
 *
 *   `onContentSizeChange` is the RN API for exactly this, and
 *   react-native-web implements it by reading `scrollHeight`
 *   (`dist/exports/TextInput/index.js:192`). It never fires through this
 *   component — measured, zero calls, no warning. gui's `TextArea` is
 *   `styled(Input, { render: 'textarea' })` from `@hanzogui/web`: a Tamagui
 *   styled component over a real DOM `<textarea>`, so RNW's `TextInput` is not
 *   on the path and neither is its implementation of that prop.
 *
 *   A `height` STYLE PROP would be compiled by gui into one atomic class per
 *   distinct pixel value, so a field that grows through forty heights mints
 *   forty rules at runtime — none of them in the packaged sheet.
 *
 * So the height is measured off the node and applied INLINE, which is the one
 * channel that carries a per-render value without going through the atomic
 * compiler. `rows` stays the floor and `maxH` stays the ceiling; CSS clamps
 * between them and the field scrolls past the ceiling, so neither bound is
 * re-implemented in script.
 *
 * The measurement is guarded on `scrollHeight` actually being a number, so on a
 * target where the host is not a DOM element the effect no-ops and the
 * line-driven floor is what remains — today's behaviour, unchanged, rather than
 * a broken one.
 */
/**
 * Typed from the gui component it renders, exactly as `Input` is — the field
 * takes `onChangeText`, not a DOM `change` event, and the DOM-only spelling was
 * a type that never matched the runtime.
 */
export type TextareaProps = Omit<React.ComponentProps<typeof TextArea>, "children"> &
  Pick<React.ComponentProps<"textarea">, "onKeyDown" | "rows">

const Textarea = /* @__PURE__ */ React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ rows, value, defaultValue, style, ...props }, ref) {
  const [typed, setTyped] = React.useState(() => rowsOf(defaultValue))
  const uncontrolled = value === undefined
  const invalid = props["aria-invalid"]

  const node = React.useRef<HTMLTextAreaElement | null>(null)
  const [grown, setGrown] = React.useState<number | undefined>(undefined)

  // Both refs reach the same host: ours to measure it, the caller's because a
  // caller that hands one over must still get it. Written as a callback so
  // neither is dropped on the other's behalf.
  const hold = React.useCallback(
    (el: HTMLTextAreaElement | null) => {
      node.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
    },
    [ref],
  )

  // The value the field is actually showing — a controlled field is told, an
  // uncontrolled one has to be watched, and both have to re-measure.
  const shown = uncontrolled ? typed : value

  React.useLayoutEffect(() => {
    const el = node.current
    if (!el || typeof el.scrollHeight !== "number") return
    // Released to `auto` first, or `scrollHeight` reports the height it already
    // has and the field can only ever grow. Restored in the same synchronous
    // block, before paint, so nothing flashes.
    const held = el.style.height
    el.style.height = "auto"
    const measured = el.scrollHeight
    el.style.height = held
    setGrown((h) => (h === measured ? h : measured))
  }, [shown])

  return (
    <TextArea
      ref={hold as never}
      {...slot("textarea")}
      rows={Math.max(rows ?? MIN_ROWS, uncontrolled ? typed : rowsOf(value))}
      value={value as string | undefined}
      defaultValue={defaultValue as string | undefined}
      onChangeText={uncontrolled ? (t: any) => setTyped(rowsOf(t)) : undefined}
      {...FIELD}
      width="100%"
      minH={64}
      // The gutter has to be NAMED. Left unsaid it came from gui's
      // `textAreaSizeVariant`, which computes its own horizontal padding and
      // landed on 20 — so the one field a form makes tall was also the one
      // indented differently from the two above it.
      borderColor={invalid && invalid !== "false" ? "$red7" : "$borderColor"}
      placeholderTextColor="$color10"
      fontSize="$3"
      opacity={props.disabled ? 0.5 : 1}
      {...(props as Record<string, unknown>)}
      // After the caller's props: the measurement is this component's answer to
      // its own question, and a caller's `style` should not silently turn the
      // growth off. A caller wanting a fixed height says so with `height`.
      style={{ ...(style as object), ...(grown ? { height: grown } : null) }}
    />
  )
  },
)

export { Textarea }
