'use client'

/**
 * CodeBlock — a bordered panel that shows source code line by line: a header
 * naming the file and its language with a copy-to-clipboard button, a gutter
 * of line numbers, and a colored band on any line a caller highlights or marks
 * as added or removed in a diff.
 *
 * A line is plain monospace text, not colorized tokens: the workspace ships no
 * highlighter. `theme` names a fixed syntax palette — a chosen surface,
 * independent of the page's own light or dark theme — and `size` picks the
 * type scale. A line is never wrapped, so the body scrolls on both axes once it
 * outgrows `maxHeight` or the panel's width.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import { Check, Copy, FileText } from '@hanzogui/lucide-icons-2'
import { useCallback, useState, type ComponentProps } from 'react'
import { Badge } from './badge'
import { Button } from './button'
import { slot } from './slot'

export type CodeBlockTheme =
  | 'dark'
  | 'light'
  | 'github'
  | 'github-dark'
  | 'vs-dark'
  | 'monokai'
  | 'dracula'
  | 'nord'

export type CodeBlockSize = 'sm' | 'default' | 'lg'

export interface CodeBlockDiff {
  added?: number[]
  removed?: number[]
}

export interface CodeBlockProps extends Omit<ComponentProps<'div'>, 'children'> {
  code: string
  language?: string
  filename?: string
  theme?: CodeBlockTheme | null
  size?: CodeBlockSize | null
  showLineNumbers?: boolean
  highlightLines?: number[]
  showCopyButton?: boolean
  /** The body's ceiling, in px or any CSS length; past it the body scrolls. */
  maxHeight?: number | string
  diff?: CodeBlockDiff
}

/**
 * One fixed color quartet per theme. `as const satisfies` keeps each hex a
 * literal type rather than widening it to `string` — gui's style props are
 * typed against a hex-literal pattern, not against `string` itself, so a
 * literal reads straight into `bg`/`borderColor`/`color` with no cast.
 */
const PALETTE = {
  dark: { bg: '#020617', border: '#1e293b', fg: '#e2e8f0', muted: '#94a3b8' },
  light: { bg: '#f8fafc', border: '#e2e8f0', fg: '#0f172a', muted: '#64748b' },
  github: { bg: '#ffffff', border: '#e2e8f0', fg: '#24292e', muted: '#6e7781' },
  'github-dark': { bg: '#0d1117', border: '#30363d', fg: '#c9d1d9', muted: '#8b949e' },
  'vs-dark': { bg: '#1e1e1e', border: '#333333', fg: '#d4d4d4', muted: '#808080' },
  monokai: { bg: '#272822', border: '#49483e', fg: '#f8f8f2', muted: '#75715e' },
  dracula: { bg: '#282a36', border: '#44475a', fg: '#f8f8f2', muted: '#6272a4' },
  nord: { bg: '#2e3440', border: '#4c566a', fg: '#d8dee9', muted: '#81a1c1' },
} as const satisfies Record<CodeBlockTheme, { bg: string; border: string; fg: string; muted: string }>

const FONT_SIZE: Record<CodeBlockSize, number> = { sm: 12, default: 14, lg: 16 }

type Marker = 'highlight' | 'added' | 'removed'

/** The band color per marked line, and the sign a diff line carries in its gutter. */
const MARK = {
  highlight: { color: '#3b82f6', sign: undefined },
  added: { color: '#22c55e', sign: '+' },
  removed: { color: '#ef4444', sign: '-' },
} as const satisfies Record<Marker, { color: string; sign?: string }>

/** The color at 10% — its hex with an alpha byte, kept as a literal template type. */
const band = <Hex extends string>(hex: Hex) => `${hex}1a` as const

const Frame = styled(YStack, {
  name: 'CodeBlock',
  position: 'relative',
  width: '100%',
  rounded: '$3',
  borderWidth: 1,
  overflow: 'hidden',
})

const Header = styled(XStack, {
  name: 'CodeBlockHeader',
  items: 'center',
  justify: 'space-between',
  gap: '$2',
  px: '$4',
  py: '$2',
  borderBottomWidth: 1,
})

const Line = styled(XStack, {
  name: 'CodeBlockLine',
  items: 'center',
  minH: 24,
  px: '$4',
  py: '$0.5',
  gap: '$2',
  borderLeftWidth: 2,
  borderLeftColor: 'transparent',

  variants: {
    marker: {
      highlight: { bg: band(MARK.highlight.color), borderLeftColor: MARK.highlight.color },
      added: { bg: band(MARK.added.color), borderLeftColor: MARK.added.color },
      removed: { bg: band(MARK.removed.color), borderLeftColor: MARK.removed.color },
    },
  } as const,
})

const Mono = styled(SizableText, {
  name: 'CodeBlockText',
  fontFamily: '$mono',
  whiteSpace: 'pre',
})

/** `code` as numbered rows, each with the marker it carries: a diff side first, then a highlight. */
const rows = (code: string, highlightLines: number[], diff?: CodeBlockDiff) =>
  code.split('\n').map((text, i) => {
    const n = i + 1
    const marker: Marker | undefined = diff?.added?.includes(n)
      ? 'added'
      : diff?.removed?.includes(n)
        ? 'removed'
        : highlightLines.includes(n)
          ? 'highlight'
          : undefined
    return { n, text, marker }
  })

export function CodeBlock({
  code,
  language = 'text',
  filename,
  theme,
  size,
  showLineNumbers = true,
  highlightLines = [],
  showCopyButton = true,
  maxHeight = 400,
  diff,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const palette = PALETTE[theme ?? 'dark']
  const fontSize = FONT_SIZE[size ?? 'default']
  const lineHeight = fontSize * 1.5
  const label = copied ? 'Copied' : 'Copy code'

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard permission or no clipboard API — nothing else to do.
    }
  }, [code])

  return (
    <Frame
      {...slot('code-block')}
      style={{ backgroundColor: palette.bg, borderColor: palette.border }}
      {...(props as ComponentProps<typeof Frame>)}
    >
      {(filename || language || showCopyButton) && (
        <Header {...slot('code-block-header')} style={{ borderBottomColor: palette.border }}>
          <XStack items="center" gap="$2">
            {filename && (
              <XStack items="center" gap="$1.5">
                <FileText size={14} color={palette.muted} />
                <SizableText size="$2" fontWeight="500" style={{ color: palette.fg }}>
                  {filename}
                </SizableText>
              </XStack>
            )}
            {language && (
              <Badge {...slot('code-block-language')} variant="secondary">
                {language}
              </Badge>
            )}
          </XStack>
          {showCopyButton && (
            <Button variant="ghost" size="icon-sm" onClick={copy} aria-label={label} title={label}>
              {copied ? (
                <Check size={14} color={MARK.added.color} />
              ) : (
                <Copy size={14} color={palette.muted} />
              )}
            </Button>
          )}
        </Header>
      )}
      <YStack style={{ maxHeight, overflow: 'auto' }}>
        {/* Sized to the widest line, never narrower than the panel, so a band spans every line in full. */}
        <YStack py="$2" minW="100%" self="flex-start">
          {rows(code, highlightLines, diff).map(({ n, text, marker }) => {
            const mark = marker && MARK[marker]
            return (
              <Line
                key={n}
                marker={marker}
                data-slot="code-block-line"
                data-line={n}
              >
                {showLineNumbers && (
                  <Mono
                    width={32}
                    text="right"
                    select="none"
                    fontSize={FONT_SIZE.sm}
                    lineHeight={lineHeight}
                    style={{ color: palette.muted }}
                  >
                    {n}
                  </Mono>
                )}
                {mark?.sign && (
                  <Mono
                    select="none"
                    fontSize={FONT_SIZE.sm}
                    lineHeight={lineHeight}
                    style={{ color: mark.color }}
                  >
                    {mark.sign}
                  </Mono>
                )}
                <Mono fontSize={fontSize} lineHeight={lineHeight} style={{ color: palette.fg }}>
                  {text || ' '}
                </Mono>
              </Line>
            )
          })}
        </YStack>
      </YStack>
    </Frame>
  )
}
