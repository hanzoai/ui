/**
 * The DAM transport for a media DocType — as a PORT, not a binding. The library
 * knows the SHAPE of an object store (ensure a bucket, presign a PUT, presign a
 * GET, delete an object) and owns the key/reference grammar; the HOST supplies the
 * store. The console injects its org-scoped `/v1/s3` client (SeaweedFS); a native
 * app or a test injects something else. One media model, any storage.
 *
 * WHY STORE THE KEY, NOT A URL: a presigned object URL has a short TTL (the cloud
 * mints 5 minutes), and a stored presigned URL would break minutes later — fatal
 * for a media library whose references must persist. So the `file` field stores a
 * STABLE `s3://bucket/key` reference and every view resolves it to a fresh
 * presigned GET at render time. `isRef` keeps a legacy hand-typed absolute URL
 * working, so nothing that already exists breaks.
 */
import { slugify } from './fields'
import type { MediaFacts } from './fields'

/** A presigned request the host's object store minted. */
export interface Presigned {
  url: string
  /** HTTP method the URL is signed for (upload must be `PUT`). */
  method?: string
}

/** The object-store seam a host injects. Every call is per-org on the host side. */
export interface MediaStore {
  /** Idempotent — an "already exists" is success, not an error. */
  ensureBucket: (bucket: string) => Promise<void>
  presignUpload: (bucket: string, key: string) => Promise<Presigned | null>
  presignDownload: (bucket: string, key: string) => Promise<Presigned | null>
  deleteObject: (bucket: string, key: string) => Promise<void>
  /** Transfer the bytes to a presigned URL. */
  put: (url: string, file: File) => Promise<void>
}

/** The prefix that marks a media `file` value as an object-store key (not a raw URL). */
const REF_PREFIX = 's3://'

/** A bucket + stored object key → the `file`-field reference value. */
export function mediaRef(bucket: string, key: string): string {
  return `${REF_PREFIX}${bucket}/${key}`
}

/** True when a `file` value is an object reference (vs a hand-typed URL). */
export function isRef(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(REF_PREFIX)
}

/** Split an `s3://bucket/key` reference into its bucket + key. */
export function parseRef(ref: string): { bucket: string; key: string } | null {
  if (!ref.startsWith(REF_PREFIX)) return null
  const rest = ref.slice(REF_PREFIX.length)
  const slash = rest.indexOf('/')
  if (slash <= 0) return null
  return { bucket: rest.slice(0, slash), key: rest.slice(slash + 1) }
}

/** Join a folder prefix and a name into an object key (blank segments dropped). */
export function joinKey(...parts: string[]): string {
  return parts.filter(Boolean).join('/')
}

/** A safe, collision-resistant object key for an uploaded file (keeps the ext). */
export function mediaKey(filename: string, folder = ''): string {
  const dot = filename.lastIndexOf('.')
  const ext = dot > 0 ? filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const base = slugify(dot > 0 ? filename.slice(0, dot) : filename) || 'file'
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const name = ext ? `${base}-${stamp}.${ext}` : `${base}-${stamp}`
  return folder ? joinKey(slugify(folder), name) : name
}

/** True when a value looks like a renderable image (by extension / data URL). */
export function looksLikeImage(value: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(value) || value.startsWith('data:image/')
}

/** The three operations a media view needs, bound to one bucket. */
export interface MediaUploader {
  bucket: string
  /** Upload a file and return the facts a media document is built from. */
  upload: (file: File, folder?: string) => Promise<MediaFacts>
  /** A `file` value → a viewable URL ('' when it can't resolve — never a broken img). */
  resolveUrl: (value: unknown) => Promise<string>
  /** Delete the object behind a `file` value (a no-op for a plain URL). */
  remove: (value: unknown) => Promise<void>
}

/**
 * Bind the media operations to a host store + a bucket. The bucket is a PARAMETER
 * (not a constant named after one lane), so ERP attachments and Helpdesk files do
 * not land in a bucket called `cms-media`.
 */
export function createMediaUploader(store: MediaStore, bucket: string): MediaUploader {
  return {
    bucket,

    async upload(file, folder = '') {
      // 1) Ensure the per-org bucket. A create that fails because it already
      //    exists is expected on every upload after the first.
      await store.ensureBucket(bucket).catch(() => undefined)

      // 2) Presign a PUT for a stable key, then upload the bytes directly.
      const key = mediaKey(file.name, folder)
      const presigned = await store.presignUpload(bucket, key)
      if (!presigned || (presigned.method ?? 'PUT') !== 'PUT' || !presigned.url) {
        throw new Error('Could not start the upload (object storage not configured).')
      }
      await store.put(presigned.url, file)

      // 3) Intrinsic image dimensions (best-effort; 0×0 for non-images / failures).
      const { width, height } = await imageDimensions(file)

      return {
        fileRef: mediaRef(bucket, key),
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        width,
        height,
      }
    },

    async resolveUrl(value) {
      if (typeof value !== 'string' || value === '') return ''
      if (!isRef(value)) return value // a hand-typed absolute URL
      const parsed = parseRef(value)
      if (!parsed) return ''
      const presigned = await store.presignDownload(parsed.bucket, parsed.key).catch(() => null)
      return presigned?.url ?? ''
    },

    async remove(value) {
      if (!isRef(value)) return
      const parsed = parseRef(value)
      if (!parsed) return
      await store.deleteObject(parsed.bucket, parsed.key).catch(() => undefined)
    },
  }
}

/** Read an image file's intrinsic width/height in the browser (0×0 if not an image). */
export function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined' || !file.type.startsWith('image/')) {
      resolve({ width: 0, height: 0 })
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}
