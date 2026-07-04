'use client'

/**
 * Samples — the interactive Quick Start / code block. Tab-switch between the REAL
 * API call in curl / Python / TS / JS, copy the current sample, and (optionally)
 * Run / Try in Playground. Not a screenshot — real, copyable, tab-switchable code.
 * The block scrolls horizontally inside its own container so a wide line never
 * scrolls the page.
 */
import { useState } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Check, Copy, Play } from '@hanzogui/lucide-icons-2'

import { LandingCard, openExternal } from './parts'
import type { CodeSample, LandingAction } from './types'

export function Samples({ samples, run, title = 'Quick start' }: { samples: CodeSample[]; run?: LandingAction; title?: string }) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const idx = Math.min(active, samples.length - 1)
  const sample = samples[idx]

  const copy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(sample.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard denied — no-op (the code is still visible + selectable) */
    }
  }

  return (
    <LandingCard
      title={title}
      actions={
        run ? (
          <Button size="$2" icon={<Play size={14} />} onPress={() => (run.href ? openExternal(run.href) : run.onPress?.())}>
            {run.label}
          </Button>
        ) : undefined
      }
    >
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
        <XStack gap="$1" flexWrap="wrap" items="center">
          {samples.map((s, i) => {
            const on = i === idx
            return (
              <Button key={s.lang} size="$2" bg={on ? '$color5' : 'transparent'} borderWidth={1} borderColor={on ? '$color7' : '$borderColor'} onPress={() => setActive(i)}>
                <Text fontSize="$2" fontWeight={on ? '700' : '500'} color={on ? '$color12' : '$color11'}>
                  {s.label}
                </Text>
              </Button>
            )
          })}
        </XStack>
        <Button size="$2" chromeless icon={copied ? <Check size={14} color="#23c562" /> : <Copy size={14} />} onPress={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </XStack>

      <YStack bg="$color1" borderWidth={1} borderColor="$borderColor" rounded="$4" p="$3" style={{ overflowX: 'auto' }}>
        <Text
          color="$color11"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            whiteSpace: 'pre',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {sample.code}
        </Text>
      </YStack>
    </LandingCard>
  )
}
