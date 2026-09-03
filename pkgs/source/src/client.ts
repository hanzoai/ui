/**
 * Opening what is on screen in the editor.
 *
 * A development server already knows how to launch the editor on a file: Vite
 * answers `/__open-in-editor?file=path:line:column` and Next answers
 * `/__nextjs_launch-editor?file=path&lineNumber=n&column=c`, each through the
 * `launch-editor` package, which picks the editor from `LAUNCH_EDITOR`, then
 * `EDITOR`, then whichever of code, cursor, zed, vim it finds running. Nothing
 * here chooses an editor, and nothing here runs outside development.
 *
 * The element's position comes from `data-source`, which `jsx-dev-runtime`
 * writes. The gesture is Alt + right click: a plain right click stays the
 * browser's, and Alt is the one modifier no context menu already claims.
 */

/** The position a `data-source` attribute names. */
export interface Position {
  file: string
  line: number
  column: number
}

/** Reads the nearest position at or above an element. */
export const position = (el: Element | null): Position | null => {
  const host = el?.closest<HTMLElement>('[data-source]')
  const stamp = host?.dataset.source
  if (!stamp) return null
  const at = stamp.lastIndexOf(':', stamp.lastIndexOf(':') - 1)
  const [line, column] = stamp.slice(at + 1).split(':')
  return { file: stamp.slice(0, at), line: Number(line) || 1, column: Number(column) || 1 }
}

/**
 * Asks the development server to open a position. Vite's route is tried first
 * and Next's second; whichever answers is the server this page came from.
 */
export const open = async ({ file, line, column }: Position): Promise<boolean> => {
  const vite = `/__open-in-editor?file=${encodeURIComponent(`${file}:${line}:${column}`)}`
  const next = `/__nextjs_launch-editor?file=${encodeURIComponent(file)}&lineNumber=${line}&column=${column}`
  for (const url of [vite, next]) {
    const res = await fetch(url).catch(() => null)
    if (res?.ok) return true
  }
  return false
}

/** Starts listening for Alt + right click. Returns the function that stops. */
export const listen = (target: Document = document) => {
  const onContextMenu = (e: MouseEvent) => {
    if (!e.altKey) return
    const at = position(e.target as Element)
    if (!at) return
    e.preventDefault()
    void open(at)
  }
  target.addEventListener('contextmenu', onContextMenu)
  return () => target.removeEventListener('contextmenu', onContextMenu)
}
