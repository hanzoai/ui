'use client'

/**
 * ContinueBanner — floating call-to-action banner.
 *
 * "Continue in Hanzo AI" banner allowing free chat on Hanzo Desktop and
 * hanzo.chat while promoting the full cloud workspace experience on hanzo.app.
 * Includes a countdown timer ring ("Stay in Chat (20)") and a direct deep link button.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { CornerDownLeft, Sparkles } from '@hanzogui/lucide-icons-2'
import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'

import { slot } from '../backends/gui/slot'

export interface ContinueBannerProps
  extends Omit<ComponentProps<typeof YStack>, 'children'> {
  initialCountdown?: number
  onStayInChat?: () => void
  onContinue?: () => void
  deepLinkUrl?: string
  title?: string
  description?: string
}

export function ContinueBanner({
  initialCountdown = 20,
  onStayInChat,
  onContinue,
  deepLinkUrl = 'https://hanzo.app/chat',
  title = 'Continue in Hanzo AI',
  description = 'Create and edit documents, use apps, and complete multi-step tasks',
  ...props
}: ContinueBannerProps) {
  const [countdown, setCountdown] = useState(initialCountdown)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!visible || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [visible, countdown])

  if (!visible) return null

  const handleStay = () => {
    setVisible(false)
    onStayInChat?.()
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else if (typeof window !== 'undefined') {
      window.open(deepLinkUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const progress = countdown / initialCountdown
  const strokeDashoffset = 28.27 * (1 - progress)

  return (
    <YStack
      {...slot('continue-banner')}
      width="100%"
      maxW={768}
      mx="auto"
      px="$4"
      py="$2"
      {...props}
    >
      <XStack
        items="center"
        justify="space-between"
        p="$3"
        gap="$3"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
        bg="$panel"
        shadowColor="$shadowColor"
        shadowRadius={12}
        flexWrap="wrap"
      >
        {/* Icon and Description */}
        <XStack items="center" gap="$3" flex={1} minW={240}>
          <YStack
            width={40}
            height={40}
            items="center"
            justify="center"
            rounded="$3"
            bg="$background"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Sparkles size={18} color="$accent" />
          </YStack>

          <YStack gap="$1" flex={1}>
            <SizableText size="$2" fontWeight="600" color="$ink">
              {title}
            </SizableText>
            <SizableText size="$1" color="$soft">
              {description}
            </SizableText>
          </YStack>
        </XStack>

        {/* Action Buttons */}
        <XStack items="center" gap="$2">
          <button
            onClick={handleStay}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#d4d4d8',
              cursor: 'pointer',
            }}
            type="button"
          >
            <svg
              style={{
                width: '14px',
                height: '14px',
                transform: 'rotate(-90deg)',
              }}
              viewBox="0 0 12 12"
            >
              <circle
                cx="6"
                cy="6"
                fill="transparent"
                r="4.5"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1.5"
              />
              <circle
                cx="6"
                cy="6"
                fill="transparent"
                r="4.5"
                stroke="#22d3ee"
                strokeDasharray="28.27"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="1.5"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span>Stay in Chat ({countdown})</span>
          </button>

          <button
            onClick={handleContinue}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '9999px',
              background: 'linear-gradient(to right, #2563eb, #0284c7)',
              border: 'none',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
            type="button"
          >
            <span>Continue in Hanzo AI</span>
            <CornerDownLeft size={14} />
          </button>
        </XStack>
      </XStack>
    </YStack>
  )
}
