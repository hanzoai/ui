'use client'

/**
 * Code — a labelled, copyable code region.
 *
 * The language label and the controls live in a bar above the code, never
 * floating over it: an overlaid copy button covers the first line, which is
 * where the prompt or the import sits and the part most often being read.
 *
 * Highlighting is not here. Surfaces disagree on the highlighter (and on whether
 * they want one at all), and a package that picked would either impose a large
 * dependency or be bypassed. `children` is rendered as-is, so a surface can pass
 * plain text or its own highlighted nodes.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import { useI18n } from '@hanzo/i18n/react'
import { ChevronDown, ChevronUp, Code2, Download, Hash, WrapText } from '@hanzogui/lucide-icons-2'
import { createContext, useContext, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'

import { RING } from '../backends/gui/press'
import { slot, tip } from '../backends/gui/slot'
import { CopyButton } from '../product/CopyButton'
import { save } from './save'
import { useReducedMotion } from './useReducedMotion'

/** Cross-surface handoff context provided by Chat so any code block or HTML artifact can open cleanly in Hanzo Dev. */
export interface ChatHandoffHandlers {
  openInDev?: (payload: { code: string; language?: string; title?: string }) => void
}

const ChatHandoffContext = createContext<ChatHandoffHandlers | null>(null)

export function ChatHandoffProvider({ value, children }: { value: ChatHandoffHandlers; children: ReactNode }) {
  return <ChatHandoffContext.Provider value={value}>{children}</ChatHandoffContext.Provider>
}

export function useChatHandoff(): ChatHandoffHandlers | null {
  return useContext(ChatHandoffContext)
}

/**
 * Monospace stack, applied through `style` rather than a `$mono` token.
 *
 * There is no mono family in the token set — only `$body` and `$heading` — so a
 * `fontFamily="$mono"` would not typecheck, and picking `$body` would set code
 * in a proportional face, where columns stop aligning and l/1/I stop being
 * distinguishable. The CSS variable is honoured when the host defines Zen Mono
 * and falls back to the platform's own monospace when it does not.
 */
const MONO: CSSProperties = {
  fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
}

const MONO_WRAP: CSSProperties = {
  ...MONO,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
}

const DIFF_ADD_BG = 'color-mix(in srgb, var(--state-success) 12%, transparent)'
const DIFF_DEL_BG = 'color-mix(in srgb, var(--state-error) 12%, transparent)'

const FOLD_THRESHOLD = 32
const FOLD_LINES = 22

const EXTENSIONS: Record<string, string> = {
  ts: 'ts',
  typescript: 'ts',
  tsx: 'tsx',
  js: 'js',
  javascript: 'js',
  jsx: 'jsx',
  py: 'py',
  python: 'py',
  sh: 'sh',
  shell: 'sh',
  zsh: 'sh',
  bash: 'sh',
  json: 'json',
  jsonc: 'json',
  css: 'css',
  html: 'html',
  htm: 'html',
  sql: 'sql',
  md: 'md',
  markdown: 'md',
  yaml: 'yaml',
  yml: 'yml',
  go: 'go',
  golang: 'go',
  rs: 'rs',
  rust: 'rs',
  diff: 'diff',
  patch: 'diff',
  txt: 'txt',
  text: 'txt',
  plaintext: 'txt',
}

const extensionOf = (language: string): string => {
  const clean = language.trim().toLowerCase()
  const key = clean.includes('/') ? (clean.split('/').pop() ?? clean) : clean
  return EXTENSIONS[key] ?? 'txt'
}

export interface CodeProps extends Omit<ComponentProps<typeof YStack>, 'children'> {
  children?: ReactNode
  /** Shown in the label bar. */
  language?: string
  /** Raw text for the copy control. Falls back to `children` when it is a string. */
  value?: string
  /** Extra controls in the label bar, before copy. */
  actions?: ReactNode
}

export function Code({ children, language = 'text', value, actions, ...props }: CodeProps) {
  const { t } = useI18n()
  const handoff = useChatHandoff()
  const text = value ?? (typeof children === 'string' ? children : '')
  const lines = text ? text.split('\n') : []
  const lineCount = lines.length
  const hasCustomNodes = children != null && typeof children !== 'string'
  const canLineRender = !hasCustomNodes && lineCount > 0
  const isDiff = canLineRender && language.trim().toLowerCase() === 'diff'
  const foldable = canLineRender && lineCount > FOLD_THRESHOLD

  const [showLines, setShowLines] = useState(false)
  const [wrap, setWrap] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const reducedMotion = useReducedMotion()
  const ease = reducedMotion ? undefined : ('quickest' as const)

  const visibleLines = foldable && !expanded ? lines.slice(0, FOLD_LINES) : lines
  const renderRows = canLineRender && (showLines || isDiff || foldable)
  const gutterWidth = Math.max(24, String(lineCount).length * 9 + 8)

  const headerLabel =
    lineCount > 1 ? `${language} · ${t('{n} lines', { n: lineCount })}` : language

  const controlProps = (active: boolean) =>
    ({
      render: <button type="button" />,
      minW: 24,
      minH: 24,
      px: '$1',
      rounded: '$2',
      items: 'center',
      justify: 'center',
      borderWidth: 0,
      bg: active ? '$hover' : 'transparent',
      opacity: active ? 1 : 0.65,
      cursor: 'pointer',
      transition: ease,
      hoverStyle: { bg: '$hover', opacity: 1 },
      pressStyle: { bg: '$raised' },
      focusVisibleStyle: RING,
      '$max-sm': { minW: 44, minH: 44, opacity: 0.85 },
    }) as const

  const body = renderRows ? (
    <YStack py="$2.5" width="100%">
      {visibleLines.map((line, idx) => {
        const added = isDiff && line.startsWith('+') && !line.startsWith('+++')
        const removed = isDiff && line.startsWith('-') && !line.startsWith('---')
        const hunk = isDiff && line.startsWith('@@')
        const rowBg = added ? DIFF_ADD_BG : removed ? DIFF_DEL_BG : undefined
        return (
          <XStack
            key={idx}
            px="$3"
            width="100%"
            items="flex-start"
            bg={rowBg as never}
          >
            {showLines ? (
              <SizableText
                size="$1"
                color="$quiet"
                opacity={0.55}
                select="none"
                text="end"
                shrink={0}
                minW={gutterWidth}
                paddingInlineEnd="$3"
                lineHeight={20}
                fontVariant={['tabular-nums']}
                style={MONO}
                aria-hidden
              >
                {idx + 1}
              </SizableText>
            ) : null}
            <SizableText
              size="$1"
              color="$ink"
              fontWeight={hunk ? '500' : undefined}
              lineHeight={20}
              whiteSpace={wrap ? 'pre-wrap' : 'pre'}
              style={wrap ? MONO_WRAP : MONO}
              grow={1}
              minW={0}
            >
              {line.length > 0 ? line : ' '}
            </SizableText>
          </XStack>
        )
      })}
    </YStack>
  ) : (
    <YStack px="$3" py="$2.5" width="100%">
      <SizableText
        size="$1"
        lineHeight={20}
        whiteSpace={wrap ? 'pre-wrap' : 'pre'}
        style={wrap ? MONO_WRAP : MONO}
      >
        {children ?? text}
      </SizableText>
    </YStack>
  )

  return (
    <YStack
      {...slot('code')}
      width="100%"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$panel"
      overflow="hidden"
      {...props}
    >
      <XStack
        items="center"
        gap="$1"
        px="$3"
        py="$1.5"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        {/* `$quiet`, not `$soft`. The label sits on `$panel` at 11px, and
            `$soft` measures 2.97:1 there — under WCAG's 4.5:1 for body text
            and under even the 3:1 large-text floor this is too small to claim.
            `$quiet` is the ramp's readable secondary and clears it. The bar is
            chrome, so it stays quieter than the code; quiet is a rung, not an
            excuse to be unreadable. */}
        <SizableText size="$1" style={MONO} color="$quiet" fontVariant={['tabular-nums']}>
          {headerLabel}
        </SizableText>
        <XStack grow={1} />
        {canLineRender && lineCount > 1 ? (
          <XStack
            {...slot('code-lines-toggle')}
            {...controlProps(showLines)}
            aria-pressed={showLines}
            aria-label={showLines ? t('Hide line numbers') : t('Show line numbers')}
            {...tip(showLines ? t('Hide line numbers') : t('Show line numbers'))}
            onClick={() => setShowLines((v) => !v)}
          >
            <Hash size={13} color={showLines ? '$ink' : '$quiet'} />
          </XStack>
        ) : null}
        <XStack
          {...slot('code-wrap-toggle')}
          {...controlProps(wrap)}
          aria-pressed={wrap}
          aria-label={wrap ? t('Disable word wrap') : t('Wrap lines')}
          {...tip(wrap ? t('Disable word wrap') : t('Wrap lines'))}
          onClick={() => setWrap((v) => !v)}
        >
          <WrapText size={13} color={wrap ? '$ink' : '$quiet'} />
        </XStack>
        {text && handoff?.openInDev ? (
          <XStack
            {...slot('code-open-in-dev')}
            {...controlProps(false)}
            gap="$1"
            px="$2"
            aria-label={t('Open in Dev')}
            {...tip(t('Open in Dev'))}
            onClick={() => handoff.openInDev?.({ code: text, language })}
          >
            <Code2 size={13} color="$ink" aria-hidden />
            <SizableText size="$1" color="$ink" fontWeight="500">
              {t('Open in Dev')}
            </SizableText>
          </XStack>
        ) : null}
        {text ? (
          <XStack
            {...slot('code-download')}
            {...controlProps(false)}
            aria-label={t('Download snippet')}
            {...tip(t('Download snippet'))}
            onClick={() => save(text, `snippet.${extensionOf(language)}`, 'text/plain;charset=utf-8')}
          >
            <Download size={13} color="$quiet" />
          </XStack>
        ) : null}
        {actions}
        {text ? (
          <CopyButton
            value={text}
            props={{
              focusVisibleStyle: RING,
              '$max-sm': { minW: 44, minH: 44 },
            }}
          />
        ) : null}
      </XStack>

      {/*
        A long line scrolls; it does not wrap and it does not disappear unless
        the reader opts into word wrap.

        The frame carries `overflow="hidden"` so the corners stay round, which
        on its own CLIPS anything wider than the block — and code is the one
        content type where the interesting part is regularly past column 80 (a
        curl with a URL, a stack frame, a one-line pipeline). Both surfaces that
        style a code block reach for the same rule: hanzo.app's `.md pre`
        (`assets/globals.css:1370`) and the extension's `.ae-widget-example`
        (`newtab.css:419`) are each `overflow-x: auto`. A horizontal ScrollView
        is that rule spelled so it also holds on native, where there is no
        overflow property to set.
      */}
      {wrap ? (
        <YStack width="100%">{body}</YStack>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <YStack minW="100%">{body}</YStack>
        </ScrollView>
      )}

      {foldable ? (
        <XStack
          {...slot('code-fold')}
          render={<button type="button" />}
          width="100%"
          items="center"
          justify="center"
          gap="$1.5"
          px="$3"
          py="$1.5"
          minH={32}
          $max-sm={{ minH: 44 }}
          borderWidth={0}
          borderTopWidth={1}
          borderColor="$borderColor"
          bg="$panel"
          hoverStyle={{ bg: '$hover' }}
          pressStyle={{ bg: '$raised' }}
          focusVisibleStyle={RING}
          transition={ease}
          cursor="pointer"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronUp size={13} color="$quiet" aria-hidden />
          ) : (
            <ChevronDown size={13} color="$quiet" aria-hidden />
          )}
          <SizableText size="$1" color="$quiet" fontWeight="500">
            {expanded ? t('Collapse') : t('Show all {n} lines', { n: lineCount })}
          </SizableText>
        </XStack>
      ) : null}
    </YStack>
  )
}
