'use client'

/**
 * PostComposer — compose one post: body, network, and the intent (save a draft,
 * schedule it, or publish now). Owns the form state, the validation, and the ONE
 * mapping from an intent to the (status, scheduleAt) the backend stores; the host
 * owns persistence. Extracted from Hanzo Social (social.hanzo.ai).
 */
import { useState } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { AlertTriangle } from '@hanzogui/lucide-icons-2'
import { FieldRow, FieldSelect, FieldText, FieldTextArea } from '../Field'
import { PrimaryButton } from '../PrimaryButton'
import { parsePostTime } from './format'
import type { ProviderCapability } from './api'

/** Compose intents → the (status, scheduleAt) the backend stores. */
export const COMPOSE_MODES = ['draft', 'schedule', 'now'] as const
export type ComposeMode = (typeof COMPOSE_MODES)[number]
const COMPOSE_LABEL: Record<ComposeMode, string> = {
  draft: 'Save draft',
  schedule: 'Schedule',
  now: 'Publish now',
}

/** The writable fields of a new post — what the intent above encodes. */
export type PostDraft = {
  content: string
  channel: string
  status: string
  /** unix seconds; 0 = not scheduled / publish now */
  scheduleAt: number
}

export function PostComposer({
  channels,
  providers,
  onSubmit,
}: {
  /** The networks offered, in order; the first is the default. */
  channels: string[]
  /** Live publish-readiness, used to warn before a publish that cannot succeed. */
  providers: ProviderCapability[]
  /**
   * Persist the draft. Resolve `null` when it landed — the host then swaps this
   * panel out — or a message to surface, which keeps the panel open and editable.
   * Total by contract: the host classifies its own failures rather than throwing.
   */
  onSubmit: (draft: PostDraft, mode: ComposeMode) => Promise<string | null>
}) {
  const [content, setContent] = useState('')
  const [channel, setChannel] = useState<string>(channels[0] ?? 'x')
  const [mode, setMode] = useState<ComposeMode>('draft')
  const [scheduleAt, setScheduleAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cap = providers.find((p) => p.provider === channel)
  const unconfigured = (mode === 'now' || mode === 'schedule') && !!cap && !cap.credentialsConfigured

  const submit = async () => {
    if (!content.trim()) {
      setError('Content is required.')
      return
    }
    let status = 'draft'
    let at = 0
    if (mode === 'schedule') {
      at = parsePostTime(scheduleAt)
      if (at <= Math.floor(Date.now() / 1000)) {
        setError('Pick a future date and time to schedule.')
        return
      }
      status = 'scheduled'
    } else if (mode === 'now') {
      status = 'scheduled' // scheduled + scheduleAt 0 ⇒ the backend publishes on create
    }
    setSaving(true)
    setError(null)
    const message = await onSubmit({ content: content.trim(), channel, status, scheduleAt: at }, mode)
    // On success the host unmounts this panel, so `saving` deliberately stays set —
    // the button never flickers back to enabled on the way out.
    if (message) {
      setError(message)
      setSaving(false)
    }
  }

  return (
    <YStack gap="$3" p="$4">
      <FieldRow label="Content">
        <FieldTextArea value={content} onChange={setContent} disabled={saving} />
      </FieldRow>
      <FieldRow label="Channel">
        <FieldSelect value={channel} options={channels} onChange={setChannel} disabled={saving} />
      </FieldRow>
      <FieldRow label="When">
        <FieldSelect
          value={mode}
          options={[...COMPOSE_MODES]}
          onChange={(v) => setMode(v as ComposeMode)}
          disabled={saving}
        />
      </FieldRow>
      {mode === 'schedule' ? (
        <FieldRow label="Schedule at">
          <FieldText
            value={scheduleAt}
            onChange={setScheduleAt}
            placeholder="2026-07-15 09:00"
            disabled={saving}
          />
        </FieldRow>
      ) : null}
      {unconfigured ? (
        <XStack items="flex-start" gap="$2">
          <AlertTriangle size={14} color="var(--yellow10)" />
          <Text fontSize="$1" color="$color10">
            {channel} isn’t configured to publish yet — needs {cap?.missingCredentials.join(', ')}. The post is saved and
            marked failed on publish until credentials are supplied.
          </Text>
        </XStack>
      ) : null}
      {error ? (
        <Text fontSize="$2" color="$red10">
          {error}
        </Text>
      ) : null}
      <PrimaryButton onPress={submit} disabled={saving}>
        {saving ? 'Working…' : COMPOSE_LABEL[mode]}
      </PrimaryButton>
    </YStack>
  )
}
