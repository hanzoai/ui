'use client'

/**
 * Editor — a rich-text surface: a toolbar of bold/italic/bulleted-list/numbered-list
 * toggles above a contentEditable region, reporting its HTML back on every edit.
 *
 * Formatting a live selection is a browser primitive with no cross-platform
 * equivalent in gui, so this wraps the two platform primitives directly —
 * `contentEditable` for the surface, `document.execCommand` for the commands —
 * inside a gui frame for layout and theming. It is web-only for that reason;
 * native has no selection to format.
 */
import { XStack, YStack, type YStackProps } from '@hanzo/gui'
import { Bold, Italic, List, ListOrdered } from '@hanzogui/lucide-icons-2'
import * as React from 'react'

import { Button } from './button'
import { slot } from './slot'

/** The four formatting commands the toolbar issues via `document.execCommand`. */
export type EditorCommand = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList'

export interface EditorProps extends Omit<YStackProps, 'children' | 'onChange'> {
  /** A controlled value; omit it and edit freely to let the surface own its HTML. */
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

export function Editor({ value, onChange, placeholder = 'Start typing...', readOnly = false, ...props }: EditorProps) {
  const surface = React.useRef<HTMLDivElement>(null)
  const [empty, setEmpty] = React.useState(!value)

  // A controlled value is written into the surface only when it changes out
  // from under the caller (e.g. a reset button) — writing it on every render
  // would fight the surface's own DOM as the user types and jump the caret.
  React.useEffect(() => {
    const el = surface.current
    if (el && value !== undefined && value !== el.innerHTML) el.innerHTML = value
  }, [value])

  const report = React.useCallback(() => {
    const el = surface.current
    if (!el) return
    setEmpty(el.textContent === '')
    onChange?.(el.innerHTML)
  }, [onChange])

  const command = (name: EditorCommand) => () => {
    document.execCommand(name)
    surface.current?.focus()
    report()
  }

  return (
    <YStack {...slot('editor')} gap="$2" {...props}>
      <XStack {...slot('editor-toolbar')} gap="$1" borderBottomWidth={1} borderColor="$borderColor" pb="$2">
        <Button {...slot('editor-bold')} variant="ghost" size="icon-sm" type="button" onClick={command('bold')} aria-label="Bold">
          <Bold size={16} />
        </Button>
        <Button {...slot('editor-italic')} variant="ghost" size="icon-sm" type="button" onClick={command('italic')} aria-label="Italic">
          <Italic size={16} />
        </Button>
        <Button
          {...slot('editor-bullet-list')}
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={command('insertUnorderedList')}
          aria-label="Bulleted list"
        >
          <List size={16} />
        </Button>
        <Button
          {...slot('editor-ordered-list')}
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={command('insertOrderedList')}
          aria-label="Numbered list"
        >
          <ListOrdered size={16} />
        </Button>
      </XStack>
      <YStack
        {...slot('editor-surface')}
        ref={surface as never}
        // @ts-expect-error — contentEditable is a DOM attribute gui does not type; it forwards unknown props on web and drops them on native
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        data-empty={empty || undefined}
        minH={200}
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$3"
        p="$4"
        onInput={report}
        dangerouslySetInnerHTML={value === undefined ? { __html: '' } : undefined}
        style={{ outline: 'none' }}
      />
    </YStack>
  )
}
