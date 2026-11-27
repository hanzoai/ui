'use client'

/**
 * Twenty-style Attachments panel for a CRM record page.
 *
 * Uses the Base `attachments` collection (`name`, `file`, `category`, linked to
 * `person` | `company` | `opportunity` | `candidate` | `note` | `task`):
 * list attachments, upload a local file or link URL, open/download, delete.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Input, Text, XStack, YStack } from '@hanzo/gui'
import { Card } from '@hanzo/ui'
import { Download, FileText, Paperclip, Trash2, Upload } from '@hanzogui/lucide-icons-2'

import { CrmApi, type AttachmentCategory, type AttachmentRecord } from '../lib/crm'
import { useChanges } from '../lib/live'
import { words } from './schema'
import { attachmentTargetFor } from './twenty-logic'

export { attachmentTargetFor }

const CATEGORIES: AttachmentCategory[] = ['document', 'contract', 'deck', 'invoice', 'image', 'other']

const MAX_INLINE_BYTES = 1_500_000

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsDataURL(file)
  })
}

export function AttachmentsSection({ collection, id }: { collection: string; id: string }) {
  const target = attachmentTargetFor(collection, id)
  const [items, setItems] = useState<AttachmentRecord[] | null>(null)
  const [category, setCategory] = useState<AttachmentCategory>('document')
  const [linkMode, setLinkMode] = useState(false)
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useChanges(['attachments'], () => setRound((r) => r + 1))

  const load = useCallback(() => {
    if (!target) return
    let live = true
    CrmApi.attachments
      .list(target)
      .then((rows) => live && (setItems(rows), setError(null)))
      .catch((e) => live && setError(words(e, 'Attachments could not be loaded.')))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, id, round])

  useEffect(() => load(), [load])

  if (!target) return null

  const uploadFile = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const fileRef =
        file.size <= MAX_INLINE_BYTES
          ? await readFileAsDataUrl(file)
          : file.name
      await CrmApi.attachments.upload(target, {
        name: file.name,
        file: fileRef,
        category,
        size: file.size,
        mimeType: file.type || undefined,
      })
      setRound((r) => r + 1)
    } catch (e) {
      setError(words(e, 'Upload failed.'))
    } finally {
      setBusy(false)
    }
  }

  const addLink = async () => {
    const url = linkUrl.trim()
    if (!url) return setError('Enter a file URL.')
    setBusy(true)
    setError(null)
    try {
      await CrmApi.attachments.upload(target, {
        name: linkName.trim() || url.split('/').pop() || 'Attachment',
        file: url,
        category,
      })
      setLinkName('')
      setLinkUrl('')
      setLinkMode(false)
      setRound((r) => r + 1)
    } catch (e) {
      setError(words(e, 'Could not save attachment.'))
    } finally {
      setBusy(false)
    }
  }

  const openAttachment = async (item: AttachmentRecord) => {
    try {
      if (!item.file) return
      if (CrmApi.isUpload(item.file)) {
        const signed = await CrmApi.download(item.file)
        if (signed) window.open(signed, '_blank', 'noopener,noreferrer')
        return
      }
      if (item.file.startsWith('data:')) {
        const a = document.createElement('a')
        a.href = item.file
        a.download = item.name
        document.body.appendChild(a)
        a.click()
        a.remove()
        return
      }
      if (/^https?:\/\//i.test(item.file)) {
        window.open(item.file, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      setError(words(e, 'Could not open attachment.'))
    }
  }

  const removeAttachment = async (item: AttachmentRecord) => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${item.name}"?`)) return
    setBusy(true)
    setError(null)
    try {
      await CrmApi.attachments.remove(item.id)
      setRound((r) => r + 1)
    } catch (e) {
      setError(words(e, 'Could not delete attachment.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card p="$3" borderWidth={1} borderColor="$borderColor" gap="$2.5" data-slot="crm-attachments">
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
        <XStack items="center" gap="$1.5">
          <Paperclip size={14} color="$color10" />
          <Text fontSize="$3" fontWeight="700" color="$color12">
            Attachments
          </Text>
          {items ? (
            <Text fontSize="$1" color="$color10">
              {items.length}
            </Text>
          ) : null}
        </XStack>

        <XStack items="center" gap="$1.5" flexWrap="wrap">
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void uploadFile(f)
              e.target.value = ''
            }}
          />
          <Button
            size="$2"
            bg="$color2"
            borderWidth={1}
            borderColor="$borderColor"
            disabled={busy}
            onPress={() => fileInputRef.current?.click()}
            data-slot="crm-attachment-upload"
          >
            <XStack items="center" gap="$1">
              <Upload size={13} color="$color11" />
              <Text fontSize="$2" color="$color12">
                {busy ? 'Uploading…' : 'Upload file'}
              </Text>
            </XStack>
          </Button>
          <Button
            size="$2"
            chromeless
            disabled={busy}
            onPress={() => setLinkMode((v) => !v)}
          >
            {linkMode ? 'Cancel link' : 'Add URL'}
          </Button>
        </XStack>
      </XStack>

      <XStack gap="$1.5" flexWrap="wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="$1"
            px="$2"
            py="$1"
            rounded="$4"
            bg={category === cat ? '$color4' : '$color2'}
            borderWidth={1}
            borderColor={category === cat ? '$color8' : '$borderColor'}
            onPress={() => setCategory(cat)}
          >
            <Text fontSize="$1" color={category === cat ? '$color12' : '$color10'}>
              {cat}
            </Text>
          </Button>
        ))}
      </XStack>

      {linkMode ? (
        <YStack gap="$2" p="$2.5" bg="$color2" rounded="$2" borderWidth={1} borderColor="$borderColor">
          <Input size="$3" value={linkName} onChangeText={setLinkName} placeholder="Display name (e.g. Series A Deck.pdf)" />
          <Input size="$3" value={linkUrl} onChangeText={setLinkUrl} placeholder="https://…" />
          <XStack>
            <Button size="$2" theme="blue" disabled={busy} onPress={() => void addLink()}>
              Save link
            </Button>
          </XStack>
        </YStack>
      ) : null}

      {error ? (
        <Text fontSize="$2" color="$red10">
          {error}
        </Text>
      ) : null}

      {items === null ? (
        <Text fontSize="$2" color="$color10">
          Loading attachments…
        </Text>
      ) : items.length === 0 ? (
        <Text fontSize="$2" color="$color10">
          No files attached yet. Upload contracts, decks, or notes.
        </Text>
      ) : (
        <YStack gap="$1.5">
          {items.map((item) => (
            <XStack
              key={item.id}
              items="center"
              justify="space-between"
              gap="$2"
              p="$2"
              bg="$color2"
              rounded="$2"
              borderWidth={1}
              borderColor="$borderColor"
              data-slot="crm-attachment-row"
            >
              <XStack items="center" gap="$2" flex={1} minW={0}>
                <FileText size={15} color="$color10" />
                <YStack flex={1} minW={0}>
                  <Text fontSize="$2" fontWeight="600" color="$color12" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text fontSize="$1" color="$color10" numberOfLines={1}>
                    {[item.category, item.created ? item.created.slice(0, 10) : ''].filter(Boolean).join(' · ')}
                  </Text>
                </YStack>
              </XStack>
              <XStack items="center" gap="$1" shrink={0}>
                <Button size="$2" chromeless px="$1.5" onPress={() => void openAttachment(item)} aria-label={`Download ${item.name}`}>
                  <Download size={14} color="$color11" />
                </Button>
                <Button size="$2" chromeless px="$1.5" onPress={() => void removeAttachment(item)} aria-label={`Delete ${item.name}`}>
                  <Trash2 size={14} color="$red10" />
                </Button>
              </XStack>
            </XStack>
          ))}
        </YStack>
      )}
    </Card>
  )
}
