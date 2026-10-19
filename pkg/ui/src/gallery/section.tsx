import type { ReactNode } from 'react'

/**
 * One gallery section. `data-gallery` names it so a browser test can scope its
 * assertions without depending on document order.
 */
export const Section = ({ name, children }: { name: string; children: ReactNode }) => (
  <section
    data-gallery={name}
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'flex-start',
      width: '100%',
      maxWidth: 880,
    }}
  >
    {children}
  </section>
)
