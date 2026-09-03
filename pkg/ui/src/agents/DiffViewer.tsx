import React, { useMemo } from 'react'

export interface DiffViewerProps {
  originalCode: string
  modifiedCode: string
  filename?: string
  language?: string
  className?: string
  style?: React.CSSProperties
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
    } else {
      lines.push({ type: 'add', content: modLines[j], newNum: j + 1 })
      j++
    }
  }

  return lines
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  modifiedCode,
  filename = 'changes.diff',
  language = 'typescript',
  className = '',
  style,
}) => {
  const diffLines = useMemo(() => computeDiff(originalCode, modifiedCode), [originalCode, modifiedCode])

  const additions = diffLines.filter((l) => l.type === 'add').length
  const deletions = diffLines.filter((l) => l.type === 'remove').length

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0c0c0e',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        overflow: 'hidden',
        fontSize: 12,
        fontFamily: 'monospace',
        ...style,
      }}
      aria-label="Code Diff Viewer"
    >
      {filename && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'rgba(23, 23, 23, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <span style={{ color: '#d4d4d4', fontWeight: 600 }}>{filename}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#34d399', fontWeight: 600 }}>+{additions}</span>
            <span style={{ color: '#fb7185', fontWeight: 600 }}>-{deletions}</span>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', padding: '4px 0' }}>
        {diffLines.map((line, idx) => {
          const isAdd = line.type === 'add'
          const isRemove = line.type === 'remove'
          const bg = isAdd ? 'rgba(16, 185, 129, 0.12)' : isRemove ? 'rgba(244, 63, 94, 0.12)' : 'transparent'
          const textColor = isAdd ? '#6ee7b7' : isRemove ? '#fda4af' : '#d4d4d4'

          return (
            <div
              key={idx}
              style={{ display: 'flex', alignItems: 'flex-start', padding: '1px 8px', backgroundColor: bg, color: textColor }}
            >
              <div style={{ width: 32, textAlign: 'right', paddingRight: 8, color: '#525252', userSelect: 'none', flexShrink: 0, fontFamily: 'monospace' }}>
                {line.oldNum ?? ''}
              </div>
              <div style={{ width: 32, textAlign: 'right', paddingRight: 8, color: '#525252', userSelect: 'none', flexShrink: 0, fontFamily: 'monospace' }}>
                {line.newNum ?? ''}
              </div>
              <div style={{ width: 16, textAlign: 'center', userSelect: 'none', flexShrink: 0 }}>
                {isAdd ? '+' : isRemove ? '-' : ' '}
              </div>
              <pre style={{ flex: 1, overflowX: 'auto', whiteSpace: 'pre', fontFamily: 'monospace', paddingLeft: 4, margin: 0 }}>
                {line.content || ' '}
              </pre>
            </div>
          )
        })}
      </div>
    </div>
  )
}
