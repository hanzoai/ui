'use client'

/**
 * The one stylesheet for the whole GitOps surface — mount `<GitopsStyles />` once
 * (top-level components already do) or inline `GITOPS_CSS`. Theme-aware: the
 * chrome hues follow `--hz-*` CSS variables set from `THEME_VARS` by each
 * top-level component's root, so light/dark is driven off the app's resolved
 * theme, not `prefers-color-scheme`. Status hues are semantic and stay inline
 * (from the health/sync palettes), so they read identically in both themes.
 *
 * Presentational only. The class names are stable and semantic so a later
 * migration to @hanzo/gui primitives is mechanical.
 */
import type { CSSProperties } from 'react'

/** Chrome variables per theme — GitHub-family neutrals, calm and dark-first. */
export const THEME_VARS: Record<'light' | 'dark', CSSProperties> = {
  dark: {
    ['--hz-border' as string]: '#30363d',
    ['--hz-surface' as string]: '#0d1117',
    ['--hz-surface-2' as string]: '#161b22',
    ['--hz-surface-3' as string]: '#21262d',
    ['--hz-fg' as string]: '#c9d1d9',
    ['--hz-fg-muted' as string]: '#8b949e',
    ['--hz-fg-strong' as string]: '#f0f6fc',
    ['--hz-edge' as string]: '#3d444d',
    ['--hz-accent' as string]: '#2f81f7',
    ['--hz-overlay' as string]: 'rgba(1,4,9,0.6)',
  },
  light: {
    ['--hz-border' as string]: '#d0d7de',
    ['--hz-surface' as string]: '#ffffff',
    ['--hz-surface-2' as string]: '#f6f8fa',
    ['--hz-surface-3' as string]: '#eaeef2',
    ['--hz-fg' as string]: '#24292f',
    ['--hz-fg-muted' as string]: '#57606a',
    ['--hz-fg-strong' as string]: '#1f2328',
    ['--hz-edge' as string]: '#afb8c1',
    ['--hz-accent' as string]: '#0969da',
    ['--hz-overlay' as string]: 'rgba(255,255,255,0.6)',
  },
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

export const GITOPS_CSS = `
.hz-gitops { font-family: ${SANS}; color: var(--hz-fg); box-sizing: border-box; }
.hz-gitops *, .hz-gitops *::before, .hz-gitops *::after { box-sizing: border-box; }
@keyframes hz-gitops-spin { to { transform: rotate(360deg); } }
.hz-gitops-spin { animation: hz-gitops-spin 1s linear infinite; transform-origin: 50% 50%; }

/* Badges */
.hz-gitops-badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px;
  border-radius: 999px; font-size: 11px; font-weight: 700; line-height: 1.4; white-space: nowrap; }
.hz-gitops-badge--sm { padding: 1px 6px; font-size: 10px; gap: 4px; }

/* Table (applications list) */
.hz-gitops-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.hz-gitops-table th { text-align: left; font-weight: 600; color: var(--hz-fg-muted);
  padding: 8px 12px; border-bottom: 1px solid var(--hz-border); position: sticky; top: 0;
  background: var(--hz-surface); z-index: 1; user-select: none; cursor: pointer; }
.hz-gitops-table td { padding: 10px 12px; border-bottom: 1px solid var(--hz-border); vertical-align: middle; }
.hz-gitops-row { cursor: pointer; }
.hz-gitops-row:hover td { background: var(--hz-surface-2); }
.hz-gitops-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }

/* Cards / panels */
.hz-gitops-card { background: var(--hz-surface); border: 1px solid var(--hz-border);
  border-radius: 10px; overflow: hidden; }
.hz-gitops-panel { background: var(--hz-surface); border: 1px solid var(--hz-border); border-radius: 10px; }
.hz-gitops-muted { color: var(--hz-fg-muted); }
.hz-gitops-mono { font-family: ${MONO}; }

/* Inputs / buttons */
.hz-gitops-input { font: inherit; font-size: 13px; color: var(--hz-fg); background: var(--hz-surface-2);
  border: 1px solid var(--hz-border); border-radius: 8px; padding: 7px 10px; outline: none; width: 100%; }
.hz-gitops-input:focus { border-color: var(--hz-accent); }
.hz-gitops-btn { font: inherit; font-size: 13px; font-weight: 600; color: var(--hz-fg);
  background: var(--hz-surface-2); border: 1px solid var(--hz-border); border-radius: 8px;
  padding: 7px 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.hz-gitops-btn:hover { border-color: var(--hz-fg-muted); }
.hz-gitops-btn--primary { color: #fff; background: var(--hz-accent); border-color: var(--hz-accent); }
.hz-gitops-btn--danger { color: #fff; background: #E96D76; border-color: #E96D76; }
.hz-gitops-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.hz-gitops-chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 7px;
  border-radius: 6px; font-size: 11px; background: var(--hz-surface-2); color: var(--hz-fg-muted);
  border: 1px solid var(--hz-border); }

/* Tabs */
.hz-gitops-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--hz-border); }
.hz-gitops-tab { font: inherit; font-size: 13px; font-weight: 600; color: var(--hz-fg-muted);
  background: none; border: none; border-bottom: 2px solid transparent; padding: 8px 12px; cursor: pointer; }
.hz-gitops-tab:hover { color: var(--hz-fg); }
.hz-gitops-tab--active { color: var(--hz-fg-strong); border-bottom-color: var(--hz-accent); }

/* Resource tree */
.hz-gitops-tree { position: relative; overflow: hidden; background: var(--hz-surface);
  border: 1px solid var(--hz-border); border-radius: 10px; }
.hz-gitops-tree-viewport { position: absolute; inset: 0; overflow: hidden; cursor: grab; }
.hz-gitops-tree-viewport:active { cursor: grabbing; }
.hz-gitops-tree-world { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.hz-gitops-node { position: absolute; box-sizing: border-box; background: var(--hz-surface);
  border: 1px solid var(--hz-border); border-radius: 9px; padding: 8px 10px; overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06); }
.hz-gitops-node:hover { border-color: var(--hz-fg-muted); }
.hz-gitops-node--selected { box-shadow: 0 0 0 2px var(--hz-accent); border-color: var(--hz-accent); }
.hz-gitops-node-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.hz-gitops-collapse { position: absolute; right: -9px; top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px; border-radius: 999px; background: var(--hz-surface-3);
  border: 1px solid var(--hz-border); color: var(--hz-fg-muted); font-size: 11px; line-height: 1;
  display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; }
.hz-gitops-zoom { position: absolute; bottom: 10px; left: 10px; display: flex; gap: 4px; z-index: 3; }

/* Diff */
.hz-gitops-diff { font-family: ${MONO}; font-size: 12px; line-height: 1.5; width: 100%;
  border-collapse: collapse; }
.hz-gitops-diff td { padding: 0 8px; white-space: pre-wrap; word-break: break-word; vertical-align: top; }
.hz-gitops-diff-gutter { text-align: right; color: var(--hz-fg-muted); user-select: none;
  width: 1%; white-space: nowrap; opacity: 0.7; -webkit-user-select: none; }
.hz-gitops-diff-add { background: rgba(63,185,80,0.15); }
.hz-gitops-diff-add .hz-gitops-diff-sign { color: #3fb950; }
.hz-gitops-diff-del { background: rgba(248,81,73,0.15); }
.hz-gitops-diff-del .hz-gitops-diff-sign { color: #f85149; }
.hz-gitops-diff-hunk { color: var(--hz-accent); background: var(--hz-surface-2); }
.hz-gitops-diff-meta { color: var(--hz-fg-muted); }
.hz-gitops-diff-sign { user-select: none; width: 1ch; display: inline-block; }

/* Manifest + logs */
.hz-gitops-code { font-family: ${MONO}; font-size: 12px; line-height: 1.55; white-space: pre;
  overflow: auto; background: var(--hz-surface); color: var(--hz-fg); margin: 0; padding: 12px; }
.hz-gitops-logs { font-family: ${MONO}; font-size: 12px; line-height: 1.5; overflow: auto;
  background: var(--hz-surface); padding: 8px 0; }
.hz-gitops-log { display: flex; gap: 10px; padding: 1px 12px; white-space: pre-wrap; word-break: break-word; }
.hz-gitops-log:hover { background: var(--hz-surface-2); }
.hz-gitops-log-ts { color: var(--hz-fg-muted); flex-shrink: 0; opacity: 0.75; }

/* Dialog */
.hz-gitops-overlay { position: fixed; inset: 0; background: rgba(1,4,9,0.55); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px; }
.hz-gitops-dialog { background: var(--hz-surface); border: 1px solid var(--hz-border);
  border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.4); max-width: 520px; width: 100%;
  max-height: 90vh; overflow: auto; }

/* Scrollbars — quiet, theme-aware */
.hz-gitops ::-webkit-scrollbar { width: 10px; height: 10px; }
.hz-gitops ::-webkit-scrollbar-thumb { background: var(--hz-border); border-radius: 999px;
  border: 2px solid transparent; background-clip: padding-box; }
`

const STYLE_ID = 'hz-gitops-styles'

/** Inject `GITOPS_CSS` once (idempotent by element id). Render near the surface root. */
export function GitopsStyles() {
  return <style id={STYLE_ID} dangerouslySetInnerHTML={{ __html: GITOPS_CSS }} />
}

/** The root style object for a themed surface — spread onto a top-level container. */
export function themeStyle(theme: 'light' | 'dark', extra?: CSSProperties): CSSProperties {
  return { ...THEME_VARS[theme], ...extra }
}
