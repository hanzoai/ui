'use client'

/**
 * Dropzone — a region that accepts files by drag-and-drop or by a click that
 * opens the browser's file picker, and lists what it is holding underneath.
 *
 * File drag-and-drop is a DOM concept (`DataTransfer`, `<input type="file">`),
 * so the frame reads `isWeb` from `@hanzo/gui` and no-ops the drag handlers
 * off the web: the click-to-browse input still renders everywhere, only the
 * drag affordance is web-only. State is a plain `useState` list of `File`,
 * accepted or rejected against `accept`/`maxFiles`/`maxSize`.
 */
import { SizableText, XStack, YStack, isWeb, styled } from '@hanzo/gui'
import { File as FileIcon, Upload, X } from '@hanzogui/lucide-icons-2'
import { useId, useRef, useState, type DragEvent as ReactDragEvent, type KeyboardEvent } from 'react'
import { ink } from './ink'
import { slot } from './slot'
import { sx } from '../../sx'
import { touch } from './gesture'

/** Enter/Space activate a `role="button"` frame the way a native button would. */
const asButton = (onActivate: () => void) => ({
  role: 'button' as const,
  tabIndex: 0,
  onPress: onActivate,
  onKeyDown: (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onActivate()
  },
})

export type DropzoneAccept = Record<string, string[]>

export type DropzoneProps = {
  className?: string
  onFilesAccepted?: (files: File[]) => void
  onFilesRejected?: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  accept?: DropzoneAccept
  disabled?: boolean
}

const REMOVE_SIZE = 24

const Frame = styled(YStack, {
  name: 'Dropzone',
  cursor: 'pointer',
  items: 'center',
  justify: 'center',
  gap: '$2',
  rounded: '$4',
  borderWidth: 2,
  borderStyle: 'dashed',
  borderColor: '$borderColor',
  p: '$8',

  variants: {
    active: {
      true: { borderColor: '$ink', bg: '$hover' },
    },
    disabled: {
      true: { cursor: 'default', opacity: 0.5 },
    },
  } as const,

  hoverStyle: { borderColor: '$rim' },

  defaultVariants: { active: false, disabled: false },
})

/** `{"image/*": [".png"]}` → an `accept` attribute value the file input reads. */
const acceptAttr = (accept: DropzoneAccept) =>
  Object.entries(accept)
    .flatMap(([mime, extensions]) => [mime, ...extensions])
    .join(',')

/** A file matches `accept` on its MIME type, a MIME wildcard, or its extension. */
const matches = (file: File, accept: DropzoneAccept) =>
  Object.entries(accept).some(([mime, extensions]) => {
    if (mime.endsWith('/*') && file.type.startsWith(mime.slice(0, -1))) return true
    if (mime === file.type) return true
    return extensions.some((ext) => file.name.toLowerCase().endsWith(ext.toLowerCase()))
  })

const sortFiles = (
  incoming: File[],
  accept: DropzoneAccept | undefined,
  maxSize: number,
) => {
  const accepted: File[] = []
  const rejected: File[] = []
  for (const file of incoming) {
    const sized = file.size <= maxSize
    const typed = !accept || Object.keys(accept).length === 0 || matches(file, accept)
    ;(sized && typed ? accepted : rejected).push(file)
  }
  return { accepted, rejected }
}

const formatSize = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`

export function Dropzone({
  className,
  onFilesAccepted,
  onFilesRejected,
  maxFiles = 5,
  maxSize = 5242880,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
  },
  disabled = false,
  ...props
}: DropzoneProps) {
  const [files, setFiles] = useState<File[]>([])
  const [active, setActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const take = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return
    const { accepted, rejected } = sortFiles(incoming, accept, maxSize)
    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted].slice(0, maxFiles))
      onFilesAccepted?.(accepted)
    }
    if (rejected.length > 0) onFilesRejected?.(rejected)
  }

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const onDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setActive(false)
    if (disabled) return
    take([...event.dataTransfer.files])
  }

  return (
    <YStack {...slot('dropzone')} width="100%" {...sx(className)} {...(props as object)}>
      <Frame
        {...slot('dropzone-region')}
        data-state={active ? 'active' : 'idle'}
        data-disabled={disabled || undefined}
        active={active}
        disabled={disabled}
        aria-disabled={disabled}
        {...asButton(() => !disabled && inputRef.current?.click())}
        {...(isWeb
          ? {
              onDragEnter: (event: ReactDragEvent<HTMLDivElement>) => {
                event.preventDefault()
                if (!disabled) setActive(true)
              },
              onDragOver: (event: ReactDragEvent<HTMLDivElement>) => {
                event.preventDefault()
              },
              onDragLeave: (event: ReactDragEvent<HTMLDivElement>) => {
                event.preventDefault()
                setActive(false)
              },
              onDrop,
            }
          : null)}
      >
        <input
          {...slot('dropzone-input')}
          ref={inputRef}
          id={inputId}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptAttr(accept)}
          disabled={disabled}
          style={{ display: 'none' }}
          onChange={(event) => {
            take([...(event.target.files ?? [])])
            event.target.value = ''
          }}
        />
        <Upload size={32} color="$quiet" />
        <YStack gap="$1" items="center">
          {ink(active ? 'Drop files here' : 'Drag & drop files here', SizableText, {
            fontWeight: '500',
          })}
          {ink(
            `or click to browse (max ${maxFiles} files, ${Math.round(maxSize / 1024 / 1024)}MB each)`,
            SizableText,
            { fontSize: '$1', color: '$quiet' },
          )}
        </YStack>
      </Frame>

      {files.length > 0 && (
        <YStack {...slot('dropzone-list')} gap="$2" mt="$4">
          {files.map((file, index) => (
            <XStack
              {...slot('dropzone-item')}
              key={`${file.name}-${file.lastModified}-${index}`}
              items="center"
              gap="$2"
              rounded="$3"
              borderWidth={1}
              borderColor="$borderColor"
              p="$2"
            >
              <FileIcon size={16} color="$quiet" />
              {ink(file.name, SizableText, {
                flex: 1,
                fontSize: '$2',
                numberOfLines: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              })}
              {ink(formatSize(file.size), SizableText, { fontSize: '$1', color: '$quiet' })}
              <XStack
                {...slot('dropzone-item-remove')}
                aria-label={`Remove ${file.name}`}
                items="center"
                justify="center"
                rounded="$2"
                p="$1"
                cursor="pointer"
                hoverStyle={{ bg: '$hover' }}
                {...asButton(() => removeFile(index))}
                {...touch(REMOVE_SIZE, 44, 'both')}
              >
                <X size={16} />
              </XStack>
            </XStack>
          ))}
        </YStack>
      )}
    </YStack>
  )
}
