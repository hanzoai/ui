'use client'

/**
 * MediaGrid — the DAM (media library) for a media DocType (an Attach-backed
 * collection). A REAL asset manager: drag/drop or pick files → they upload through
 * the injected `MediaUploader` (the host's own per-org object store) → a document
 * is created from the DocType's OWN schema → the grid shows a live thumbnail
 * (presigned on view, since object URLs are short-lived). Delete removes the
 * document AND the object.
 *
 * The document body is `mediaDocPayload(dt, facts)` — metadata-driven. This used
 * to write a hardcoded `{title, file, mime, size, width, height}`, which is the
 * CMS Media fixture's schema: a lane whose media type labels its rows `caption`
 * got untitled rows, silently, because the engine drops unknown keys. Now the
 * filename lands on the DocType's declared title field and each fact is written
 * only if that DocType has somewhere to put it.
 *
 * MOBILE FIRST: tiles are flex-basis, not a fixed 200px — two-up on a phone,
 * filling whatever the box gives on a desktop. The upload control is a full-width
 * tap target on a phone, and the per-tile delete is a 44px control rather than a
 * 13px glyph.
 *
 * Web-first by nature (file picker + drag/drop + `<img>` thumbnails), like the
 * other file-touching components in this layer.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, Card, Text, XStack, YStack } from '@hanzo/gui'
import { Image as ImageIcon, Trash2, Upload } from '@hanzogui/lucide-icons-2'

import { EmptyState } from '../product/EmptyState'
import { classifyBackend } from '../product/BackendState'
import type { FrameworkClient } from './client'
import type { DocType, FrameworkDoc } from './types'
import { mediaDocPayload, mediaFileField, titleOf } from './fields'
import { looksLikeImage, type MediaUploader } from './media'
import { Action, ErrorBar, Meta } from './parts'
import { useContainerLayout, TAP } from './responsive'

export interface MediaGridProps {
  client: FrameworkClient
  dt: DocType
  docs: FrameworkDoc[]
  /** The host's object store, bound to this lane's bucket. */
  media: MediaUploader
  /** Open a media document's detail (edit alt text, replace, etc.). */
  onOpen: (name: string) => void
  /** Re-fetch the media list after an upload/delete. */
  onChanged: () => void
  toolbarExtra?: ReactNode
  /** Accepted file types for the picker. */
  accept?: string
}

export function MediaGrid({
  client,
  dt,
  docs,
  media,
  onOpen,
  onChanged,
  toolbarExtra,
  accept = 'image/*,application/pdf,video/*,audio/*',
}: MediaGridProps) {
  const fileField = mediaFileField(dt)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { phone, onLayout } = useContainerLayout()

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      if (list.length === 0) return
      setBusy(true)
      setError(null)
      setProgress({ done: 0, total: list.length })
      try {
        for (let i = 0; i < list.length; i += 1) {
          const facts = await media.upload(list[i])
          await client.records.create(dt.name, mediaDocPayload(dt, facts))
          setProgress({ done: i + 1, total: list.length })
        }
        onChanged()
      } catch (e) {
        setError(classifyBackend(e).message)
      } finally {
        setBusy(false)
        setProgress(null)
      }
    },
    [client, dt, media, onChanged],
  )

  const pick = () => inputRef.current?.click()
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void upload(e.target.files)
    e.target.value = '' // allow re-selecting the same file
  }

  const HiddenInput = (
    <input ref={inputRef} type="file" multiple accept={accept} style={{ display: 'none' }} onChange={onInput} />
  )

  const uploadLabel = busy ? (progress ? `Uploading ${progress.done}/${progress.total}…` : 'Uploading…') : 'Upload'

  if (docs.length === 0) {
    return (
      <YStack onLayout={onLayout} gap="$3" width="100%">
        {HiddenInput}
        {toolbarExtra ? (
          <XStack justify={phone ? 'flex-start' : 'flex-end'} gap="$2" width="100%">
            {toolbarExtra}
          </XStack>
        ) : null}
        {error ? <ErrorBar message={error} /> : null}
        <DropZone busy={busy} onDrop={upload}>
          <EmptyState
            icon={ImageIcon}
            title="No media yet"
            description="Drag files here, or upload — images and files go to your organization's object storage and become reusable media you can attach to any record."
            primary={{ label: uploadLabel, onPress: pick }}
          />
        </DropZone>
      </YStack>
    )
  }

  return (
    <YStack onLayout={onLayout} gap="$3" width="100%">
      {HiddenInput}
      <XStack gap="$2" items="center" flexWrap="wrap" justify={phone ? 'flex-start' : 'flex-end'} width="100%">
        {toolbarExtra}
        <Action phone={phone} primary icon={<Upload size={15} />} disabled={busy} onPress={pick}>
          {uploadLabel}
        </Action>
      </XStack>
      {error ? <ErrorBar message={error} /> : null}
      <DropZone busy={busy} onDrop={upload}>
        <XStack gap="$3" flexWrap="wrap" width="100%">
          {docs.map((d) => (
            <MediaCard
              key={String(d.name)}
              doc={d}
              dt={dt}
              fileField={fileField}
              media={media}
              phone={phone}
              onOpen={() => onOpen(String(d.name))}
              onDelete={async () => {
                setBusy(true)
                setError(null)
                try {
                  await media.remove(d[fileField])
                  await client.records.remove(dt.name, String(d.name))
                  onChanged()
                } catch (e) {
                  setError(classifyBackend(e).message)
                } finally {
                  setBusy(false)
                }
              }}
              disabled={busy}
            />
          ))}
        </XStack>
      </DropZone>
    </YStack>
  )
}

/** One asset card — presigned thumbnail, title, type, and a delete affordance. */
function MediaCard({
  doc,
  dt,
  fileField,
  media,
  phone,
  onOpen,
  onDelete,
  disabled,
}: {
  doc: FrameworkDoc
  dt: DocType
  fileField: string
  media: MediaUploader
  phone: boolean
  onOpen: () => void
  onDelete: () => void | Promise<void>
  disabled?: boolean
}) {
  const [url, setUrl] = useState('')
  const [confirming, setConfirming] = useState(false)
  const raw = String(doc[fileField] ?? '')
  const title = titleOf(doc, dt)

  useEffect(() => {
    let cancelled = false
    void media.resolveUrl(raw).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [raw, media])

  return (
    <YStack
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$4"
      // Two-up on a phone, a 200px tile once there is room — never a fixed column
      // with dead space beside it.
      grow={0}
      flexBasis={phone ? '47%' : 200}
      maxW={phone ? undefined : 200}
      minW={140}
      overflow="hidden"
      hoverStyle={{ borderColor: '$color8' }}
    >
      <YStack
        height={phone ? 110 : 130}
        bg="$color3"
        items="center"
        justify="center"
        overflow="hidden"
        cursor="pointer"
        pressStyle={{ opacity: 0.8 }}
        onPress={onOpen}
      >
        {url && (looksLikeImage(raw) || looksLikeImage(url)) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={String(doc.alt ?? title)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ImageIcon size={28} />
        )}
      </YStack>
      <YStack p="$3" gap="$1">
        <Text fontSize="$3" fontWeight="700" numberOfLines={1}>
          {title}
        </Text>
        <XStack justify="space-between" items="center" gap="$2">
          <Meta>{String(doc.mime ?? 'file')}</Meta>
          {confirming ? (
            <XStack gap="$1">
              <Button
                size={phone ? '$3' : '$1'}
                minH={phone ? TAP : undefined}
                theme="red"
                disabled={disabled}
                onPress={() => {
                  setConfirming(false)
                  void onDelete()
                }}
              >
                Delete
              </Button>
              <Button size={phone ? '$3' : '$1'} minH={phone ? TAP : undefined} disabled={disabled} onPress={() => setConfirming(false)}>
                No
              </Button>
            </XStack>
          ) : (
            <Button
              size={phone ? '$3' : '$1'}
              circular
              chromeless
              minW={phone ? TAP : undefined}
              minH={phone ? TAP : undefined}
              aria-label={`Delete ${title}`}
              icon={<Trash2 size={phone ? 16 : 13} />}
              disabled={disabled}
              onPress={() => setConfirming(true)}
            />
          )}
        </XStack>
      </YStack>
    </YStack>
  )
}

/** A drag-and-drop wrapper that highlights on drag-over and uploads on drop. */
function DropZone({
  children,
  busy,
  onDrop,
}: {
  children: ReactNode
  busy?: boolean
  onDrop: (files: FileList) => void | Promise<void>
}) {
  const [over, setOver] = useState(false)
  return (
    <YStack
      width="100%"
      onDragOver={(e: React.DragEvent) => {
        e.preventDefault()
        if (!busy) setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: React.DragEvent) => {
        e.preventDefault()
        setOver(false)
        if (!busy && e.dataTransfer?.files?.length) void onDrop(e.dataTransfer.files)
      }}
      rounded="$4"
      p={over ? '$3' : 0}
      borderWidth={over ? 2 : 0}
      borderColor="$color8"
      style={{ borderStyle: 'dashed' }}
    >
      {children}
    </YStack>
  )
}
