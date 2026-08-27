'use client'

import * as React from 'react'

import { ApplyTypography } from '../backends/gui/prose'
import { Box } from '../box'
import { cn } from '../core/cn'
import type { Block, ScreenfulBlock, VideoBlock } from './def'
import { Content as Blocks } from './content'
import { type BlockComponentProps, has } from './spec'

/**
 * Is the element mostly on screen?
 *
 * Native IntersectionObserver rather than a package: this is the only place in
 * the library that needs it, and the hook it would replace is fifteen lines.
 * 0.75 because the caller is deciding whether to PLAY a video — a strip of it
 * appearing at the edge of the viewport is not someone watching.
 */
const useInView = (threshold = 0.75, initial = false) => {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = React.useState(initial)

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return { ref, inView }
}

/**
 * A background video that plays only while it is on screen.
 *
 * Mounted after the first client render, never on the server: a `<video>` in
 * server markup is a download that starts before anything has decided the
 * element is even visible.
 */
const Backdrop = ({
  block,
  className,
  initialInView,
}: {
  block: VideoBlock
  className?: string
  initialInView?: boolean
}) => {
  const [mounted, setMounted] = React.useState(false)
  const { ref, inView } = useInView(0.75, initialInView)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) return null
  return (
    <div ref={ref} className={className}>
      {inView && (
        <video
          autoPlay
          loop
          muted
          playsInline
          // Without this a video is a black rectangle until the first frame
          // decodes — which on a hero is the whole composition, missing.
          poster={block.poster}
          style={{ margin: 0, height: '100%', width: '100%', objectFit: 'cover' }}
        >
          {block.sources?.map((src, i) => (
            <source key={i} src={src} />
          ))}
        </video>
      )}
    </div>
  )
}

/** The banner, as a still. It is also the video's first frame, so nothing jumps. */
const Poster = ({
  banner,
  className,
  children,
}: React.PropsWithChildren<{ banner?: string | VideoBlock; className?: string }>) =>
  banner ? (
    <Box
      className={cn('relative', className)}
      style={{
        height: '100%',
        width: '100%',
        backgroundImage: `url(${typeof banner === 'string' ? banner : banner.poster})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {children}
    </Box>
  ) : (
    <Box className={cn('h-full w-full relative', className)}>{children}</Box>
  )

/** One column of a screenful, placed by its own specifiers. */
const Column = ({
  blocks,
  specifiers,
  agent,
  className,
}: {
  blocks: Block[]
  specifiers?: string
  agent?: string
  className?: string
}) => {
  const spec = (s: string) => has(specifiers, s)
  const phone = agent === 'phone'

  const place = phone
    ? cn('items-start', spec('mobile-vert-center') ? 'justify-center' : 'justify-start')
    : cn(
        spec('right') ? 'items-end' : spec('center') ? 'items-center' : 'items-start',
        spec('bottom') ? 'justify-end' : spec('vert-center') ? 'justify-center' : 'justify-start',
        // Right-aligned running text is hard to read at phone widths, so this
        // is a desktop-only hint on purpose.
        spec('text-align-right') ? 'text-right' : 'text-left',
      )

  // h-full is what makes the vertical placement above mean anything — without a
  // height there is no free space for `justify-*` to distribute.
  return (
    <Box className={cn('flex flex-col justify-center h-full', place, className)}>
      <Blocks blocks={blocks} agent={agent} />
    </Box>
  )
}

const Columns = ({
  block: b,
  agent,
  className,
}: {
  block: ScreenfulBlock
  agent?: string
  className?: string
}) => {
  if (b.contentColumns.length === 1) {
    return (
      <Column
        blocks={b.contentColumns[0]}
        specifiers={b.columnSpecifiers?.[0]}
        agent={agent}
        className={className}
      />
    )
  }

  // `order` is one-based in flex, and the 5.x original tested the index for
  // truthiness — so the column asked to come FIRST was the one that never moved.
  const order = (i: number) => {
    const at = b.mobileOrder?.indexOf(i)
    return at !== undefined && at >= 0 ? `order-${at + 1} md:order-none` : ''
  }

  return (
    <Box
      className={cn(
        'flex flex-col gap-2 sm:gap-4 h-full',
        agent !== 'phone' && `md:grid md:gap-8 md:grid-cols-${b.contentColumns.length}`,
        className,
      )}
    >
      {b.contentColumns.map((column, i) => (
        <Column
          blocks={column}
          specifiers={b.columnSpecifiers?.[i]}
          agent={agent}
          className={order(i)}
          key={i}
        />
      ))}
    </Box>
  )
}

/**
 * One screenful: a full-height section, optionally over a banner, holding one
 * to three columns of blocks.
 *
 * `snapTile` makes it a stop in a scroll-snapping sequence, which is why it
 * fixes the height rather than setting a minimum — a snap point that can grow
 * past the viewport can never be fully scrolled to.
 */
export const ScreenfulBlockComponent = ({
  block,
  agent,
  initialInView = false,
  snapTile = false,
  className,
  contentClassName,
  bottom,
}: BlockComponentProps & {
  initialInView?: boolean
  snapTile?: boolean
  contentClassName?: string
  bottom?: React.ReactNode
}) => {
  if (block.blockType !== 'screenful') return <>screenful block required</>
  const b = block as ScreenfulBlock
  const spec = (s: string) => has(b.specifiers, s)

  const video = b.banner && typeof b.banner === 'object'
  const oneColumn = b.contentColumns.length === 1
  const vertCenter = spec('vert-center')

  // The gutter GROWS with the viewport. It used to be `px-[8vw] xl:px-[1vw]`,
  // which shrank from 8% of the screen to 1% at exactly the width where there
  // is most room — measured at 1280px: 13px of margin and 82 characters to the
  // line. `--gutter` is a clamp, so it opens up to 6rem and stops.
  const gutters = spec('narrow-gutters')
    ? cn('px-6 lg:px-8 pb-4 lg:pb-6 xl:pb-8', snapTile && 'pt-15 md:pt-26 lg:pt-28')
    : spec('no-gutters')
      ? cn('px-0 pb-0', snapTile && 'pt-11 lg:pt-20')
      : 'px-[var(--gutter)] pb-[8vh] pt-[calc(44px+4vh)] md:pt-[calc(80px+6vh)]'

  return (
    <Box
      tag="section"
      {...(b.anchorId ? { id: b.anchorId } : {})}
      className={cn(
        snapTile ? 'snap-start snap-always h-[100vh]' : 'min-h-screen',
        bottom && 'flex flex-col',
        className,
      )}
    >
      <ApplyTypography
        className={cn(
          'w-full flex flex-row justify-center self-stretch',
          snapTile && (agent === 'desktop' ? 'h-full' : 'h-[100svh]'),
          bottom && 'grow',
        )}
      >
        <Poster banner={b.banner}>
          {video && (
            <Backdrop
              block={b.banner as VideoBlock}
              className="absolute top-0 left-0 bottom-0 right-0"
              initialInView={initialInView}
            />
          )}
          <Box
            className={cn(
              'xl:mx-auto overflow-y-hidden h-full',
              // `max-w-screen-xl` is 1280px — exactly the width most desktops
            // are, so it capped nothing where it mattered. `--frame` is wider
            // and is a real bound: the composition stops, the gutter takes the
            // rest, and the column centres.
            !spec('full-screen-width') && 'max-w-[var(--frame)]',
              gutters,
              agent && agent !== 'desktop' && 'pt-15 sm:pt-17 pb-0 px-3 sm:px-8',
              snapTile ? 'absolute left-0 right-0 top-0 bottom-0' : 'flex min-h-screen w-full',
              contentClassName,
              vertCenter && cn('self-center', oneColumn && 'py-0'),
            )}
          >
            <Columns block={b} agent={agent} className="w-full" />
            {b.footer}
          </Box>
        </Poster>
      </ApplyTypography>
      {bottom}
    </Box>
  )
}

export default ScreenfulBlockComponent
