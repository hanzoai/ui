'use client'

import { useEffect, useState } from 'react'

export interface ViewportState {
  width: number
  mobile: boolean
  tablet: boolean
  desktop: boolean
}

const compute = (width: number): ViewportState => ({
  width,
  mobile: width < 768,
  tablet: width >= 768 && width < 1024,
  desktop: width >= 1024,
})

/** Responsive viewport hook supporting mobile (390px), tablet (768px) and desktop (1440px). */
export function useViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>(() =>
    compute(typeof window !== 'undefined' ? window.innerWidth : 1280),
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const update = () => setState(compute(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return state
}
