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
import type { ComponentProps } from 'react'

import { slot } from '../backends/gui/slot'

export interface PreviewProps extends Omit<ComponentProps<typeof YStack>, 'children'> {
  /** A self-contained HTML document. Script in it will not run. */
  markup: string
  /** Named in the frame's header. Also the frame's accessible name. */
  title?: string
  /** Viewport height, px. The document scrolls inside it. */
  height?: number
}

export function Preview({ markup, title, height = 320, ...props }: PreviewProps) {
  const named = title ?? 'Preview'
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
      {title ? (
        <XStack
          items="center"
          gap="$2"
          px="$3"
          py="$2"
          borderBottomWidth={1}
          borderColor="$borderColor"
        >
          <SizableText size="$1" color="$soft" numberOfLines={1}>
            {title}
          </SizableText>
        </XStack>
      ) : null}
      {/*
        `sandbox=""` is the whole security posture and must stay empty — one
        `allow-scripts` turns this from a picture into an execution surface.
        `srcDoc` rather than a `src`: there is no URL, and nothing is fetched.
      */}
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
    </YStack>
  )
}
