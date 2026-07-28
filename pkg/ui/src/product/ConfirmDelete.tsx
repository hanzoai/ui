'use client'

/**
 * The console's ONE destructive-confirm panel, rendered inside a `SlideOver`.
 *
 * A delete is the only irreversible action a product module offers, so it gets a
 * single shared shape: the consequence stated in full, a red confirm, a cancel, and
 * an inline honest error (via `classifyBackend`) when the call fails — the panel
 * stays open on failure so the user sees WHY instead of a silently-closed drawer.
 */
import { useState } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Trash2 } from '@hanzogui/lucide-icons-2'

import { classifyBackend } from './BackendState'

export function ConfirmDelete({
  message,
  confirmLabel,
  run,
  onDone,
}: {
  /** The full consequence, stated plainly ("Delete X and all N of its records?"). */
  message: string
  confirmLabel: string
  run: () => Promise<void>
  /** Called on success AND on cancel — the caller closes the drawer and reloads. */
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const go = async () => {
    setBusy(true)
    setErr(null)
    try {
      await run()
      onDone()
    } catch (e) {
      setErr(classifyBackend(e).message || 'Failed to delete.')
      setBusy(false)
    }
  }

  return (
    <YStack gap="$3">
      <Text fontSize="$3" color="$color11">
        {message}
      </Text>
      {err ? (
        <Text fontSize="$2" color="$red10">
          {err}
        </Text>
      ) : null}
      <XStack gap="$2" flexWrap="wrap">
        <Button
          onPress={go}
          disabled={busy}
          icon={<Trash2 size={15} />}
          style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
        >
          {busy ? 'Deleting…' : confirmLabel}
        </Button>
        <Button chromeless onPress={() => onDone()} disabled={busy}>
          Cancel
        </Button>
      </XStack>
    </YStack>
  )
}
