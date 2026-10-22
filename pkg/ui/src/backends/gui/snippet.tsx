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
 * no syntax highlighter, the same constraint `code-block.tsx` documents. With
 * no `theme` the surface is the code theme (`code-theme.ts`), monochrome, and
 * follows the page; `dark` or `light` pins it to that scheme, and any other name
 * is that fixed palette, as in `code-block.tsx`. Code reads left to right
 * under any `dir`, inline code included. `size` picks the type scale.
 *
 * `variant="command"` is the record kit's command block (CommandBlock,
 * MIT — NOTICE): shell lines on the panel ground, 1px hairline,
 * 4px corners, 12px padding, each line led by a dim "> " the reader does not copy
 * or hear, wrapping anywhere, with `actions` (the copy button by default) 12px
 * from the text and never shrinking. It follows the page's theme rather than a
 * fixed palette, since it sits in settings and setup pages beside other chrome.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import { Check, Copy, FileText, Maximize2, Minimize2 } from '@hanzogui/lucide-icons-2'
import { useCallback, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { Button } from './button'
import { css, Language, mono, named, type Palette, type Surface } from './code-surface'
import { align, ltr } from './dir'
import { slot } from './slot'

export type SnippetVariant = 'default' | 'inline' | 'minimal' | 'command'

export type SnippetTheme = 'dark' | 'light' | 'github' | 'github-dark' | 'terminal' | 'retro'

export type SnippetSize = 'xs' | 'sm' | 'default' | 'lg'

/** The named palettes, opt-in by name and fixed whatever the page's theme. */
const PALETTE = {
  github: { bg: '#ffffff', border: '#e2e8f0', fg: '#24292e', muted: '#6e7781' },
  'github-dark': { bg: '#0d1117', border: '#30363d', fg: '#c9d1d9', muted: '#8b949e' },
  terminal: { bg: '#000000', border: '#22c55e4d', fg: '#4ade80', muted: '#4ade8099' },
  retro: { bg: '#fffbeb', border: '#fde68a', fg: '#78350f', muted: '#92400e' },
} as const satisfies Record<Exclude<SnippetTheme, 'dark' | 'light'>, Palette>

/** The surface a `theme` names: the code theme for none, `dark` or `light`, else that palette. */
const surface = (theme: SnippetTheme | null | undefined): Surface =>
  !theme || theme === 'dark' || theme === 'light' ? mono(theme) : named(PALETTE[theme])

const FONT_SIZE: Record<SnippetSize, number> = { xs: 11, sm: 12, default: 14, lg: 16 }

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
  /** `command`: the controls beside the lines; the copy button unless given. */
  actions?: ReactNode
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
  borderInlineStartWidth: 2,
  borderInlineStartStyle: 'solid',
  borderInlineStartColor: 'transparent',

  variants: {
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

/** The copy button, shared by every variant that shows one: the copy mark in `muted`, the check in `strong`. */
function CopyButton({
  copied,
  onPress,
  paint,
  floating,
}: {
  copied: boolean
  onPress: () => void
  paint: Pick<Surface, 'muted' | 'strong'>
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
      {copied ? <Check size={14} color={paint.strong as never} /> : <Copy size={14} color={paint.muted as never} />}
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
  actions,
  ...props
}: SnippetProps) {
  const resolvedVariant = variant ?? 'default'
  const paint = surface(theme)
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

  if (resolvedVariant === 'command') {
    return (
      <XStack
        {...slot('snippet')}
        data-variant="command"
        items="flex-start"
        justify="space-between"
        gap="$3"
        p="$3"
        bg="$panel"
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$xs"
        {...(props as ComponentProps<typeof XStack>)}
      >
        <YStack {...slot('snippet-body')} {...ltr} flex={1} minW={0}>
          {code.split('\n').map((line, i) => (
            <Mono
              key={i}
              data-slot="snippet-line"
              size="$2"
              color="$ink"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
            >
              <Mono aria-hidden color="$codeDim" select="none">
                {'> '}
              </Mono>
              {line}
            </Mono>
          ))}
        </YStack>
        <XStack {...slot('snippet-actions')} shrink={0} items="center" gap="$2">
          {actions ??
            (showCopyButton ? <CopyButton copied={copied} onPress={copy} paint={{ muted: '$hint', strong: '$ink' }} /> : null)}
        </XStack>
      </XStack>
    )
  }

  if (resolvedVariant === 'inline') {
    return (
      <Mono
        {...slot('snippet')}
        data-variant="inline"
        {...ltr}
        fontFamily="$mono"
        rounded="$2"
        px="$2"
        py="$1"
        wrap={wrapLines}
        bg={paint.bg as never}
        color={paint.fg as never}
        fontSize={fontSize}
        style={{ display: 'inline-block' }}
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
      {...(resolvedVariant === 'default' ? { bg: paint.bg as never, borderColor: paint.border as never } : null)}
      {...(props as ComponentProps<typeof Frame>)}
    >
      {hasHeader && (
        <Header {...slot('snippet-header')} borderBottomColor={paint.border as never}>
          <XStack items="center" gap="$2">
            {filename && (
              <XStack items="center" gap="$1.5">
                <FileText size={14} color={paint.muted as never} />
                <SizableText size="$2" fontWeight="500" color={paint.fg as never}>
                  {filename}
                </SizableText>
              </XStack>
            )}
            {showLanguageBadge && language && (
              <Language {...slot('snippet-language')} bg={paint.line as never} color={paint.muted as never}>
                {language}
              </Language>
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
                  <Minimize2 size={14} color={paint.muted as never} />
                ) : (
                  <Maximize2 size={14} color={paint.muted as never} />
                )}
              </Button>
            )}
            {showCopyButton && <CopyButton copied={copied} onPress={copy} paint={paint} />}
          </XStack>
        </Header>
      )}

      <YStack
        {...slot('snippet-body')}
        {...ltr}
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
                {...(isHighlighted ? { bg: paint.line as never, borderInlineStartColor: paint.fg as never } : null)}
                wrap={wrapLines}
                data-slot="snippet-line"
                data-line={n}
                data-highlighted={isHighlighted ? 'true' : undefined}
              >
                {showLineNumbers && (
                  <Mono
                    width={32}
                    {...align('end')}
                    select="none"
                    wrap={false}
                    fontSize={FONT_SIZE.sm}
                    lineHeight={lineHeight}
                    color={paint.muted as never}
                  >
                    {n}
                  </Mono>
                )}
                <Mono
                  flex={1}
                  wrap={wrapLines}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  color={paint.fg as never}
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
          insetInlineStart={0}
          insetInlineEnd={0}
          height={32}
          pointerEvents="none"
          style={{ background: `linear-gradient(to top, ${css(paint.bg)}, transparent)` }}
        />
      )}

      {resolvedVariant === 'minimal' && showCopyButton && (
        <CopyButton copied={copied} onPress={copy} paint={paint} floating />
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
