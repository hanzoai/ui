'use client'

/**
 * MarketingNav — the ONE marketing bar the Hanzo properties render.
 *
 * It replaces five hand-maintained copies of the same 160-line `DesktopNav.tsx`
 * (hanzo.id, hanzo.network, hanzo.one, sensei.group, hanzo.app). Two of those were
 * byte-identical and two differed only in an accent colour, so the variation this
 * component actually needs is: the menus (data), the accent, and how the host
 * navigates.
 *
 * ROUTER-AGNOSTIC by construction. The copies hard-imported `react-router-dom`'s
 * `<Link to>`, which is why hanzo.ai — a Next app using `<Link href>` — could never
 * share them and grew a sixth nav instead. Here the host passes `link`, so a Vite
 * SPA, a Next app and a plain-anchor page all use the same component. External
 * destinations bypass it and render a guarded anchor, because a client router
 * cannot navigate off-site.
 *
 * This lives in the v5/Tailwind lane beside `hanzo-shell` because that is the lane
 * these properties are on. `hanzo-shell` is the SIGNED-IN app chrome (billing,
 * account, console, chat, platform); this is the signed-out marketing bar. Same
 * repo, different job — not a second implementation of either.
 */
import * as React from 'react'

import { HANZO_MARKETING_MENUS, isMenu, type MarketingMenus, type NavLink } from './menus'

/** How the host navigates internally — `next/link`, a router `Link`, or an anchor. */
export type LinkRender = (props: {
  href: string
  className?: string
  onClick?: () => void
  children: React.ReactNode
}) => React.ReactNode

const anchorLink: LinkRender = ({ href, className, onClick, children }) => (
  <a href={href} className={className} onClick={onClick}>
    {children}
  </a>
)

export interface MarketingNavProps {
  /** Menus to render. Defaults to the shared Hanzo bar. */
  menus?: MarketingMenus
  /** Host navigation primitive. Defaults to a plain anchor. */
  link?: LinkRender
  /**
   * Brand accent, as a Tailwind colour STEM (`neutral`, `purple`, …). It is the
   * only thing that differed between two of the copies. Interpolating a stem into
   * a class name is safe here because the set is closed and declared in `safelist`
   * — never accept an arbitrary string from user input.
   */
  accent?: string
  className?: string
}

/** One destination. External links never go through the host router. */
function Item({
  link,
  item,
  accent,
  close,
}: {
  link: LinkRender
  item: NavLink
  accent: string
  close: () => void
}) {
  const plain = 'text-sm text-neutral-300 hover:text-white transition-colors'
  const body = item.note ? (
    <span className="group flex items-start gap-2">
      {item.glyph ? <span className={`text-${accent}-400 text-lg`}>{item.glyph}</span> : null}
      <span>
        <span className={`text-sm text-white font-medium group-hover:text-${accent}-400 transition-colors`}>
          {item.label}
        </span>
        <p className="text-xs text-neutral-500">{item.note}</p>
      </span>
    </span>
  ) : (
    item.label
  )

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={plain}>
        {body}
      </a>
    )
  }
  return <>{link({ href: item.href, className: plain, onClick: close, children: body })}</>
}

/** A dropdown, opened on click and dismissed on Escape or an outside click. */
function Menu({
  label,
  columns,
  link,
  accent,
}: {
  label: string
  columns: { title?: string; links: NavLink[] }[]
  link: LinkRender
  accent: string
}) {
  const [open, setOpen] = React.useState(false)
  const root = React.useRef<HTMLDivElement | null>(null)
  const close = () => setOpen(false)

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="text-neutral-400 hover:text-white transition-colors text-sm font-medium"
      >
        {label}
      </button>
      {open ? (
        <div className="absolute left-0 top-full mt-3 z-50 rounded-xl border border-neutral-700/50 bg-neutral-900 p-6 shadow-xl">
          <div className="flex gap-8">
            {columns.map((col, i) => (
              <div key={col.title ?? i} className="min-w-[11rem]">
                {col.title ? (
                  <h3 className="text-neutral-500 text-xs font-medium mb-3 uppercase tracking-wider">
                    {col.title}
                  </h3>
                ) : null}
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Item link={link} item={l} accent={accent} close={close} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function MarketingNav({
  menus = HANZO_MARKETING_MENUS,
  link = anchorLink,
  accent = 'neutral',
  className,
}: MarketingNavProps) {
  return (
    <div className={className ?? 'hidden md:flex items-center space-x-6'}>
      {menus.map((item) =>
        isMenu(item) ? (
          <Menu key={item.label} label={item.label} columns={item.columns} link={link} accent={accent} />
        ) : (
          <React.Fragment key={item.href}>
            {link({
              href: item.href,
              className: 'text-neutral-400 hover:text-white transition-colors text-sm font-medium',
              children: item.label,
            })}
          </React.Fragment>
        ),
      )}
    </div>
  )
}

export default MarketingNav
