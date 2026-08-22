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
 * Textarea — standard-token multiline field that grows with its content.
 *
 * The height is measured off the node and applied INLINE. Two nearer-looking
 * routes do not work here: `onContentSizeChange` never fires, because gui's
 * `TextArea` is `styled(Input, { render: 'textarea' })` over a real DOM element
 * rather than react-native-web's `TextInput`; and a `height` style prop would
 * mint one atomic class per pixel value, none of them in the packaged sheet.
 *
 * `rows` is the floor and `maxH` the ceiling — CSS clamps between them and the
 * field scrolls past the ceiling, so neither bound is re-implemented here.
 * Counting newlines instead would miss a paragraph that wraps without one.
 *
 * Guarded on `scrollHeight` being a number, so where the host is not a DOM
 * element the effect no-ops and the row count is what remains.
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

  // Both refs reach the same host: ours to measure it, and the caller's.
  const hold = React.useCallback(
    (el: HTMLTextAreaElement | null) => {
      node.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
    },
    [ref],
  )

  // What the field is showing: told when controlled, watched when not.
  const shown = uncontrolled ? typed : value

  React.useLayoutEffect(() => {
    const el = node.current
    if (!el || typeof el.scrollHeight !== "number") return
    // Released to `auto` first, or `scrollHeight` reports the height it already
    // has and the field can only grow. Restored before paint.
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
      placeholderTextColor="$soft"
      fontSize="$3"
      opacity={props.disabled ? 0.5 : 1}
      {...(props as Record<string, unknown>)}
      // After the caller's props, so a passed `style` cannot silently disable
      // growth. A fixed height is asked for with `height`.
      style={{ ...(style as object), ...(grown ? { height: grown } : null) }}
    />
  )
  },
)

export { Textarea }
