'use client'

/**
 * Snippet — a piece of source code shown as text, in three shapes: a bordered
 * `default` panel with a header (filename, language badge, copy button), an
 * `inline` code span for a phrase inside a sentence, and a borderless
 * `minimal` block that keeps only a floating copy button. Any panel over
 * `collapsedHeight` can be made `expandable`, showing a fade and a
 * maximize/minimize control that toggles between `collapsedHeight` and
 * `maxHeight`.
 *
 * A line is plain monospace text, not colorized tokens — the workspace ships
 * no syntax highlighter, the same constraint `code-block.tsx` documents.
 * `theme` names a fixed palette for the code surface, independent of the
 * page's own light or dark theme; `size` picks the type scale.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import { Check, Copy, FileText, Maximize2, Minimize2 } from '@hanzogui/lucide-icons-2'
import { useCallback, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { Badge } from './badge'
import { Button } from './button'
import { slot } from './slot'

export type SnippetVariant = 'default' | 'inline' | 'minimal'

export type SnippetTheme = 'dark' | 'light' | 'github' | 'github-dark' | 'terminal' | 'retro'

export type SnippetSize = 'xs' | 'sm' | 'default' | 'lg'

/** One fixed color quartet per theme — see `code-block.tsx` for the same trade. */
const PALETTE = {
  dark: { bg: '#020617', border: '#1e293b', fg: '#e2e8f0', muted: '#94a3b8' },
  light: { bg: '#f8fafc', border: '#e2e8f0', fg: '#0f172a', muted: '#64748b' },
  github: { bg: '#ffffff', border: '#e2e8f0', fg: '#24292e', muted: '#6e7781' },
  'github-dark': { bg: '#0d1117', border: '#30363d', fg: '#c9d1d9', muted: '#8b949e' },
  terminal: { bg: '#000000', border: '#22c55e4d', fg: '#4ade80', muted: '#4ade8099' },
  retro: { bg: '#fffbeb', border: '#fde68a', fg: '#78350f', muted: '#92400e' },
} as const satisfies Record<SnippetTheme, { bg: string; border: string; fg: string; muted: string }>

const FONT_SIZE: Record<SnippetSize, number> = { xs: 11, sm: 12, default: 14, lg: 16 }

/** The literal hex union `PALETTE[...].muted` carries — see `code-block.tsx`'s `band()`. */
type Muted = (typeof PALETTE)[SnippetTheme]['muted']

export interface SnippetProps extends Omit<ComponentProps<'div'>, 'children'> {
  code: string
  language?: string
  filename?: string
  variant?: SnippetVariant | null
  theme?: SnippetTheme | null
  size?: SnippetSize | null
  showLineNumbers?: boolean
  highlightLines?: number[]
  showCopyButton?: boolean
  showLanguageBadge?: boolean
  showHeader?: boolean
  /** The expanded body's ceiling, in px or any CSS length. */
  maxHeight?: number | string
  expandable?: boolean
  /** The collapsed body's height while `expandable` and not yet expanded. */
  collapsedHeight?: number | string
  wrapLines?: boolean
  startLineNumber?: number
}

const Frame = styled(YStack, {
  name: 'Snippet',
  position: 'relative',
  width: '100%',

  variants: {
    variant: {
      default: { rounded: '$3', borderWidth: 1, overflow: 'hidden' },
      inline: {},
      minimal: { overflow: 'hidden' },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

const Header = styled(XStack, {
  name: 'SnippetHeader',
  items: 'center',
  justify: 'space-between',
  gap: '$2',
  px: '$4',
  py: '$2',
  borderBottomWidth: 1,
})

const Row = styled(XStack, {
  name: 'SnippetLine',
  items: 'center',
  minH: 24,
  px: '$4',
  py: '$0.5',
  gap: '$2',
  borderLeftWidth: 2,
  borderLeftColor: 'transparent',

  variants: {
    highlighted: {
      true: { bg: '#3b82f61a', borderLeftColor: '#3b82f6' },
    },
    wrap: {
      true: { flexWrap: 'wrap' },
    },
  } as const,
})

const Mono = styled(SizableText, {
  name: 'SnippetText',
  fontFamily: '$mono',

  variants: {
    wrap: {
      true: { whiteSpace: 'pre-wrap', style: { wordBreak: 'break-word' } },
      false: { whiteSpace: 'pre' },
    },
  } as const,

  defaultVariants: { wrap: false },
})

/** `code` split into numbered rows starting at `startLineNumber`. */
const rows = (code: string, start: number) =>
  code.split('\n').map((text, i) => ({ n: i + start, text }))

/** The copy button, shared by every variant that shows one. */
function CopyButton({
  copied,
  onPress,
  muted,
  floating,
}: {
  copied: boolean
  onPress: () => void
  muted: Muted
  floating?: boolean
}) {
  const label = copied ? 'Copied' : 'Copy code'
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onPress}
      aria-label={label}
      title={label}
      {...(floating ? { position: 'absolute' as const, t: '$2', r: '$2' } : null)}
    >
      {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color={muted} />}
    </Button>
  )
}

/**
 * A syntax-plain code panel: `variant="default"` shows a header and a gutter
 * of numbered lines, `variant="inline"` renders one line as an inline code
 * span, and `variant="minimal"` drops the border and header down to a floating
 * copy button. `expandable` clamps the body to `collapsedHeight` until its
 * maximize control is pressed.
 */
export function Snippet({
  code,
  language = 'text',
  filename,
  variant,
  theme,
  size,
  showLineNumbers = false,
  highlightLines = [],
  showCopyButton = true,
  showLanguageBadge = true,
  showHeader = true,
  maxHeight,
  expandable = false,
  collapsedHeight = 200,
  wrapLines = false,
  startLineNumber = 1,
  ...props
}: SnippetProps) {
  const resolvedVariant = variant ?? 'default'
  const palette = PALETTE[theme ?? 'dark']
  const fontSize = FONT_SIZE[size ?? 'default']
  const lineHeight = fontSize * 1.5
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!expandable)
  const lines = useMemo(() => rows(code, startLineNumber), [code, startLineNumber])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard permission or no clipboard API — nothing else to do.
    }
  }, [code])

  if (resolvedVariant === 'inline') {
    return (
      <Mono
        {...slot('snippet')}
        data-variant="inline"
        fontFamily="$mono"
        rounded="$2"
        px="$2"
        py="$1"
        wrap={wrapLines}
        style={{
          display: 'inline-block',
          backgroundColor: palette.bg,
          color: palette.fg,
          fontSize,
        }}
        {...(props as ComponentProps<typeof Mono>)}
      >
        {code}
      </Mono>
    )
  }

  const hasHeader =
    resolvedVariant === 'default' &&
    showHeader &&
    Boolean(filename || (showLanguageBadge && language) || showCopyButton || expandable)

  return (
    <Frame
      {...slot('snippet')}
      data-variant={resolvedVariant}
      variant={resolvedVariant}
      style={
        resolvedVariant === 'default'
          ? { backgroundColor: palette.bg, borderColor: palette.border }
          : undefined
      }
      {...(props as ComponentProps<typeof Frame>)}
    >
      {hasHeader && (
        <Header {...slot('snippet-header')} style={{ borderBottomColor: palette.border }}>
          <XStack items="center" gap="$2">
            {filename && (
              <XStack items="center" gap="$1.5">
                <FileText size={14} color={palette.muted} />
                <SizableText size="$2" fontWeight="500" style={{ color: palette.fg }}>
                  {filename}
                </SizableText>
              </XStack>
            )}
            {showLanguageBadge && language && (
              <Badge {...slot('snippet-language')} variant="secondary">
                {language}
              </Badge>
            )}
          </XStack>
          <XStack items="center" gap="$1">
            {expandable && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsExpanded((v) => !v)}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <Minimize2 size={14} color={palette.muted} />
                ) : (
                  <Maximize2 size={14} color={palette.muted} />
                )}
              </Button>
            )}
            {showCopyButton && <CopyButton copied={copied} onPress={copy} muted={palette.muted} />}
          </XStack>
        </Header>
      )}

      <YStack
        {...slot('snippet-body')}
        style={{
          maxHeight: isExpanded ? maxHeight : collapsedHeight,
          overflow: 'auto',
        }}
      >
        <YStack py="$2" minW="100%" self="flex-start">
          {lines.map(({ n, text }) => {
            const isHighlighted = highlightLines.includes(n)
            return (
              <Row
                key={n}
                highlighted={isHighlighted}
                wrap={wrapLines}
                data-slot="snippet-line"
                data-line={n}
                data-highlighted={isHighlighted ? 'true' : undefined}
              >
                {showLineNumbers && (
                  <Mono
                    width={32}
                    text="right"
                    select="none"
                    wrap={false}
                    fontSize={FONT_SIZE.sm}
                    lineHeight={lineHeight}
                    style={{ color: palette.muted }}
                  >
                    {n}
                  </Mono>
                )}
                <Mono
                  flex={1}
                  wrap={wrapLines}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  style={{ color: palette.fg }}
                >
                  {text || ' '}
                </Mono>
              </Row>
            )
          })}
        </YStack>
      </YStack>

      {expandable && !isExpanded && (
        <XStack
          {...slot('snippet-fade')}
          position="absolute"
          b={0}
          l={0}
          r={0}
          height={32}
          pointerEvents="none"
          style={{ background: `linear-gradient(to top, ${palette.bg}, transparent)` }}
        />
      )}

      {resolvedVariant === 'minimal' && showCopyButton && (
        <CopyButton copied={copied} onPress={copy} muted={palette.muted} floating />
      )}
    </Frame>
  )
}

export interface InlineCodeProps extends Omit<SnippetProps, 'variant' | 'code'> {
  children: string
}

/** A phrase of code inline in text — `Snippet` fixed to `variant="inline"`. */
export function InlineCode({ children, language, ...props }: InlineCodeProps): ReactNode {
  return (
    <Snippet
      code={children}
      language={language}
      variant="inline"
      showCopyButton={false}
      showLanguageBadge={false}
      showHeader={false}
      {...props}
    />
  )
}
