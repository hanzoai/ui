'use client'

/**
 * MinimalTiptap — a multiline text field for prose content.
 *
 * The field composes the existing `Textarea`, which already carries the
 * growing height, the token border and radius, and the invalid-state edge —
 * a second field re-declaring that box would be the same control drifting in
 * two files. What this layer adds is the API a prose field is written
 * against: a string `value` and an `onChange(value)` callback, rather than
 * gui's own `onChangeText`, and a 200px floor so a block of prose opens tall
 * rather than at the three-row default a short caption uses.
 */
import * as React from 'react'
import { Textarea } from './textarea'

export type MinimalTiptapProps = Omit<
  React.ComponentProps<typeof Textarea>,
  'onChange' | 'onChangeText' | 'value'
> & {
  value?: string
  onChange?: (value: string) => void
}

const MIN_HEIGHT = 200

const MinimalTiptap = /* @__PURE__ */ React.forwardRef<HTMLTextAreaElement, MinimalTiptapProps>(
  function MinimalTiptap({ value, onChange, minH, ...props }, ref) {
    return (
      <Textarea
        ref={ref}
        data-slot="minimal-tiptap"
        value={value}
        onChangeText={onChange}
        minH={minH ?? MIN_HEIGHT}
        {...props}
      />
    )
  },
)

export { MinimalTiptap }
