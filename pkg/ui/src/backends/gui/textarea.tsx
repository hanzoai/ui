"use client"

import * as React from "react"
import { TextArea } from "@hanzo/gui"
import { BOX, FIELD, FILL, type FieldSize } from "./control"
import { fieldSize, useDensity } from "./density"
import { invalidOf, useField } from "./field"
import { slot } from "./slot"

/** Floor for the grown row count. */
const MIN_ROWS = 3

/**
 * The line each size sets its text on. The record sizes (`sm`, `xs`) set 13px
 * text on a 16px line, as the source kit's Textarea does (MIT, NOTICE); the regular
 * ones keep the 20px line of the 14px rung.
 */
const LINE: Record<FieldSize, number> = { default: 20, lg: 20, sm: 16, xs: 16 }

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
export type TextareaProps = Omit<React.ComponentProps<typeof TextArea>, "children" | "size"> &
  Pick<React.ComponentProps<"textarea">, "onKeyDown" | "rows"> & {
    /**
     * The gutter and riser of the Input it stands under (control.ts `BOX`).
     * Unset, the nearest `<Density>` decides.
     */
    size?: FieldSize
    /** On the raised ground instead of a bare edge (control.ts `FILL`). */
    fill?: boolean
    /**
     * The tallest the field grows, in lines, before it scrolls: the box is
     * capped at `maxRows` lines plus its risers and edges. A `maxH` the caller
     * states still wins.
     */
    maxRows?: number
  }

const Textarea = /* @__PURE__ */ React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ rows, value, defaultValue, style, size, fill = false, maxRows, ...props }, ref) {
  const density = useDensity()
  const field = useField()
  const resolved = fieldSize(size, density)
  const box = BOX[resolved]
  const line = LINE[resolved]
  const dense = resolved === "sm" || resolved === "xs"
  const [typed, setTyped] = React.useState(() => rowsOf(defaultValue))
  const uncontrolled = value === undefined
  const invalid = invalidOf(props["aria-invalid"], field)

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
      // The record density's ground, as Input's.
      {...(density === "compact" ? { bg: "$panel" } : null)}
      {...(fill ? FILL : null)}
      width="100%"
      // Three lines of the size's own leading, its risers and its two edges —
      // 64 on the regular rungs, as it has always been; a dense box is shorter.
      minH={dense ? MIN_ROWS * line + 2 * box.riser + 2 : 64}
      {...(maxRows ? { maxH: maxRows * line + 2 * box.riser + 2 } : null)}
      // The gutter has to be NAMED, both ways. Left unsaid the HORIZONTAL one
      // came from gui's `textAreaSizeVariant`, which computes its own and landed
      // on 20 — so the one field a form makes tall was also the one indented
      // differently from the two above it.
      //
      // The VERTICAL one was simply absent, which is the same fault seen from
      // the other side: an input centres its single line inside a fixed height
      // and a textarea stacks from the top, so with no gutter the tall field's
      // first line sat 1px under the edge where its neighbours' sat at 8. In a
      // form the two are read together, and the text looked like it was falling
      // out of the top of the box. The riser is that arithmetic, per size.
      px={box.gutter}
      pt={box.riser}
      pb={box.riser}
      borderColor={invalid ? "$red7" : "$borderColor"}
      {...(invalid ? { focusStyle: { borderColor: "$red8" } } : null)}
      // The value at the full ink, the hint at the placeholder token. gui's
      // Input sub-theme draws its value at 80% grey, which left a typed value
      // and a sample placeholder one rung apart.
      color="$ink"
      placeholderTextColor="$placeholderColor"
      fontSize={box.font}
      {...(dense ? { lineHeight: line } : null)}
      opacity={props.disabled ? 0.5 : 1}
      // A Field that states it is invalid says so to assistive tech as well.
      {...(invalid ? { "aria-invalid": true } : null)}
      {...(props as Record<string, unknown>)}
      // After the caller's props, so a passed `style` cannot silently disable
      // growth. A fixed height is asked for with `height`.
      style={{ ...(style as object), ...(grown ? { height: grown } : null) }}
    />
  )
  },
)

export { Textarea }
