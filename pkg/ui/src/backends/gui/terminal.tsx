'use client'

/**
 * Terminal — an emulated shell: a title bar, a scrolling command history, and
 * one input line. Enter runs a line through `onCommand` (after the built-ins
 * `clear`, `help`, `date`, `echo …`); arrow keys walk the command history; Tab
 * completes from `autoCompleteCommands`; hovering a past command reveals a
 * button that copies it.
 *
 * With no `theme` the surface is the code theme (`code-theme.ts`), monochrome,
 * and follows the page; `dark` or `light` pins it to that scheme, and `matrix`
 * or `dracula` is that fixed palette. A line is told by brightness and weight,
 * never by hue: the prompt and an info line dim, a command bright, output in the
 * ink, an error bright and bold. A small set of rules brightens strings, numbers
 * and flags in every line and sets keywords and literals bold. Every line is set
 * in the mono face, left to right under any `dir`.
 */
import { Input as GuiInput, SizableText, Text, XStack, YStack, styled, type YStackProps } from '@hanzo/gui'
import { Check, Copy } from '@hanzogui/lucide-icons-2'
import * as React from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { face, type CodeToken } from '../../code-theme'
import { mono } from './code-surface'
import { ltr } from './dir'
import { slot } from './slot'

export type TerminalTheme = 'dark' | 'light' | 'matrix' | 'dracula'
export type TerminalLineType = 'command' | 'error' | 'success' | 'info'

export interface TerminalCommand {
  id: string
  input: string
  output: string | React.ReactNode
  timestamp: Date
  type?: TerminalLineType
}

export interface TerminalProps extends Omit<YStackProps, 'children' | 'theme'> {
  /** Shown before every command line and the input line. */
  prompt?: string
  /** Lines shown before anything is typed. */
  initialCommands?: TerminalCommand[]
  /** Handles anything the built-ins (`clear`/`help`/`date`/`echo`) do not. */
  onCommand?: (command: string) => Promise<string | React.ReactNode> | string | React.ReactNode
  theme?: TerminalTheme
  /** Arrow-key history navigation. */
  enableHistory?: boolean
  /** Tab-completion against `autoCompleteCommands`. */
  enableAutoComplete?: boolean
  autoCompleteCommands?: string[]
  maxHistorySize?: number
}

const DEFAULT_COMMANDS = ['help', 'clear', 'exit', 'ls', 'cd', 'pwd', 'echo', 'date', 'whoami']

type Palette = {
  bg: string
  fg: string
  prompt: string
  input: string
  output: string
  error: string
  success: string
  info: string
  border: string
  line: string
  /** Each kind of token's ink; a named palette has none and draws them in `input`. */
  tokens?: Record<CodeToken, string>
}

/** The named palettes, opt-in by name and fixed whatever the page's theme. */
const PALETTE = {
  matrix: {
    bg: '#000000',
    fg: '#4ade80',
    prompt: '#22c55e',
    input: '#86efac',
    output: '#4ade80',
    error: '#ef4444',
    success: '#a3e635',
    info: '#22d3ee',
    border: '#14532d',
  },
  dracula: {
    bg: '#282a36',
    fg: '#f8f8f2',
    prompt: '#50fa7b',
    input: '#f8f8f2',
    output: '#6272a4',
    error: '#ff5555',
    success: '#50fa7b',
    info: '#8be9fd',
    border: '#44475a',
  },
} as const satisfies Record<Exclude<TerminalTheme, 'dark' | 'light'>, Omit<Palette, 'line' | 'tokens'>>

/**
 * The palette a `theme` names. With none, `dark` or `light` it is the code theme
 * (`code-surface.ts`): the prompt and an info line in the dim ink, a command and an
 * error in the bright one, output and a success in the ink.
 */
const paletteOf = (theme: TerminalTheme | undefined): Palette => {
  if (theme === 'matrix' || theme === 'dracula') return { ...PALETTE[theme], line: PALETTE[theme].border }
  const s = mono(theme)
  return {
    bg: s.bg,
    fg: s.fg,
    prompt: s.muted,
    input: s.strong,
    output: s.fg,
    error: s.strong,
    success: s.fg,
    info: s.muted,
    border: s.border,
    line: s.line,
    tokens: s.tokens,
  }
}

/**
 * One rule per kind of token, matched left to right, first pattern wins. A flag is
 * a literal a person typed, so it takes the bright ink as one does.
 */
const SYNTAX: { regex: RegExp; token?: CodeToken }[] = [
  { regex: /"[^"]*"|'[^']*'/, token: 'string' },
  { regex: /\b(?:true|false|null|undefined)\b/, token: 'boolean' },
  { regex: /\b\d+\b/, token: 'number' },
  { regex: /\b(?:function|const|let|var|if|else|for|while|return)\b/, token: 'keyword' },
  { regex: /--?\w+/ },
]

/** A token's ink: its own on the code theme, the input ink on a named palette or for a flag. */
const tint = (token: CodeToken | undefined, palette: Palette) => (token && palette.tokens?.[token]) || palette.input

/** The terminal's text: the mono face, every line. */
const Mono = styled(SizableText, { name: 'TerminalText', fontFamily: '$mono' })

const COMBINED = /* @__PURE__ */ new RegExp(SYNTAX.map((s) => `(${s.regex.source})`).join('|'), 'g')

/** Brightens a line's strings, numbers and flags and sets its keywords and literals bold; everything else passes through. */
const highlight = (text: string, palette: Palette): React.ReactNode => {
  const parts: React.ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of text.matchAll(COMBINED)) {
    const start = match.index ?? 0
    if (start > last) parts.push(text.slice(last, start))
    const { token } = SYNTAX[match.slice(1).findIndex((g) => g !== undefined)] ?? {}
    parts.push(
      <Text key={key++} color={tint(token, palette) as never} {...(token ? face[token] : null)}>
        {match[0]}
      </Text>,
    )
    last = start + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? <>{parts}</> : text
}

const outputColor = (type: TerminalLineType | undefined, palette: Palette) =>
  type === 'error' ? palette.error : type === 'success' ? palette.success : type === 'info' ? palette.info : palette.output

export function Terminal({
  prompt = '$',
  initialCommands = [],
  onCommand,
  theme,
  enableHistory = true,
  enableAutoComplete = true,
  autoCompleteCommands = DEFAULT_COMMANDS,
  maxHistorySize = 50,
  ...props
}: TerminalProps) {
  const [lines, setLines] = React.useState<TerminalCommand[]>(initialCommands)
  const [value, setValue] = React.useState('')
  const [historyIndex, setHistoryIndex] = React.useState(-1)
  const [history, setHistory] = React.useState<string[]>([])
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [suggestionIndex, setSuggestionIndex] = React.useState(0)
  const [copied, setCopied] = React.useState<string | null>(null)
  const { t } = useI18n()

  const scroller = React.useRef<HTMLDivElement | null>(null)
  const field = React.useRef<HTMLInputElement | null>(null)
  const palette = paletteOf(theme)

  React.useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  React.useEffect(() => {
    if (enableAutoComplete && value) {
      const matches = autoCompleteCommands.filter((cmd) => cmd.toLowerCase().startsWith(value.toLowerCase()))
      setSuggestions(matches)
      setSuggestionIndex(0)
    } else {
      setSuggestions([])
    }
  }, [value, enableAutoComplete, autoCompleteCommands])

  const run = React.useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text) return

      const line: TerminalCommand = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        input: raw,
        output: '',
        timestamp: new Date(),
        type: 'command',
      }

      if (text.toLowerCase() === 'clear') {
        setLines([])
        setValue('')
        return
      }
      if (text.toLowerCase() === 'help') {
        line.output = (
          <YStack gap="$1">
            <Mono color={palette.output as never}>{t('Available commands:')}</Mono>
            <YStack paddingInlineStart="$4" gap="$1">
              <Mono color={palette.output as never}>{t('• {command} - Clear the terminal', { command: 'clear' })}</Mono>
              <Mono color={palette.output as never}>{t('• {command} - Show this help message', { command: 'help' })}</Mono>
              <Mono color={palette.output as never}>{t('• {command} - Show current date and time', { command: 'date' })}</Mono>
              <Mono color={palette.output as never}>{t('• {command} - Print text to terminal', { command: 'echo [text]' })}</Mono>
              {autoCompleteCommands.map((cmd) => (
                <Mono key={cmd} color={palette.output as never}>
                  • {cmd}
                </Mono>
              ))}
            </YStack>
          </YStack>
        )
        line.type = 'info'
      } else if (text.toLowerCase() === 'date') {
        line.output = new Date().toString()
        line.type = 'success'
      } else if (text.toLowerCase().startsWith('echo ')) {
        line.output = text.slice(5)
        line.type = 'success'
      } else if (onCommand) {
        try {
          line.output = await onCommand(text)
          line.type = 'success'
        } catch (error) {
          line.output = t('Error: {message}', { message: error instanceof Error ? error.message : String(error) })
          line.type = 'error'
        }
      } else {
        line.output = t('Command not found: {command}', { command: text })
        line.type = 'error'
      }

      setLines((prev) => [...prev, line])
      if (enableHistory) {
        setHistory((prev) => [raw, ...prev.filter((cmd) => cmd !== raw)].slice(0, maxHistorySize))
      }
      setValue('')
      setHistoryIndex(-1)
      setSuggestions([])
    },
    [onCommand, enableHistory, maxHistorySize, autoCompleteCommands, palette.output, t],
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      run(value)
    } else if (e.key === 'ArrowUp' && enableHistory) {
      e.preventDefault()
      if (historyIndex < history.length - 1) {
        const next = historyIndex + 1
        setHistoryIndex(next)
        setValue(history[next])
      }
    } else if (e.key === 'ArrowDown' && enableHistory) {
      e.preventDefault()
      if (historyIndex > 0) {
        const next = historyIndex - 1
        setHistoryIndex(next)
        setValue(history[next])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setValue('')
      }
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault()
      const suggestion = suggestions[suggestionIndex]
      if (suggestion) {
        setValue(suggestion)
        setSuggestions([])
      }
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setSuggestionIndex(0)
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied((c) => (c === text ? null : c)), 2000)
    } catch {
      // No clipboard permission — nothing to copy with.
    }
  }

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setValue((prev) => prev + text)
      field.current?.focus()
    } catch {
      // No clipboard permission — the browser's own paste still lands in the field.
    }
  }

  return (
    <YStack
      ref={scroller as never}
      {...slot('terminal')}
      {...ltr}
      data-theme={theme}
      rounded="$3"
      borderWidth={1}
      p="$4"
      overflow="scroll"
      bg={palette.bg as never}
      borderColor={palette.border as never}
      onClick={() => field.current?.focus()}
      onPaste={onPaste}
      {...props}
    >
      <XStack {...slot('terminal-header')} items="center" gap="$2" mb="$4">
        {[0, 1, 2].map((i) => (
          <YStack key={i} width={12} height={12} rounded={999} bg={palette.line as never} />
        ))}
        <Mono size="$1" marginInlineStart="$2" color={palette.prompt as never}>
          {t('terminal')}
        </Mono>
      </XStack>

      <YStack {...slot('terminal-history')} gap="$2">
        {lines.map((line) => (
          <YStack key={line.id} {...slot('terminal-command')}>
            <XStack items="flex-start" gap="$2">
              <Mono color={palette.prompt as never}>{prompt}</Mono>
              <Mono flex={1} color={palette.input as never}>
                {highlight(line.input, palette)}
              </Mono>
              <XStack
                {...slot('terminal-copy')}
                cursor="pointer"
                opacity={0.7}
                hoverStyle={{ opacity: 1 }}
                aria-label={t('Copy command')}
                onPress={() => copy(line.input)}
              >
                {copied === line.input ? (
                  <Check size={12} color={palette.input as never} />
                ) : (
                  <Copy size={12} color={palette.prompt as never} />
                )}
              </XStack>
            </XStack>
            {line.output !== '' && line.output != null && (
              <YStack paddingInlineStart="$4" mt="$1">
                {typeof line.output === 'string' ? (
                  <Mono
                    color={outputColor(line.type, palette) as never}
                    {...(line.type === 'error' ? { fontWeight: '700' as const } : null)}
                  >
                    {highlight(line.output, palette)}
                  </Mono>
                ) : (
                  line.output
                )}
              </YStack>
            )}
          </YStack>
        ))}
      </YStack>

      <YStack {...slot('terminal-input-row')} position="relative" mt="$2">
        <XStack items="center" gap="$2">
          <Mono color={palette.prompt as never}>{prompt}</Mono>
          <GuiInput
            ref={field as never}
            {...slot('terminal-input')}
            unstyled
            flex={1}
            value={value}
            onChangeText={setValue}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label={t('Terminal input')}
            fontFamily="$mono"
            color={palette.input as never}
            style={{ background: 'transparent', border: 'none', outline: 'none' }}
          />
        </XStack>

        {suggestions.length > 0 && (
          <YStack
            {...slot('terminal-suggestions')}
            position="absolute"
            insetInlineStart={0}
            t="100%"
            mt="$1"
            rounded="$2"
            borderWidth={1}
            p="$1"
            z={10}
            bg={palette.bg as never}
            borderColor={palette.border as never}
          >
            {suggestions.map((suggestion, index) => (
              <YStack
                key={suggestion}
                {...slot('terminal-suggestion')}
                data-active={index === suggestionIndex}
                rounded="$1"
                px="$2"
                py="$1"
                cursor="pointer"
                bg={(index === suggestionIndex ? palette.line : 'transparent') as never}
                onPress={() => {
                  setValue(suggestion)
                  setSuggestions([])
                  field.current?.focus()
                }}
              >
                <Mono color={palette.fg as never}>{suggestion}</Mono>
              </YStack>
            ))}
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
