/**
 * Minimal layout for embedded examples
 * Does not include SiteHeader or SiteFooter
 * Used for clean example displays in iframes
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
