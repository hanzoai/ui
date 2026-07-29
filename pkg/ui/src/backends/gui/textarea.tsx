'use client'

import * as React from 'react'
import { TextArea } from '@hanzo/gui'

/** Floor for the grown row count — shadcn's `min-h-16`, gui's default `rows: 3`. */
const MIN_ROWS = 3

const rowsOf = (v: unknown) => (typeof v === 'string' ? v.split('\n').length : 0)

/**
 * Textarea — standard-token multiline field.
 *
 * Auto-grow (shadcn's `field-sizing-content`) is line-driven rather than
 * DOM-measured, so web, native and desktop grow identically: the row count
 * follows the value and gui's `textAreaSizeVariant` turns rows into height.
 * `rows` is the floor, not a fixed size.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ rows, value, defaultValue, ...props }, ref) => {
    const [typed, setTyped] = React.useState(() => rowsOf(defaultValue))
    const uncontrolled = value === undefined
    const invalid = props['aria-invalid']
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
        borderColor={invalid && invalid !== 'false' ? '$red7' : '$borderColor'}
        placeholderTextColor="$color10"
        fontSize="$3"
        opacity={props.disabled ? 0.5 : 1}
        {...(props as Record<string, unknown>)}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
