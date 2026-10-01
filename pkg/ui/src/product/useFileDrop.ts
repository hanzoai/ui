'use client'

/**
 * useFileDrop — the ONE window-level file drop.
 *
 * Files dropped anywhere in the window attach, not only on the composer box.
 * The listener lives on `window`, filters for a real file drag (a
 * `dataTransfer` that carries `Files` — a text selection or an in-page drag
 * must not light the overlay), and hands the dropped files to `onFiles`.
 * `active` is true while a file is over the window so a surface can light its
 * own full-window overlay.
 *
 * The enter/leave depth counter is the whole reason this is a hook and not a
 * bare `onDrop`: `dragleave` fires as the pointer crosses every child element,
 * so a naive listener blanks the overlay mid-drag and it flickers. Counting
 * enters against leaves keeps `active` true until the cursor actually leaves the
 * window.
 *
 * Web-only. Native (expo) and desktop hosts have no HTML5 `dataTransfer` drop,
 * so the effect no-ops where the events do not exist. One hook so the site and
 * the chat client behave identically instead of each carrying its own listener
 * that drifts — the same reason `useCommandK` exists.
 *
 * `enabled` gates the listeners for a shared surface that only wants the drop
 * when its host can actually handle a file: a hook cannot be called
 * conditionally, so a surface with no `onFiles` passes `enabled: false` and the
 * window stays untouched rather than swallowing drops into a void.
 */
import { useEffect, useRef, useState } from 'react'

export interface FileDrop {
  /** True while a file drag is over the window. */
  active: boolean
}

function carriesFiles(e: DragEvent): boolean {
  const types = e.dataTransfer?.types
  if (!types) return false
  // `types` is a readonly string[] in the DOM lib but a live list at runtime.
  return Array.prototype.indexOf.call(types, 'Files') !== -1
}

export function useFileDrop(
  onFiles: (files: File[]) => void,
  enabled = true,
): FileDrop {
  const [active, setActive] = useState(false)
  const depth = useRef(0)
  const cb = useRef(onFiles)
  cb.current = onFiles

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const onDragEnter = (e: DragEvent) => {
      if (!carriesFiles(e)) return
      e.preventDefault()
      depth.current += 1
      setActive(true)
    }
    const onDragOver = (e: DragEvent) => {
      if (!carriesFiles(e)) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }
    const onDragLeave = (e: DragEvent) => {
      if (!carriesFiles(e)) return
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) setActive(false)
    }
    const onDrop = (e: DragEvent) => {
      if (!carriesFiles(e)) return
      e.preventDefault()
      depth.current = 0
      setActive(false)
      const files = e.dataTransfer?.files
      if (files && files.length) cb.current(Array.from(files))
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [enabled])

  return { active }
}
