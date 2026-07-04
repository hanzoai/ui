'use client'

/**
 * Landing — the reusable polished landing/overview any product composes from a
 * small `LandingConfig`: a clean hero, a live count-up metrics row, an interactive
 * code-sample block (curl/python/ts/js + copy + Run), and a resources rail
 * (docs/quickstart/examples/code/support). DRY — one landing system across products.
 *
 * Layout: hero on top, then a two-column body (main content + resource rail) that
 * wraps to a single column on narrow viewports. `children` is the product's own
 * REAL content, rendered below the code block so a product keeps everything it
 * already had — this is polish, not a rewrite.
 */
import { useRef, type ReactNode } from 'react'
import { XStack, YStack } from '@hanzo/gui'

import { Hero } from './Hero'
import { Metrics } from './Metrics'
import { Samples } from './Samples'
import { Rail } from './Rail'
import type { LandingConfig } from './types'

export function Landing({ config, children }: { config: LandingConfig; children?: ReactNode }) {
  const codeRef = useRef<HTMLDivElement>(null)
  const hasCode = Boolean(config.samples && config.samples.length)
  const scrollToCode = () => codeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <YStack gap="$4">
      <Hero config={config} />

      <XStack gap="$4" flexWrap="wrap" items="flex-start">
        <YStack flex={2} minW={360} gap="$4">
          <Metrics config={config} />
          {hasCode ? (
            <div ref={codeRef} style={{ width: '100%' }}>
              <Samples samples={config.samples as NonNullable<LandingConfig['samples']>} run={config.run} />
            </div>
          ) : null}
          {children}
        </YStack>

        <Rail config={config} onViewCode={hasCode ? scrollToCode : undefined} />
      </XStack>
    </YStack>
  )
}
