'use client'

/**
 * FeedbackDialog & FeedbackButton — lightweight bug report / billing / feature
 * / feedback dialog posting to `POST /v1/help/feedback`.
 */
import { useState, type ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { useI18n } from '@hanzo/i18n/react'
import { MessageSquare } from '@hanzogui/lucide-icons-2'

import { Button, type ButtonSize, type ButtonVariant } from '../backends/gui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../backends/gui/dialog'
import { Input } from '../backends/gui/input'
import { slot } from '../backends/gui/slot'
import { Textarea } from '../backends/gui/textarea'
import {
  DEFAULT_FEEDBACK_API,
  reportFeedback,
  type FeedbackKind,
  type FeedbackPayload,
  type FeedbackResult,
} from './feedback'

export type UserFeedbackKind = Exclude<FeedbackKind, 'exception'>

const KINDS: readonly { value: UserFeedbackKind; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'billing', label: 'Billing' },
  { value: 'feature', label: 'Feature' },
  { value: 'feedback', label: 'Feedback' },
]

export interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Base API URL (defaults to `https://api.hanzo.ai`). */
  apiBase?: string
  /** Optional Bearer token for signed-in submissions. */
  token?: string | null
  /** Surface identifier (`'app'`, `'pay'`, `'ui'`, etc.). */
  app?: string
  /** Pre-filled user identifier. */
  user?: string
  /** Pre-filled contact email. */
  email?: string
  /** Optional page URL override (defaults to `window.location.href`). */
  page?: string
  /** Optional client version string. */
  version?: string
  /** Extra metadata sent in `context`. */
  context?: Record<string, string>
  /** Default selected category (`'bug'` by default). */
  defaultKind?: UserFeedbackKind
  /** Optional custom submit handler overriding `reportFeedback`. */
  onSubmit?: (payload: FeedbackPayload) => Promise<FeedbackResult>
  /** Called after a submission succeeds. */
  onSubmitted?: (result: FeedbackResult) => void
}

export function FeedbackDialog({
  open,
  onOpenChange,
  apiBase = DEFAULT_FEEDBACK_API,
  token,
  app,
  user,
  email: initialEmail = '',
  page,
  version,
  context,
  defaultKind = 'bug',
  onSubmit,
  onSubmitted,
}: FeedbackDialogProps) {
  const { t } = useI18n()
  const [kind, setKind] = useState<UserFeedbackKind>(defaultKind)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<FeedbackResult | null>(null)

  const resetForm = () => {
    setSubject('')
    setMessage('')
    setError('')
    setResult(null)
  }

  const handleClose = (next: boolean) => {
    if (!next && result) {
      resetForm()
    }
    onOpenChange(next)
  }

  const submit = async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      setError(t('Please enter a message before sending.'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload: FeedbackPayload = {
        kind,
        ...(subject.trim() ? { subject: subject.trim() } : {}),
        message: trimmed,
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(user ? { user } : {}),
        ...(app ? { app } : {}),
        ...(page ? { page } : {}),
        ...(version ? { version } : {}),
        ...(context ? { context } : {}),
      }
      const res = onSubmit
        ? await onSubmit(payload)
        : await reportFeedback(payload, { apiBase, token })
      setResult(res)
      onSubmitted?.(res)
    } catch (e: unknown) {
      setError(e instanceof Error && e.message ? e.message : t('Could not send feedback. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent {...slot('feedback-dialog')}>
        <DialogHeader>
          <DialogTitle>{t('Send feedback')}</DialogTitle>
          <DialogDescription>
            {t('Report a bug, billing question, or feature idea to the Hanzo team.')}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <YStack gap="$3" py="$2" {...slot('feedback-confirmation')}>
            <Text fontSize="$3" color="$ink" fontWeight="500">
              {t('Thanks — your report has been received.')}
            </Text>
            {result.id ? (
              <Text fontSize="$2" color="$soft" fontFamily="$mono">
                {t('Reference ID: {id}', { id: result.id })}
              </Text>
            ) : null}
            <DialogFooter>
              <Button size="sm" variant="default" onPress={resetForm}>
                {t('Send another')}
              </Button>
              <Button size="sm" variant="primary" onPress={() => handleClose(false)}>
                {t('Done')}
              </Button>
            </DialogFooter>
          </YStack>
        ) : (
          <YStack gap="$3" {...slot('feedback-form')}>
            <XStack gap="$1.5" flexWrap="wrap" role="radiogroup" aria-label={t('Category')}>
              {KINDS.map((k) => {
                const active = kind === k.value
                return (
                  <Button
                    key={k.value}
                    size="sm"
                    variant={active ? 'primary' : 'default'}
                    aria-pressed={active}
                    data-kind={k.value}
                    disabled={busy}
                    onPress={() => setKind(k.value)}
                  >
                    {t(k.label)}
                  </Button>
                )
              })}
            </XStack>

            <Input
              size="sm"
              aria-label={t('Subject')}
              placeholder={t('Short summary (optional)')}
              value={subject}
              onChangeText={setSubject}
              disabled={busy}
            />

            <Textarea
              size="sm"
              aria-label={t('Message')}
              placeholder={t('What happened or what would you like to see?')}
              value={message}
              onChangeText={(v: string) => {
                setMessage(v)
                if (error) setError('')
              }}
              disabled={busy}
            />

            <Input
              size="sm"
              type="email"
              aria-label={t('Email')}
              placeholder={t('Email for follow-up (optional)')}
              value={email}
              onChangeText={setEmail}
              disabled={busy}
            />

            {error ? (
              <Text role="alert" fontSize="$2" color="$bad">
                {error}
              </Text>
            ) : null}

            <DialogFooter>
              <Button size="sm" variant="ghost" disabled={busy} onPress={() => handleClose(false)}>
                {t('Cancel')}
              </Button>
              <Button size="sm" variant="primary" disabled={busy} onPress={() => void submit()}>
                {busy ? t('Sending…') : t('Send')}
              </Button>
            </DialogFooter>
          </YStack>
        )}
      </DialogContent>
    </Dialog>
  )
}

export interface FeedbackButtonProps extends Omit<FeedbackDialogProps, 'open' | 'onOpenChange'> {
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

export function FeedbackButton({
  label,
  variant = 'ghost',
  size = 'sm',
  icon,
  ...dialogProps
}: FeedbackButtonProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        size={size}
        variant={variant}
        startIcon={icon ?? <MessageSquare size={14} />}
        data-slot="feedback-trigger"
        onPress={() => setOpen(true)}
      >
        {label ?? t('Feedback')}
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} {...dialogProps} />
    </>
  )
}
