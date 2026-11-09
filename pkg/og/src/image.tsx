/**
 * An image drawn from JSX, as a PNG Response: what an opengraph-image file's
 * default export returns. The layout is satori's (flexbox, inline styles), the
 * raster resvg's. With no fonts given it sets the text in Zen, from @hanzo/font.
 *
 * satori is pinned at 0.12.2, the layout every image here was drawn against:
 * later releases size a root's `width: 100%` without its padding, so a card with
 * padding outgrows its canvas and its last row is cut off.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import type { ReactElement } from 'react'
import satori from 'satori'

export interface Font {
  name: string
  data: ArrayBuffer | Uint8Array
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  style?: 'normal' | 'italic'
}

export interface ImageOptions {
  width?: number
  height?: number
  fonts?: Font[]
  headers?: Record<string, string>
  status?: number
}

/**
 * This package's own dependencies, at run time. A site's build bundles this
 * file, after which it no longer knows where it was installed, and resvg is a
 * native addon no bundler can carry; so both resvg and the Zen faces are found
 * from where the site resolves @hanzo/og.
 */
let own: NodeJS.Require | undefined
const mine = () => (own ??= createRequire(createRequire(join(process.cwd(), 'package.json')).resolve('@hanzo/og/package.json')))
const RESVG = '@resvg/resvg-js'
const rasterizer = (): typeof import('@resvg/resvg-js') => mine()(RESVG)

let zen: Promise<Font[]> | undefined
const face = (name: string) => readFile(mine().resolve(`@hanzo/font/dist/fonts/zen-sans/${name}`))
const ZEN = () =>
  (zen ??= (async () => [
    { name: 'Zen', data: await face('Zen-Regular.ttf'), weight: 400 as const },
    { name: 'Zen', data: await face('Zen-Bold.ttf'), weight: 700 as const },
  ])())

export class ImageResponse extends Response {
  constructor(element: ReactElement, options: ImageOptions = {}) {
    const width = options.width ?? 1200
    const height = options.height ?? 630
    const body = new ReadableStream<Uint8Array>({
      async start(c) {
        try {
          const fonts = options.fonts?.length ? options.fonts : await ZEN()
          const svg = await satori(element, { width, height, fonts: fonts as never })
          const { Resvg } = rasterizer()
          c.enqueue(new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng()))
          c.close()
        } catch (e) {
          c.error(e)
        }
      },
    })
    super(body, { status: options.status, headers: { 'content-type': 'image/png', ...options.headers } })
  }
}
