import { describe, it, expect } from 'vitest'
import {
  createMediaUploader,
  isRef,
  joinKey,
  looksLikeImage,
  mediaKey,
  mediaRef,
  parseRef,
  type MediaStore,
} from './media'

const BUCKET = 'cms-media'

describe('media — pure key/reference helpers', () => {
  it('mediaRef / isRef / parseRef round-trip a key', () => {
    const ref = mediaRef(BUCKET, 'photos/cat.png')
    expect(ref).toBe(`s3://${BUCKET}/photos/cat.png`)
    expect(isRef(ref)).toBe(true)
    expect(parseRef(ref)).toEqual({ bucket: BUCKET, key: 'photos/cat.png' })
  })

  it('isRef is false for a plain URL or non-string', () => {
    expect(isRef('https://cdn.example.com/x.png')).toBe(false)
    expect(isRef('')).toBe(false)
    expect(isRef(null)).toBe(false)
    expect(isRef(42)).toBe(false)
  })

  it('parseRef rejects a malformed ref', () => {
    expect(parseRef('not-a-ref')).toBeNull()
    expect(parseRef('s3://')).toBeNull()
    expect(parseRef('s3://bucketonly')).toBeNull()
  })

  it('mediaKey slugifies, keeps the extension, and is collision-resistant', () => {
    const a = mediaKey('My Photo!.PNG')
    const b = mediaKey('My Photo!.PNG')
    expect(a).toMatch(/^my-photo-[a-z0-9]+\.png$/)
    expect(a).not.toBe(b) // random suffix → no collision
    expect(mediaKey('résumé.pdf')).toMatch(/^resume-[a-z0-9]+\.pdf$/)
    expect(mediaKey('noext')).toMatch(/^noext-[a-z0-9]+$/)
  })

  it('mediaKey nests under a slugified folder', () => {
    expect(mediaKey('a.jpg', 'Blog Images')).toMatch(/^blog-images\/a-[a-z0-9]+\.jpg$/)
  })

  it('joinKey drops blank segments', () => {
    expect(joinKey('a', '', 'b')).toBe('a/b')
    expect(joinKey('', 'b')).toBe('b')
  })

  it('looksLikeImage reads the extension, not the bytes', () => {
    expect(looksLikeImage('x.png')).toBe(true)
    expect(looksLikeImage('x.JPEG?sig=1')).toBe(true)
    expect(looksLikeImage('data:image/png;base64,AAA')).toBe(true)
    expect(looksLikeImage('x.pdf')).toBe(false)
  })
})

/** A store that records what the uploader asked it to do. */
function fakeStore(over: Partial<MediaStore> = {}) {
  const calls: string[] = []
  const store: MediaStore = {
    ensureBucket: async (b) => {
      calls.push(`ensureBucket:${b}`)
    },
    presignUpload: async (b, k) => {
      calls.push(`presignUpload:${b}/${k}`)
      return { url: `https://s3.test/${b}/${k}?sig=put`, method: 'PUT' }
    },
    presignDownload: async (b, k) => {
      calls.push(`presignDownload:${b}/${k}`)
      return { url: `https://s3.test/${b}/${k}?sig=get` }
    },
    deleteObject: async (b, k) => {
      calls.push(`deleteObject:${b}/${k}`)
    },
    put: async (url) => {
      calls.push(`put:${url}`)
    },
    ...over,
  }
  return { store, calls }
}

/** A minimal File stand-in — node has no DOM File in this env. */
const file = (name: string, type = 'image/png', size = 10): File =>
  ({ name, type, size }) as unknown as File

describe('createMediaUploader — the bucket is a PARAMETER, not a CMS constant', () => {
  it('uploads to the bucket it was given (ERP files never land in cms-media)', async () => {
    const { store, calls } = fakeStore()
    const up = createMediaUploader(store, 'erp-attachments')
    const facts = await up.upload(file('Invoice 12.pdf', 'application/pdf', 42))

    expect(up.bucket).toBe('erp-attachments')
    expect(calls[0]).toBe('ensureBucket:erp-attachments')
    expect(calls[1]).toMatch(/^presignUpload:erp-attachments\/invoice-12-[a-z0-9]+\.pdf$/)
    expect(calls[2]).toMatch(/^put:https:\/\/s3\.test\/erp-attachments\//)
    expect(facts.fileRef).toMatch(/^s3:\/\/erp-attachments\/invoice-12-[a-z0-9]+\.pdf$/)
    expect(facts).toMatchObject({ filename: 'Invoice 12.pdf', mime: 'application/pdf', size: 42 })
    // No DOM Image in node → honest 0×0 rather than a fabricated dimension.
    expect(facts.width).toBe(0)
    expect(facts.height).toBe(0)
  })

  it('throws honestly when object storage is not configured (never a silent partial)', async () => {
    const { store } = fakeStore({ presignUpload: async () => null })
    const up = createMediaUploader(store, 'b')
    await expect(up.upload(file('a.png'))).rejects.toThrow(/object storage not configured/i)
  })

  it('refuses a presign that is not signed for PUT', async () => {
    const { store } = fakeStore({ presignUpload: async () => ({ url: 'https://s3.test/x', method: 'POST' }) })
    await expect(createMediaUploader(store, 'b').upload(file('a.png'))).rejects.toThrow()
  })

  it('resolveUrl presigns a stored ref FRESH and passes a plain URL through', async () => {
    const { store, calls } = fakeStore()
    const up = createMediaUploader(store, BUCKET)
    expect(await up.resolveUrl(mediaRef(BUCKET, 'cat.png'))).toBe(`https://s3.test/${BUCKET}/cat.png?sig=get`)
    expect(calls).toContain(`presignDownload:${BUCKET}/cat.png`)
    // A hand-typed absolute URL is returned as-is — no presign attempted.
    expect(await up.resolveUrl('https://cdn.example.com/x.png')).toBe('https://cdn.example.com/x.png')
    expect(await up.resolveUrl('')).toBe('')
    expect(await up.resolveUrl(null)).toBe('')
  })

  it('resolveUrl returns "" when the presign fails — the grid shows a glyph, not a broken img', async () => {
    const { store } = fakeStore({
      presignDownload: async () => {
        throw new Error('403')
      },
    })
    expect(await createMediaUploader(store, BUCKET).resolveUrl(mediaRef(BUCKET, 'cat.png'))).toBe('')
  })

  it('remove deletes the object behind a ref and is a no-op for a plain URL', async () => {
    const { store, calls } = fakeStore()
    const up = createMediaUploader(store, BUCKET)
    await up.remove(mediaRef(BUCKET, 'cat.png'))
    expect(calls).toContain(`deleteObject:${BUCKET}/cat.png`)
    const before = calls.length
    await up.remove('https://cdn.example.com/x.png')
    await up.remove(null)
    expect(calls.length).toBe(before)
  })
})
