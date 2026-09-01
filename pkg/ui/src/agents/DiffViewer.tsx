import React, { useMemo } from 'react'

export interface DiffViewerProps {
  originalCode: string
  modifiedCode: string
  filename?: string
  language?: string
  className?: string
}

interface DiffLine {
  type: 'add' | 'remove' | 'same'
  content: string
  oldNum?: number
  newNum?: number
}

function computeDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split('\n')
  const modLines = modified.split('\n')
  const lines: DiffLine[] = []

  let i = 0
  let j = 0

  while (i < origLines.length || j < modLines.length) {
    if (i < origLines.length && j < modLines.length) {
      if (origLines[i] === modLines[j]) {
        lines.push({ type: 'same', content: origLines[i], oldNum: i + 1, newNum: j + 1 })
        i++
        j++
      } else {
        lines.push({ type: 'remove', content: origLines[i], oldNum: i + 1 })
        i++
        lines.push({ type: 'add', content: modLines[j], newNum: j + 1 })
        j++
      }
    } else if (i < origLines.length) {
      lines.push({ type: 'remove', content: origLines[i], oldNum: i + 1 })
      i++
    } else if (j < modLines.length) {
      lines.push({ type: 'add', content: modLines[j], newNum: j + 1 })
      j++
    }
  }

  return lines
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  modifiedCode,
  filename,
  className = '',
}) => {
  const diffLines = useMemo(() => computeDiff(originalCode, modifiedCode), [originalCode, modifiedCode])

  const additions = diffLines.filter((l) => l.type === 'add').length
  const deletions = diffLines.filter((l) => l.type === 'remove').length

  return (
    <div className={`flex flex-col border border-white/10 rounded-xl overflow-hidden bg-neutral-950/80 font-mono text-xs ${className}`}>
      {filename && (
        <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/80 border-b border-white/10">
          <span className="text-neutral-300 font-semibold">{filename}</span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">+{additions}</span>
            <span className="text-rose-400 font-semibold">-{deletions}</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto divide-y divide-white/5 py-1">
        {diffLines.map((line, idx) => (
          <div
            key={idx}
            className={`flex items-stretch px-2 py-0.5 leading-5 select-text ${
              line.type === 'add'
                ? 'bg-emerald-950/40 text-emerald-300'
                : line.type === 'remove'
                ? 'bg-rose-950/40 text-rose-300'
                : 'text-neutral-400 hover:bg-white/5'
            }`}
          >
            <div className="w-8 text-right pr-2 text-neutral-600 select-none shrink-0 font-mono">
              {line.oldNum || ''}
            </div>
            <div className="w-8 text-right pr-2 text-neutral-600 select-none shrink-0 font-mono">
              {line.newNum || ''}
            </div>
            <div className="w-4 text-center select-none shrink-0">
              {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
            </div>
            <pre className="flex-1 overflow-x-auto whitespace-pre font-mono pl-1">
              {line.content || ' '}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
