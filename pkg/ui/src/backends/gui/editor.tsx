'use client'

/**
 * Editor — a minimal rich-text field: a toolbar of formatting buttons above a
 * `contentEditable` surface.
 *
 * Bold, italic and the two list commands run through the browser's own
 * `document.execCommand`, the one API that turns a toolbar click into a real
 * selection edit inside a `contentEditable` region — there is no gui primitive
 * for rich-text editing, so this wraps that platform primitive in a gui frame
 * the way `CodeEditor` wraps a plain field. The surface is HTML: `value` and
 * `onChange` carry the region's `innerHTML`, matching what the toolbar
 * commands actually produce.
 */
import { XStack, YStack, type YStackProps } from '@hanzo/gui'
import { Bold, Italic, List, ListOrdered } from '@hanzogui/lucide-icons-2'
import * as React from 'react'

import { Button } from './button'
import { slot } from './slot'

export type EditorCommand = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList'

export interface EditorProps extends Omit<YStackProps, 'children' | 'onChange'> {
  /** The region's HTML. Omit it and the region keeps its own content. */
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function Editor({ value, onChange, placeholder = 'Start typing...', ...props }: EditorProps) {
  const field = React.useRef<HTMLDivElement | null>(null)
  const shown = React.useRef(value)

  const run = (command: EditorCommand) => {
    document.execCommand(command, false)
    field.current?.focus()
  }

  const input = () => {
    if (field.current) onChange?.(field.current.innerHTML)
  }

  // A controlled `value` is only ever WRITTEN into the region when it changed
  // out from under the caller — writing it on every render would reset the
  // caret to the start on each keystroke, because `innerHTML` replaces the
  // whole subtree rather than patching it.
  React.useEffect(() => {
    if (field.current && value !== undefined && value !== shown.current) {
      field.current.innerHTML = value
    }
    shown.current = value
  }, [value])

  return (
    <YStack {...slot('editor')} gap="$2" {...props}>
      <XStack
        {...slot('editor-toolbar')}
        items="center"
        gap="$1"
        borderBottomWidth={1}
        borderColor="$borderColor"
        pb="$2"
      >
        <Button {...slot('editor-bold')} variant="ghost" size="sm" type="button" onClick={() => run('bold')}>
          <Bold size={16} />
        </Button>
        <Button {...slot('editor-italic')} variant="ghost" size="sm" type="button" onClick={() => run('italic')}>
          <Italic size={16} />
        </Button>
        <Button
          {...slot('editor-bullet-list')}
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => run('insertUnorderedList')}
        >
          <List size={16} />
        </Button>
        <Button
          {...slot('editor-ordered-list')}
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => run('insertOrderedList')}
        >
          <ListOrdered size={16} />
        </Button>
      </XStack>
      <div
        ref={field}
        {...slot('editor-content')}
        contentEditable
        onInput={input}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={value === undefined ? undefined : { __html: value }}
        style={{
          minHeight: 200,
          borderRadius: 8,
          border: '1px solid var(--borderColor)',
          padding: 16,
          outline: 'none',
        }}
      />
    </YStack>
  )
}
