"use client"

/**
 * Scoped stylesheet for `@hanzo/flow` React Flow chrome, handle affordances,
 * and execution pulse keyframes. All selectors live under `.hz-flow` so no
 * global rule leaks into the host app.
 */

export const FLOW_CSS = `
.hz-flow { box-sizing: border-box; }
.hz-flow *, .hz-flow *::before, .hz-flow *::after { box-sizing: border-box; }
.hz-flow .react-flow__attribution { display: none; }
.hz-flow .react-flow__controls {
  box-shadow: none;
  border: 1px solid var(--hz-flow-border, rgba(255,255,255,0.10));
  border-radius: 8px;
  overflow: hidden;
  background: var(--hz-flow-rail, #000000);
}
.hz-flow .react-flow__controls-button {
  background: var(--hz-flow-rail, #000000);
  border-bottom: 1px solid var(--hz-flow-border, rgba(255,255,255,0.10));
  color: var(--hz-flow-fg-muted, #a1a1aa);
  width: 28px;
  height: 28px;
}
.hz-flow .react-flow__controls-button:last-child { border-bottom: none; }
.hz-flow .react-flow__controls-button:hover {
  background: var(--hz-flow-hover, #141414);
  color: var(--hz-flow-fg, #fafafa);
}
.hz-flow .react-flow__controls-button svg { fill: currentColor; }
.hz-flow .react-flow__minimap {
  border: 1px solid var(--hz-flow-border, rgba(255,255,255,0.10));
  border-radius: 8px;
  overflow: hidden;
  background: var(--hz-flow-minimap, #000000);
}
.hz-flow .react-flow__edge-path {
  transition: stroke 120ms ease, stroke-width 120ms ease;
}
.hz-flow .react-flow__edge.selected .react-flow__edge-path {
  stroke: var(--hz-flow-edge-selected, #fafafa) !important;
  stroke-width: 2 !important;
}
.hz-flow .react-flow__handle {
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}
.hz-flow .react-flow__handle:hover {
  transform: scale(1.25);
  border-color: var(--hz-flow-fg, #fafafa) !important;
}
.hz-flow-node {
  transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}
.hz-flow-node--running {
  animation: hz-flow-ring-pulse 1.6s ease-in-out infinite;
}
@keyframes hz-flow-ring-pulse {
  0%, 100% { box-shadow: 0 0 0 1px var(--hz-flow-fg, #fafafa), 0 0 0 3px rgba(255,255,255,0.14); }
  50% { box-shadow: 0 0 0 1px var(--hz-flow-fg, #fafafa), 0 0 0 6px rgba(255,255,255,0.04); }
}
.hz-flow-input {
  width: 100%;
  outline: none;
  font-family: inherit;
  transition: border-color 120ms ease;
}
.hz-flow-input:focus {
  border-color: var(--hz-flow-border-strong, rgba(255,255,255,0.28)) !important;
}
@media (prefers-reduced-motion: reduce) {
  .hz-flow-node, .hz-flow .react-flow__handle, .hz-flow .react-flow__edge-path { transition: none; }
  .hz-flow-node--running { animation: none; }
}
`

export function FlowStyles() {
  return <style dangerouslySetInnerHTML={{ __html: FLOW_CSS }} />
}
