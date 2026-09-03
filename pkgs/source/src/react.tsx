/**
 * `<Source />` — listens for Alt + right click while mounted.
 *
 * For a framework that owns the document, such as Next, where there is no
 * HTML to inject a script into: render it once, in the root layout. It renders
 * nothing. A production build carries no `data-source` stamps, so the listener
 * finds no position there and the gesture stays the browser's.
 */
import { useEffect } from 'react'
import { listen } from './client'

export const Source = () => {
  useEffect(() => listen(), [])
  return null
}
