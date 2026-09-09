"use client"

/**
 * The one place the package's keyframes + canvas/drawer chrome CSS live.
 * `<CanvasStyles/>` injects them; every animation is disabled under
 * `prefers-reduced-motion`, and the status-dot ring color is driven by a CSS var
 * so the pulse matches any status hue without a second element. Rendering it more
 * than once is harmless (the identical keyframes simply re-declare).
 */

export const CANVAS_CSS = `
.hz-canvas-dot { display: inline-block; box-shadow: 0 0 0 0 transparent; }
.hz-canvas-dot--pulse { animation: hz-canvas-pulse 2.4s ease-out infinite; }
@keyframes hz-canvas-pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--hz-dot, #3fb950) 55%, transparent); }
  70%  { box-shadow: 0 0 0 5px color-mix(in srgb, var(--hz-dot, #3fb950) 0%, transparent); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
.hz-canvas-node { transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease; }
.hz-canvas-node:hover { transform: translateY(-2px); }
.hz-canvas-fade { animation: hz-canvas-fade 180ms ease-out both; }
@keyframes hz-canvas-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.hz-canvas-backdrop { animation: hz-canvas-backdrop-in 160ms ease-out both; }
@keyframes hz-canvas-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
.hz-canvas-drawer { animation: hz-canvas-drawer-in 240ms cubic-bezier(0.22, 0.61, 0.36, 1) both; }
@keyframes hz-canvas-drawer-in { from { transform: translateX(28px); opacity: 0.3; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .hz-canvas-dot--pulse { animation: none; }
  .hz-canvas-node { transition: none; }
  .hz-canvas-node:hover { transform: none; }
  .hz-canvas-fade, .hz-canvas-backdrop, .hz-canvas-drawer { animation: none; }
}
/* React Flow chrome tuned to the neutral design tokens (theme vars set on the wrapper). */
.hz-canvas .react-flow__attribution { display: none; }
.hz-canvas .react-flow__controls { box-shadow: none; border: 1px solid var(--hz-border, #30363d); border-radius: 10px; overflow: hidden; }
.hz-canvas .react-flow__controls-button { background: var(--hz-surface, #0d1117); border-bottom: 1px solid var(--hz-border, #30363d); color: var(--hz-fg, #c9d1d9); }
.hz-canvas .react-flow__controls-button:hover { background: var(--hz-surface-2, #161b22); }
.hz-canvas .react-flow__controls-button svg { fill: currentColor; }
.hz-canvas .react-flow__minimap { border: 1px solid var(--hz-border, #30363d); border-radius: 10px; overflow: hidden; }
`

export function CanvasStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CANVAS_CSS }} />
}
