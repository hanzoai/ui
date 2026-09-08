'use client'

/**
 * Terminal — an emulated shell: a title bar, a scrolling command history, and
 * one input line. Enter runs a line through `onCommand` (after the built-ins
 * `clear`, `help`, `date`, `echo …`); arrow keys walk the command history; Tab
 * completes from `autoCompleteCommands`; hovering a past command reveals a
 * button that copies it. Four literal palettes (`dark`, `light`, `matrix`,
 * `dracula`) paint the surface — a terminal's colours are the emulator's own,
 * not the host app's theme — and a small set of syntax rules colour strings,
 * keywords, numbers and flags in every line.
 */
import { Input as GuiInput, SizableText, XStack, YStack, type YStackProps } from '@hanzo/gui'
import { Check, Copy } from '@hanzogui/lucide-icons-2'
import * as React from 'react'
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
}

const PALETTE: Record<TerminalTheme, Palette> = {
  dark: {
    bg: '#111827',
    fg: '#f3f4f6',
    prompt: '#4ade80',
    input: '#ffffff',
    output: '#d1d5db',
    error: '#f87171',
    success: '#4ade80',
    info: '#60a5fa',
    border: '#1f2937',
  },
  light: {
    bg: '#ffffff',
    fg: '#111827',
    prompt: '#2563eb',
    input: '#111827',
    output: '#374151',
    error: '#dc2626',
    success: '#16a34a',
    info: '#2563eb',
    border: '#e5e7eb',
  },
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
}

/** One colour rule per syntax class, matched left to right, first pattern wins. */
const SYNTAX: { regex: RegExp; color: string }[] = [
  { regex: /"[^"]*"|'[^']*'/, color: '#facc15' },
  { regex: /\b(?:true|false|null|undefined)\b/, color: '#fb923c' },
  { regex: /\b\d+\b/, color: '#c084fc' },
  { regex: /\b(?:function|const|let|var|if|else|for|while|return)\b/, color: '#f472b6' },
  { regex: /--?\w+/, color: '#22d3ee' },
]

const COMBINED = /* @__PURE__ */ new RegExp(SYNTAX.map((s) => `(${s.regex.source})`).join('|'), 'g')

/** Colours a line's strings, keywords, numbers and flags; everything else passes through. */
const highlight = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of text.matchAll(COMBINED)) {
    const start = match.index ?? 0
    if (start > last) parts.push(text.slice(last, start))
    const group = match.slice(1).findIndex((g) => g !== undefined)
    parts.push(
      <span key={key++} style={{ color: SYNTAX[group]?.color }}>
        {match[0]}
      </span>,
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
  theme = 'dark',
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

  const scroller = React.useRef<HTMLDivElement | null>(null)
  const field = React.useRef<HTMLInputElement | null>(null)
  const palette = PALETTE[theme]

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
            <SizableText style={{ color: palette.output }}>Available commands:</SizableText>
            <YStack pl="$4" gap="$1">
              <SizableText style={{ color: palette.output }}>• clear - Clear the terminal</SizableText>
              <SizableText style={{ color: palette.output }}>• help - Show this help message</SizableText>
              <SizableText style={{ color: palette.output }}>• date - Show current date and time</SizableText>
              <SizableText style={{ color: palette.output }}>• echo [text] - Print text to terminal</SizableText>
              {autoCompleteCommands.map((cmd) => (
                <SizableText key={cmd} style={{ color: palette.output }}>
                  • {cmd}
                </SizableText>
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
          line.output = `Error: ${error instanceof Error ? error.message : String(error)}`
          line.type = 'error'
        }
      } else {
        line.output = `Command not found: ${text}`
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
    [onCommand, enableHistory, maxHistorySize, autoCompleteCommands, palette.output],
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
      data-theme={theme}
      rounded="$3"
      borderWidth={1}
      p="$4"
      overflow="scroll"
      style={{ backgroundColor: palette.bg, borderColor: palette.border }}
      onClick={() => field.current?.focus()}
      onPaste={onPaste}
      {...props}
    >
      <XStack {...slot('terminal-header')} items="center" gap="$2" mb="$4">
        <YStack width={12} height={12} rounded={999} style={{ backgroundColor: '#ef4444' }} />
        <YStack width={12} height={12} rounded={999} style={{ backgroundColor: '#eab308' }} />
        <YStack width={12} height={12} rounded={999} style={{ backgroundColor: '#22c55e' }} />
        <SizableText size="$1" opacity={0.5} ml="$2" style={{ color: palette.fg }}>
          terminal
        </SizableText>
      </XStack>

      <YStack {...slot('terminal-history')} gap="$2">
        {lines.map((line) => (
          <YStack key={line.id} {...slot('terminal-command')}>
            <XStack items="flex-start" gap="$2">
              <SizableText style={{ color: palette.prompt }}>{prompt}</SizableText>
              <SizableText flex={1} style={{ color: palette.input }}>
                {highlight(line.input)}
              </SizableText>
              <XStack
                {...slot('terminal-copy')}
                cursor="pointer"
                opacity={0.5}
                hoverStyle={{ opacity: 1 }}
                aria-label="Copy command"
                onPress={() => copy(line.input)}
              >
                {copied === line.input ? <Check size={12} /> : <Copy size={12} />}
              </XStack>
            </XStack>
            {line.output !== '' && line.output != null && (
              <YStack pl="$4" mt="$1">
                {typeof line.output === 'string' ? (
                  <SizableText style={{ color: outputColor(line.type, palette) }}>
                    {highlight(line.output)}
                  </SizableText>
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
          <SizableText style={{ color: palette.prompt }}>{prompt}</SizableText>
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
            aria-label="Terminal input"
            style={{ color: palette.input, background: 'transparent', border: 'none', outline: 'none' }}
          />
        </XStack>

        {suggestions.length > 0 && (
          <YStack
            {...slot('terminal-suggestions')}
            position="absolute"
            l={0}
            t="100%"
            mt="$1"
            rounded="$2"
            borderWidth={1}
            p="$1"
            z={10}
            style={{ backgroundColor: palette.bg, borderColor: palette.border }}
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
                style={{ backgroundColor: index === suggestionIndex ? palette.border : 'transparent' }}
                onPress={() => {
                  setValue(suggestion)
                  setSuggestions([])
                  field.current?.focus()
                }}
              >
                <SizableText style={{ color: palette.fg }}>{suggestion}</SizableText>
              </YStack>
            ))}
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
