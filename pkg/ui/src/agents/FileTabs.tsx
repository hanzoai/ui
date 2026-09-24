'use client'

/**
 * FileTabs — the open files, one tab each, over the editor.
 *
 * Ported from build-v2 `components/editor/multi-tab-editor.tsx` (MIT, derived
 * from OSW Studio and DeepSite — see NOTICE). v2 carried CodeMirror, its own
 * undo stacks and a save pipeline; this is the tab strip and the body, over the
 * package's own `CodeEditor`, with the files and every change handed back to
 * the host. What saving MEANS — a commit, a run, nothing — is the host's.
 *
 * Distinct from `CodeTabs`, which is a snippet shown in several languages. A
 * snippet has variants; a workspace has files.
 *
 * File contents are TEXT, shown in a plain text field. Nothing here renders a
 * file's markup, runs it, or reads it as anything but characters.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import { type ComponentProps, type KeyboardEvent, type ReactNode, useRef } from 'react'

import { CodeEditor } from '../backends/gui/code-editor'
import { slot } from '../backends/gui/slot'
import { glyph } from './FileTree'
import { base, language } from './tree'

type Col = Omit<ComponentProps<typeof YStack>, 'children' | 'onChange'>

/** One open file. */
export interface OpenFile {
  path: string
  /** The text. Absent while it is being read. */
  content?: string
  /** Why it cannot be shown — too large, binary, unreadable. */
  error?: string
  /** Changed since it was opened. */
  dirty?: boolean
  /** This file may not be edited, whatever the tabs allow. */
  readOnly?: boolean
}

export interface FileTabsProps extends Col {
  files: readonly OpenFile[]
  /** The path of the shown file. */
  value: string | null
  onSelect: (path: string) => void
  /** Omit to make tabs unclosable. */
  onClose?: (path: string) => void
  /** Omit to make every file read-only. */
  onChange?: (path: string, content: string) => void
  /** Drawn when nothing is open. */
  empty?: ReactNode
}

export function FileTabs({ files, value, onSelect, onClose, onChange, empty, ...rest }: FileTabsProps) {
  const tabs = useRef<(HTMLElement | null)[]>([])
  const shown = files.find((f) => f.path === value) ?? files[0]

  if (!shown) {
    return (
      <YStack {...slot('file-tabs')} flex={1} minH={0} items="center" justify="center" p="$4" {...rest}>
        <SizableText size="$2" color="$soft" text="center">
          {empty ?? 'Open a file to see it here.'}
        </SizableText>
      </YStack>
    )
  }

  const move = (e: KeyboardEvent, index: number) => {
    const last = files.length - 1
    const to =
      e.key === 'ArrowRight' ? Math.min(index + 1, last)
      : e.key === 'ArrowLeft' ? Math.max(index - 1, 0)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1
    if (to >= 0) {
      e.preventDefault()
      onSelect(files[to]!.path)
      tabs.current[to]?.focus()
      return
    }
    if (e.key === 'Delete' && onClose) {
      e.preventDefault()
      onClose(files[index]!.path)
    }
  }

  const editable = Boolean(onChange) && !shown.readOnly
  return (
    <YStack {...slot('file-tabs')} flex={1} minH={0} minW={0} {...rest}>
      <XStack
        role="tablist"
        aria-label="Open files"
        items="stretch"
        minH={36}
        shrink={0}
        overflow="scroll"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        {files.map((file, index) => {
          const on = file.path === shown.path
          const name = base(file.path)
          return (
            <XStack
              key={file.path}
              ref={((el: HTMLElement | null) => {
                tabs.current[index] = el
              }) as never}
              render="button"
              {...({ type: 'button', title: file.path, 'aria-keyshortcuts': onClose ? 'Delete' : undefined } as object)}
              role="tab"
              aria-selected={on}
              aria-label={file.dirty ? `${file.path}, unsaved` : file.path}
              tabIndex={on ? 0 : -1}
              onPress={() => onSelect(file.path)}
              onKeyDown={((e: KeyboardEvent) => move(e, index)) as never}
              items="center"
              gap="$1.5"
              pl="$3"
              pr={onClose ? '$1.5' : '$3'}
              shrink={0}
              cursor="pointer"
              borderWidth={0}
              borderRightWidth={1}
              borderColor="$borderColor"
              borderBottomWidth={2}
              borderBottomColor={on ? '$ink' : 'transparent'}
              bg={on ? '$hover' : 'transparent'}
              hoverStyle={{ bg: '$hover' }}
              focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$rim', outlineOffset: -2 }}
            >
              {glyph(name, 13)}
              <SizableText size="$2" color={on ? '$ink' : '$quiet'} numberOfLines={1} maxW={180}>
                {name}
              </SizableText>
              {file.dirty ? (
                <YStack width={6} height={6} rounded={3} bg="$ink" aria-hidden {...slot('file-tabs-dirty')} />
              ) : null}
              {onClose ? (
                // A pointer's way to close. Not a second focus stop inside a
                // tab (a control in a control): the keyboard's way is Delete on
                // the tab itself, which `aria-keyshortcuts` announces.
                <XStack
                  {...slot('file-tabs-close')}
                  aria-hidden
                  width={20}
                  height={20}
                  rounded="$2"
                  items="center"
                  justify="center"
                  opacity={on ? 0.8 : 0.5}
                  hoverStyle={{ bg: '$raised', opacity: 1 }}
                  onClick={((e: { stopPropagation?: () => void }) => {
                    e.stopPropagation?.()
                    onClose(file.path)
                  }) as never}
                >
                  <X size={12} />
                </XStack>
              ) : null}
            </XStack>
          )
        })}
      </XStack>

      <YStack role="tabpanel" aria-label={shown.path} flex={1} minH={0}>
        {shown.error ? (
          <YStack flex={1} items="center" justify="center" p="$4">
            <SizableText size="$2" color="$soft" text="center">
              {shown.error}
            </SizableText>
          </YStack>
        ) : shown.content === undefined ? (
          <YStack flex={1} items="center" justify="center" p="$4">
            <SizableText size="$2" color="$soft">
              Reading {base(shown.path)}…
            </SizableText>
          </YStack>
        ) : (
          <CodeEditor
            key={shown.path}
            value={shown.content}
            language={language(shown.path)}
            readOnly={!editable}
            label={shown.path}
            onChange={editable ? (text) => onChange?.(shown.path, text) : undefined}
            showLanguageSelector={false}
            showCopyButton={false}
            height="100%"
            fontSize={13}
            flex={1}
            rounded={0}
            borderWidth={0}
          />
        )}
      </YStack>
    </YStack>
  )
}
