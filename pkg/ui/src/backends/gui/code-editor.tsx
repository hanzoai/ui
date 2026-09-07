'use client'

/**
 * CodeEditor — a bordered, monospace editing surface: a toolbar carrying a
 * language menu and a copy-to-clipboard button, above a plain-text field with
 * a gutter of line numbers that scrolls with it.
 *
 * The field is gui's `TextArea`, so what is edited is the text itself. Tab
 * inserts two spaces and Escape releases focus; `wordWrap` is the field's own
 * white-space; the gutter numbers lines of text, so a line that wraps keeps
 * one number; there is no syntax colouring, and `minimap` is accepted and
 * ignored because a plain field has no surface to draw one on.
 *
 * `theme` is the editor's own palette, independent of the surrounding gui
 * theme the way a syntax theme is: `'light'` and `'dark'` paint a fixed set of
 * literal colours, and `'auto'` (the default) takes the ambient `$background`,
 * `$color` and `$borderColor` tokens, so it follows the host page.
 */
import { SizableText, TextArea, XStack, YStack, type YStackProps } from '@hanzo/gui'
import { Check, Copy } from '@hanzogui/lucide-icons-2'
import * as React from 'react'

import { Button } from './button'
import { RISER } from './control'
import { Select, SelectContent, SelectItem, SelectTrigger } from './select'
import { slot } from './slot'
import { toast } from './toaster'

export type CodeEditorTheme = 'light' | 'dark' | 'auto'
export type CodeEditorWordWrap = 'on' | 'off' | 'wordWrapColumn' | 'bounded'

/** The languages the menu offers when a caller does not narrow the list. */
const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'cpp',
  'c',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'dart',
  'html',
  'css',
  'scss',
  'json',
  'xml',
  'yaml',
  'sql',
  'markdown',
  'shell',
  'plaintext',
] as const

const LABEL: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  cpp: 'C++',
  c: 'C',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  dart: 'Dart',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  sql: 'SQL',
  markdown: 'Markdown',
  shell: 'Shell',
  plaintext: 'Plain Text',
}

/** The two named palettes; `'auto'` paints none of this. */
const PALETTE: Record<'light' | 'dark', { bg: string; fg: string; border: string; head: string; gutter: string }> = {
  light: { bg: '#ffffff', fg: '#1f2328', border: '#d0d7de', head: '#f6f8fa', gutter: '#8c959f' },
  dark: { bg: '#1e1e1e', fg: '#d4d4d4', border: '#3c3c3c', head: '#252526', gutter: '#858585' },
}

/** What Tab inserts. */
const INDENT = '  '
/** Line height as a multiple of the font size. */
const LEADING = 1.5

export interface CodeEditorProps extends Omit<YStackProps, 'children' | 'height' | 'theme' | 'onChange'> {
  /** A controlled value; omit it and set `defaultValue` to let the field own its text. */
  value?: string
  defaultValue?: string
  language?: string
  /** The height of the field; the toolbar sits above it, unsized. */
  height?: string | number
  theme?: CodeEditorTheme
  onChange?: (value: string) => void
  /** Called once, after mount, with the field's `<textarea>`. */
  onMount?: (element: HTMLTextAreaElement) => void
  readOnly?: boolean
  lineNumbers?: boolean
  /** Accepted and ignored: a plain text field has no surface to draw a minimap on. */
  minimap?: boolean
  wordWrap?: CodeEditorWordWrap
  fontSize?: number
  showCopyButton?: boolean
  showLanguageSelector?: boolean
  availableLanguages?: readonly string[]
}

export function CodeEditor({
  value,
  defaultValue = '',
  language = 'javascript',
  height = '400px',
  theme = 'auto',
  onChange,
  onMount,
  readOnly = false,
  lineNumbers = true,
  minimap: _minimap,
  wordWrap = 'on',
  fontSize = 14,
  showCopyButton = true,
  showLanguageSelector = true,
  availableLanguages = LANGUAGES,
  ...props
}: CodeEditorProps) {
  const [typed, setTyped] = React.useState(defaultValue)
  const text = value ?? typed
  const [selected, setSelected] = React.useState(language)
  const [copied, setCopied] = React.useState(false)
  const [scrollTop, setScrollTop] = React.useState(0)
  const field = React.useRef<HTMLTextAreaElement | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => {
    if (field.current) onMount?.(field.current)
    return () => clearTimeout(timer.current)
  }, [])

  // Bound directly rather than through the gui field's `onScroll` prop: native
  // `scroll` does not bubble, and a listener attached this way fires however
  // the offset changed — a real drag or a test stating it outright.
  React.useEffect(() => {
    const el = field.current
    if (!el) return
    const onScroll = () => setScrollTop(el.scrollTop)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const change = React.useCallback(
    (next: string) => {
      setTyped(next)
      onChange?.(next)
    },
    [onChange],
  )

  const key = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    if (e.key === 'Escape') el.blur()
    if (e.key !== 'Tab' || e.shiftKey || readOnly) return
    e.preventDefault()
    el.setRangeText(INDENT, el.selectionStart ?? 0, el.selectionEnd ?? 0, 'end')
    change(el.value)
  }

  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
      toast.success('Code copied to clipboard')
    } catch {
      toast.error('Failed to copy code')
    }
  }, [text])

  const named = theme === 'auto' ? undefined : PALETTE[theme]
  const lineHeight = `${fontSize * LEADING}px`
  const wrap = wordWrap !== 'off'
  const gutter = Array.from({ length: text.split('\n').length }, (_, i) => i + 1).join('\n')

  return (
    <YStack
      {...slot('code-editor')}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
      overflow="hidden"
      bg="$background"
      style={named && { backgroundColor: named.bg, borderColor: named.border }}
      {...props}
    >
      {(showLanguageSelector || showCopyButton) && (
        <XStack
          {...slot('code-editor-toolbar')}
          items="center"
          justify={showLanguageSelector ? 'space-between' : 'flex-end'}
          borderBottomWidth={1}
          borderColor="$borderColor"
          bg="$panel"
          px="$3"
          py="$2"
          style={named && { backgroundColor: named.head, borderColor: named.border }}
        >
          {showLanguageSelector && (
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger
                {...slot('code-editor-language-trigger')}
                width="auto"
                minHeight={32}
                borderWidth={0}
                bg="transparent"
                gap="$1.5"
                px="$2"
              >
                <SizableText size="$1" fontFamily="$mono" style={named && { color: named.fg }}>
                  {LABEL[selected] ?? selected}
                </SizableText>
              </SelectTrigger>
              <SelectContent {...slot('code-editor-language-content')}>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LABEL[lang] ?? lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {showCopyButton && (
            <Button
              {...slot('code-editor-copy-button')}
              variant="ghost"
              size="sm"
              disabled={!text}
              onClick={copy}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          )}
        </XStack>
      )}
      <XStack {...slot('code-editor-body')} overflow="hidden" style={{ height }}>
        {lineNumbers && (
          <YStack
            {...slot('code-editor-gutter')}
            width={48}
            overflow="hidden"
            borderRightWidth={1}
            borderColor="$borderColor"
            bg="$panel"
            py={RISER}
            style={named && { backgroundColor: named.head, borderColor: named.border }}
          >
            <SizableText
              size="$1"
              fontFamily="$mono"
              color="$soft"
              px="$2"
              whiteSpace="pre"
              style={{
                fontSize,
                lineHeight,
                textAlign: 'right',
                transform: `translateY(${-scrollTop}px)`,
                ...(named && { color: named.gutter }),
              }}
            >
              {gutter}
            </SizableText>
          </YStack>
        )}
        <TextArea
          ref={field as never}
          {...slot('code-editor-textarea')}
          value={text}
          onChangeText={change}
          onKeyDown={key}
          readOnly={readOnly}
          unstyled
          flex={1}
          minH={0}
          borderWidth={0}
          rounded={0}
          px="$2"
          py={RISER}
          fontFamily="$mono"
          color="$color"
          bg="transparent"
          style={{
            fontSize,
            lineHeight,
            whiteSpace: wrap ? 'pre-wrap' : 'pre',
            overflowWrap: wrap ? 'break-word' : 'normal',
            overflow: 'auto',
            resize: 'none',
            height: '100%',
            ...(named && { color: named.fg }),
          }}
        />
      </XStack>
    </YStack>
  )
}
