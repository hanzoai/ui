/**
 * Pure diff logic — classify a unified diff into typed, line-numbered rows and
 * compute a live-vs-desired line diff when only the two manifests are given. No
 * React, no DOM — unit-tested. The component picks one: a pre-computed `diff`
 * string → `classifyDiff`; raw `liveState` + `targetState` → `lineDiff`.
 */
import type { DiffLine, DiffStats } from './types'

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/

/**
 * Classify each line of a unified diff. `+`/`-` become add/del, `@@` a hunk
 * header (which reseeds the old/new line counters), and the git metadata lines
 * (`diff`, `index`, `+++`, `---`) become `meta`. Everything else is context.
 */
export function classifyDiff(unified: string): DiffLine[] {
  if (!unified) return []
  const out: DiffLine[] = []
  let oldLine = 0
  let newLine = 0
  for (const text of unified.replace(/\r\n?/g, '\n').split('\n')) {
    const hunk = HUNK.exec(text)
    if (hunk) {
      oldLine = Number(hunk[1])
      newLine = Number(hunk[2])
      out.push({ type: 'hunk', text })
      continue
    }
    if (
      text.startsWith('+++') ||
      text.startsWith('---') ||
      text.startsWith('diff ') ||
      text.startsWith('index ') ||
      text.startsWith('\\ No newline')
    ) {
      out.push({ type: 'meta', text })
      continue
    }
    if (text.startsWith('+')) {
      out.push({ type: 'add', text: text.slice(1), newLine: newLine++ })
      continue
    }
    if (text.startsWith('-')) {
      out.push({ type: 'del', text: text.slice(1), oldLine: oldLine++ })
      continue
    }
    out.push({ type: 'context', text: text.startsWith(' ') ? text.slice(1) : text, oldLine: oldLine++, newLine: newLine++ })
  }
  // A trailing newline yields a final empty context row — drop it.
  if (out.length && out[out.length - 1].type === 'context' && out[out.length - 1].text === '') out.pop()
  return out
}

/**
 * Longest-common-subsequence line diff of two manifests → classified rows
 * (`del` for live-only lines, `add` for desired-only, `context` for shared).
 * O(n·m) space/time — fine for manifests (hundreds of lines).
 */
export function lineDiff(oldText: string, newText: string): DiffLine[] {
  const a = (oldText ?? '').replace(/\r\n?/g, '\n').split('\n')
  const b = (newText ?? '').replace(/\r\n?/g, '\n').split('\n')
  const n = a.length
  const m = b.length

  // dp[i][j] = LCS length of a[i:] and b[j:].
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  let oldLine = 1
  let newLine = 1
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'context', text: a[i], oldLine: oldLine++, newLine: newLine++ })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i], oldLine: oldLine++ })
      i++
    } else {
      out.push({ type: 'add', text: b[j], newLine: newLine++ })
      j++
    }
  }
  while (i < n) out.push({ type: 'del', text: a[i++], oldLine: oldLine++ })
  while (j < m) out.push({ type: 'add', text: b[j++], newLine: newLine++ })

  // Trailing empty line from a final newline on both sides is noise — drop it.
  if (out.length && out[out.length - 1].type === 'context' && out[out.length - 1].text === '') out.pop()
  return out
}

/** Count additions/deletions in a classified diff. */
export function diffStats(lines: DiffLine[]): DiffStats {
  let additions = 0
  let deletions = 0
  for (const l of lines) {
    if (l.type === 'add') additions++
    else if (l.type === 'del') deletions++
  }
  return { additions, deletions }
}
