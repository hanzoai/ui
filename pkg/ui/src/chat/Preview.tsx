'use client'

/**
 * Preview — an interface the model wrote, shown but not run.
 *
 * Generative UI arrives as markup, and markup from a model is untrusted input
 * that happens to be a document. Rendering it into the host page is
 * cross-site scripting with extra steps; refusing to render it at all leaves
 * the feature as a paragraph of HTML source. Neither is the answer.
 *
 * The answer is `sandbox=""`. An empty allow-list is the STRICTEST setting the
 * attribute has, not a lax one: no scripts, no same-origin, no forms, no
 * navigation, no popups, no pointer lock. The document lays out and paints —
 * real CSS, real fonts, real layout, a real screenshot — and can do nothing
 * else. That is exactly the shape of a mockup, so nothing is lost by taking
 * away the half that is dangerous.
 *
 * This is why `Parts` can draw an `artifact` and still refuses a `uiResource`.
 * They are not the same risk: a `uiResource` is a URL, and loading one pulls a
 * third-party origin into the page over the network. Inline markup with
 * scripting off reaches nothing and runs nothing.
 *
 * Web only, like `Backdrop` — it is an `<iframe>`, and there is no such thing
 * off the web. A surface that runs on native sends artifacts with no `markup`
 * and gets `ArtifactCard`, which is where that decision already lived.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { useI18n } from '@hanzo/i18n/react'
import { Code2, Download, Eye } from '@hanzogui/lucide-icons-2'
import { useState, type ComponentProps } from 'react'

import { RING } from '../backends/gui/press'
import { slot, tip } from '../backends/gui/slot'
import { CopyButton } from '../product/CopyButton'
import { Code, useChatHandoff } from './Code'
import { save } from './save'
import { useReducedMotion } from './useReducedMotion'

type Mode = 'preview' | 'code'

/** The file a download is named after: the title, as a slug. */
const slugify = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'preview'

export interface PreviewProps extends Omit<ComponentProps<typeof YStack>, 'children'> {
  /** A self-contained HTML document. Script in it will not run. */
  markup: string
  /** Named in the frame's header. Also the frame's accessible name. */
  title?: string
  /** Viewport height, px. The document scrolls inside it. */
  height?: number
}

export function Preview({ markup, title, height = 320, ...props }: PreviewProps) {
  const { t } = useI18n()
  const handoff = useChatHandoff()
  const named = title ?? t('Preview')
  const [mode, setMode] = useState<Mode>('preview')
  const ease = useReducedMotion() ? undefined : ('quickest' as const)

  const button = {
    render: <button type="button" />,
    minW: 26,
    minH: 26,
    px: '$1',
    rounded: '$2',
    items: 'center',
    justify: 'center',
    borderWidth: 0,
    bg: 'transparent',
    opacity: 0.72,
    cursor: 'pointer',
    transition: ease,
    hoverStyle: { bg: '$hover', opacity: 1 },
    pressStyle: { bg: '$raised' },
    focusVisibleStyle: RING,
    '$max-sm': { minW: 44, minH: 44, opacity: 0.9 },
  } as const

  const segment = (id: Mode, icon: typeof Eye, label: string) => {
    const Icon = icon
    const on = mode === id
    return (
      <XStack
        render={<button type="button" />}
        minH={22}
        px="$2"
        gap="$1"
        rounded="$1"
        items="center"
        justify="center"
        borderWidth={0}
        bg={on ? '$panel' : 'transparent'}
        cursor="pointer"
        transition={ease}
        hoverStyle={{ bg: on ? '$panel' : '$raised' }}
        focusVisibleStyle={RING}
        $max-sm={{ minH: 44, px: '$2.5' }}
        aria-pressed={on}
        onClick={() => setMode(id)}
      >
        <Icon size={12} color={on ? '$ink' : '$quiet'} aria-hidden />
        <SizableText size="$1" color={on ? '$ink' : '$quiet'} fontWeight={on ? '500' : '400'}>
          {label}
        </SizableText>
      </XStack>
    )
  }

  return (
    <YStack
      {...slot('preview')}
      width="100%"
      maxW={720}
      rounded="$4"
      overflow="hidden"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$panel"
      {...props}
    >
      <XStack {...slot('preview-toolbar')} items="center" gap="$2" px="$3" py="$1.5" borderBottomWidth={1} borderColor="$borderColor" flexWrap="wrap">
        <SizableText size="$1" color="$ink" fontWeight="500" numberOfLines={1} shrink={1} minW={0}>
          {named}
        </SizableText>
        <XStack grow={1} />
        <XStack {...slot('preview-mode')} items="center" p={2} gap={2} rounded="$2" bg="$hover" borderWidth={1} borderColor="$borderColor" shrink={0}>
          {segment('preview', Eye, t('Preview'))}
          {segment('code', Code2, t('Code'))}
        </XStack>
        <XStack items="center" gap="$0.5" shrink={0}>
          {handoff?.openInDev ? (
            <XStack
              {...slot('preview-open-in-dev')}
              {...button}
              gap="$1"
              px="$2"
              aria-label={t('Open in Dev')}
              {...tip(t('Open in Dev'))}
              onClick={() => handoff.openInDev?.({ code: markup, language: 'html', title: named })}
            >
              <Code2 size={12} color="$ink" aria-hidden />
              <SizableText size="$1" color="$ink" fontWeight="500">
                {t('Open in Dev')}
              </SizableText>
            </XStack>
          ) : null}
          <CopyButton value={markup} size={26} props={{ focusVisibleStyle: RING, '$max-sm': { minW: 44, minH: 44 } }} />
          <XStack
            {...slot('preview-download')}
            {...button}
            aria-label={t('Download HTML')}
            {...tip(t('Download'))}
            onClick={() => save(markup, `${slugify(named)}.html`, 'text/html;charset=utf-8')}
          >
            <Download size={13} color="$quiet" />
          </XStack>
        </XStack>
      </XStack>

      {mode === 'code' ? (
        <YStack width="100%" maxH={Math.max(height, 320)} overflowY="auto">
          <Code language="html" value={markup} rounded={0} borderWidth={0}>
            {markup}
          </Code>
        </YStack>
      ) : (
        /*
          `sandbox=""` is the whole security posture and must stay empty — one
          `allow-scripts` turns this from a picture into an execution surface.
          `srcDoc` rather than a `src`: there is no URL, and nothing is fetched.
        */
        <iframe
          title={named}
          srcDoc={markup}
          sandbox=""
          referrerPolicy="no-referrer"
          style={{
            display: 'block',
            width: '100%',
            height,
            border: 0,
            background: '#fff',
            colorScheme: 'light',
          }}
        />
      )}
    </YStack>
  )
}
