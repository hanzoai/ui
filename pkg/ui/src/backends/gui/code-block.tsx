'use client'

/**
 * CodeBlock — a bordered panel that shows source code line by line: a header
 * naming the file and its language with a copy-to-clipboard button, a gutter
 * of line numbers, and a band on any line a caller highlights or marks as added
 * or removed in a diff.
 *
 * A line is plain monospace text, not colorized tokens: the workspace ships no
 * highlighter. With no `theme` the panel is the code theme (`code-theme.ts`),
 * monochrome, and follows the page into light or dark; `dark` or `light` pins
 * it to that scheme whatever the page is. Any other name is that editor
 * palette, fixed. A marked line takes a band one step off the ground and an
 * edge whose brightness says which mark it is, and a diff line its sign, so no
 * mark depends on a hue. The lines read left to right under any `dir`, as code
 * does. `size` picks the type scale. A line is never wrapped, so the body
 * scrolls on both axes once it outgrows `maxHeight` or the panel's width.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import { Check, Copy, FileText } from '@hanzogui/lucide-icons-2'
import { useCallback, useState, type ComponentProps } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { Button } from './button'
import { Language, mono, named, type Palette, type Surface } from './code-surface'
import { align, ltr } from './dir'
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

/** The named editor palettes, opt-in by name and fixed whatever the page's theme. */
const PALETTE = {
  github: { bg: '#ffffff', border: '#e2e8f0', fg: '#24292e', muted: '#6e7781' },
  'github-dark': { bg: '#0d1117', border: '#30363d', fg: '#c9d1d9', muted: '#8b949e' },
  'vs-dark': { bg: '#1e1e1e', border: '#333333', fg: '#d4d4d4', muted: '#808080' },
  monokai: { bg: '#272822', border: '#49483e', fg: '#f8f8f2', muted: '#75715e' },
  dracula: { bg: '#282a36', border: '#44475a', fg: '#f8f8f2', muted: '#6272a4' },
  nord: { bg: '#2e3440', border: '#4c566a', fg: '#d8dee9', muted: '#81a1c1' },
} as const satisfies Record<Exclude<CodeBlockTheme, 'dark' | 'light'>, Palette>

/** The surface a `theme` names: the code theme for none, `dark` or `light`, else that palette. */
const surface = (theme: CodeBlockTheme | null | undefined): Surface =>
  !theme || theme === 'dark' || theme === 'light' ? mono(theme) : named(PALETTE[theme])

const FONT_SIZE: Record<CodeBlockSize, number> = { sm: 12, default: 14, lg: 16 }

type Marker = 'highlight' | 'added' | 'removed'

/** A marked line's edge (a rung of its surface) and the sign a diff line carries in its gutter. */
const MARK = {
  highlight: { edge: 'fg', sign: undefined },
  added: { edge: 'strong', sign: '+' },
  removed: { edge: 'muted', sign: '-' },
} as const satisfies Record<Marker, { edge: Exclude<keyof Surface, 'tokens'>; sign?: string }>

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
  borderInlineStartWidth: 2,
  borderInlineStartStyle: 'solid',
  borderInlineStartColor: 'transparent',
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
  const { t } = useI18n()
  const paint = surface(theme)
  const fontSize = FONT_SIZE[size ?? 'default']
  const lineHeight = fontSize * 1.5
  const label = copied ? t('Copied') : t('Copy code')

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
      bg={paint.bg as never}
      borderColor={paint.border as never}
      {...(props as ComponentProps<typeof Frame>)}
    >
      {(filename || language || showCopyButton) && (
        <Header {...slot('code-block-header')} borderBottomColor={paint.border as never}>
          <XStack items="center" gap="$2">
            {filename && (
              <XStack items="center" gap="$1.5">
                <FileText size={14} color={paint.muted as never} />
                <SizableText size="$2" fontWeight="500" color={paint.fg as never}>
                  {filename}
                </SizableText>
              </XStack>
            )}
            {language && (
              <Language {...slot('code-block-language')} bg={paint.line as never} color={paint.muted as never}>
                {language}
              </Language>
            )}
          </XStack>
          {showCopyButton && (
            <Button variant="ghost" size="icon-sm" onClick={copy} aria-label={label} title={label}>
              {copied ? (
                <Check size={14} color={paint.strong as never} />
              ) : (
                <Copy size={14} color={paint.muted as never} />
              )}
            </Button>
          )}
        </Header>
      )}
      {/* Code reads left to right in any language, so the lines are an LTR island. */}
      <YStack {...ltr} style={{ maxHeight, overflow: 'auto' }}>
        {/* Sized to the widest line, never narrower than the panel, so a band spans every line in full. */}
        <YStack py="$2" minW="100%" self="flex-start">
          {rows(code, highlightLines, diff).map(({ n, text, marker }) => {
            const mark = marker && MARK[marker]
            return (
              <Line
                key={n}
                {...(mark ? { bg: paint.line as never, borderInlineStartColor: paint[mark.edge] as never } : null)}
                data-slot="code-block-line"
                data-line={n}
                data-mark={marker}
              >
                {showLineNumbers && (
                  <Mono
                    width={32}
                    {...align('end')}
                    select="none"
                    fontSize={FONT_SIZE.sm}
                    lineHeight={lineHeight}
                    color={paint.muted as never}
                  >
                    {n}
                  </Mono>
                )}
                {mark?.sign && (
                  <Mono
                    select="none"
                    fontSize={FONT_SIZE.sm}
                    lineHeight={lineHeight}
                    color={paint[mark.edge] as never}
                  >
                    {mark.sign}
                  </Mono>
                )}
                <Mono fontSize={fontSize} lineHeight={lineHeight} color={paint.fg as never}>
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
