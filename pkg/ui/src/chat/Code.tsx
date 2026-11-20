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
import { Code2, Download, WrapText } from '@hanzogui/lucide-icons-2'
import { createContext, useContext, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'

import { RING } from '../backends/gui/press'
import { slot, tip } from '../backends/gui/slot'
import { CopyButton } from '../product/CopyButton'
import { save } from './save'
import { useReducedMotion } from './useReducedMotion'

/** Hand-off context a surface provides so any code block or HTML artifact can open cleanly in Hanzo Dev. */
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
  const [wrap, setWrap] = useState(false)
  const reducedMotion = useReducedMotion()
  const ease = reducedMotion ? undefined : ('quickest' as const)

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

  const body = (
    <YStack px="$3" py="$2.5" width="100%">
      <SizableText size="$1" lineHeight={20} whiteSpace={wrap ? 'pre-wrap' : 'pre'} style={wrap ? MONO_WRAP : MONO}>
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
        <SizableText size="$1" style={MONO} color="$quiet">
          {language}
        </SizableText>
        <XStack grow={1} />
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

    </YStack>
  )
}
