"use client"

import * as React from "react"
import { TextArea } from "@hanzo/gui"
import { FOCUS } from "./focus"

/** Floor for the grown row count. */
const MIN_ROWS = 3

const rowsOf = (v: unknown) =>
  typeof v === "string" ? v.split("\n").length : 0

/**
 * Textarea — standard-token multiline field.
 *
 * Auto-grow is line-driven rather than DOM-measured, so web, native and desktop
 * grow identically: the row count follows the value and gui's
 * `textAreaSizeVariant` turns rows into height.
 * `rows` is the floor, not a fixed size.
 */
/**
 * Typed from the gui component it renders, exactly as `Input` is — the field
 * takes `onChangeText`, not a DOM `change` event, and the DOM-only spelling was
 * a type that never matched the runtime.
 */
export type TextareaProps = Omit<React.ComponentProps<typeof TextArea>, "children"> &
  Pick<React.ComponentProps<"textarea">, "onKeyDown" | "rows">

const Textarea = /* @__PURE__ */ React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ rows, value, defaultValue, ...props }, ref) {
  const [typed, setTyped] = React.useState(() => rowsOf(defaultValue))
  const uncontrolled = value === undefined
  const invalid = props["aria-invalid"]
  return (
    <TextArea
      ref={ref as never}
      data-slot="textarea"
      rows={Math.max(rows ?? MIN_ROWS, uncontrolled ? typed : rowsOf(value))}
      value={value as string | undefined}
      defaultValue={defaultValue as string | undefined}
      onChangeText={uncontrolled ? (t) => setTyped(rowsOf(t)) : undefined}
      width="100%"
      minH={64}
      rounded="$4"
      bg="transparent"
      borderWidth={1}
      borderColor={invalid && invalid !== "false" ? "$red7" : "$borderColor"}
      {...FOCUS}
      placeholderTextColor="$color10"
      fontSize="$3"
      opacity={props.disabled ? 0.5 : 1}
      {...(props as Record<string, unknown>)}
    />
  )
  },
)

export { Textarea }
