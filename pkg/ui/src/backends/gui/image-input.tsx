'use client'

/**
 * ImageInput — one picture with upload, remove and abort: a profile photo, a
 * workspace logo, a record's own image.
 *
 * The square preview is the control: pressing it opens the file picker, and on
 * the web a file dropped on it is taken the same way. Beside it, Upload (or
 * Abort while `isUploading`) and Remove, a helper line and an error line. The
 * host owns the upload: `onChange` hands it the chosen file, `onAbort` asks it
 * to stop, `onRemove` to clear; the preview shows whatever `src` it is given.
 *
 * Anatomy after twenty-ui's ImageInput (MIT, NOTICE): a 66px preview with an 8px
 * corner and a 20px image-up glyph, a column 16px beside it with 12px between
 * its rows, outline buttons with 14px icons.
 */
import { Image, SizableText, XStack, YStack, isWeb } from '@hanzo/gui'
import { ImageUp, Trash2, Upload, X } from '@hanzogui/lucide-icons-2'
import { useId, useRef, useState } from 'react'
import { Button } from './button'
import { RING } from './press'
import { slot } from './slot'

export type ImageInputProps = {
  /** The current picture, or none. */
  src?: string | null
  /** What the picture shows, for a reader who cannot see it. */
  alt?: string
  /** A file was chosen or dropped. */
  onChange?: (file: File) => void
  onRemove?: () => void
  onAbort?: () => void
  isUploading?: boolean
  /** The file input's `accept`; images by default. A dropped file must match it. */
  accept?: string
  /** `capture` for a phone's camera. */
  capture?: 'user' | 'environment'
  /** Names the control (and the hidden file input). */
  title?: string
  helperText?: string
  errorMessage?: string
  uploadLabel?: string
  removeLabel?: string
  abortLabel?: string
  disabled?: boolean
  required?: boolean
  name?: string
}

const SIZE = 66

/** A file matches `accept` on its MIME type, a MIME wildcard, or its extension. */
export const accepts = (file: { type: string; name: string }, accept: string) =>
  accept
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) =>
      a.startsWith('.')
        ? file.name.toLowerCase().endsWith(a)
        : a.endsWith('/*')
          ? file.type.toLowerCase().startsWith(a.slice(0, -1))
          : file.type.toLowerCase() === a,
    )

export function ImageInput({
  src,
  alt = '',
  onChange,
  onRemove,
  onAbort,
  isUploading = false,
  accept = 'image/*',
  capture,
  title = 'Picture',
  helperText,
  errorMessage,
  uploadLabel = 'Upload',
  removeLabel = 'Remove',
  abortLabel = 'Abort',
  disabled = false,
  required,
  name,
}: ImageInputProps) {
  const file = useRef<HTMLInputElement | null>(null)
  const id = useId()
  const [over, setOver] = useState(false)
  const pick = () => {
    if (disabled || isUploading) return
    file.current?.click()
  }
  const take = (f: File | undefined) => {
    if (f && accepts(f, accept)) onChange?.(f)
  }
  const drop = isWeb && !disabled && !isUploading
    ? {
        onDragOver: (e: DragEvent) => {
          e.preventDefault()
          setOver(true)
        },
        onDragLeave: () => setOver(false),
        onDrop: (e: DragEvent) => {
          e.preventDefault()
          setOver(false)
          take(e.dataTransfer?.files?.[0])
        },
      }
    : null

  return (
    <XStack {...slot('image-input')} items="flex-start" gap="$4">
      <XStack
        {...slot('image-input-preview')}
        render="button"
        {...({
          type: 'button',
          disabled: disabled || isUploading,
          'aria-label': src ? `${title}: change` : `${title}: ${uploadLabel}`,
          'aria-describedby': errorMessage || helperText ? id : undefined,
          ...drop,
        } as object)}
        width={SIZE}
        height={SIZE}
        shrink={0}
        rounded="$3"
        borderWidth={1}
        borderColor={over ? '$borderColorFocus' : '$borderColor'}
        bg={disabled ? '$panel' : '$hover'}
        overflow="hidden"
        items="center"
        justify="center"
        p={0}
        cursor={disabled ? 'not-allowed' : isUploading ? 'progress' : 'pointer'}
        // No hover tint over a picture: the picture is what is being shown.
        hoverStyle={src || disabled ? undefined : { bg: '$raised' }}
        focusVisibleStyle={RING}
        onPress={pick}
      >
        {src ? (
          <Image src={src} alt={alt} width={SIZE} height={SIZE} objectFit="cover" />
        ) : (
          <ImageUp size={20} color={over ? '$soft' : '$dim'} />
        )}
      </XStack>

      <YStack gap="$3" flex={1} minW={0}>
        <XStack gap="$2" items="center" flexWrap="wrap">
          {isUploading ? (
            <Button size="sm" variant="outline" startIcon={<X />} onPress={onAbort}>
              {abortLabel}
            </Button>
          ) : (
            <Button size="sm" variant="outline" startIcon={<Upload />} disabled={disabled} onPress={pick}>
              {uploadLabel}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            startIcon={<Trash2 />}
            disabled={disabled || isUploading || !src}
            onPress={onRemove}
          >
            {removeLabel}
          </Button>
        </XStack>
        {helperText || errorMessage ? (
          <YStack id={id} gap="$1">
            {helperText ? (
              <SizableText size="$1" color="$dim">
                {helperText}
              </SizableText>
            ) : null}
            {errorMessage ? (
              <SizableText size="$1" color="$bad" role="alert">
                {errorMessage}
              </SizableText>
            ) : null}
          </YStack>
        ) : null}
      </YStack>

      {/* The file picker the preview and Upload both open: a DOM control, so on
          the web only. Hidden, not absent: a form submitting `name` still
          carries the chosen file. */}
      {isWeb ? <input
        ref={file}
        type="file"
        accept={accept}
        capture={capture}
        name={name}
        required={required}
        disabled={disabled}
        aria-label={title}
        tabIndex={-1}
        style={{ display: 'none' }}
        onChange={(e) => {
          take(e.currentTarget.files?.[0])
          e.currentTarget.value = ''
        }}
      /> : null}
    </XStack>
  )
}
