import { useState } from 'react'
import { SizableText, YStack } from '@hanzo/gui'
import { Console, type Line } from '@hanzo/ui/agents'

/** Dock — the run's lines and the page's console in one log; drag, click or arrow the grip to size it. */
export function Dock() {
  const [height, setHeight] = useState(240)
  const [lines, setLines] = useState<Line[]>([
    { id: 1, level: 'info', text: 'cloning hanzo/shop at main', source: 'run' },
    { id: 2, level: 'log', text: 'pnpm install — 412 packages', source: 'run' },
    { id: 3, level: 'warn', text: 'peer react@19 wanted by an old plugin', source: 'run' },
    { id: 4, level: 'error', text: 'Uncaught TypeError: cart is undefined', source: 'page' },
  ])
  return (
    <YStack width="100%" height={320} justify="flex-end" borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
      <Console
        lines={lines}
        height={height}
        onHeight={setHeight}
        onClear={() => setLines([])}
        onRun={(command) => setLines((l) => [...l, { id: l.length + 1, level: 'log', text: `$ ${command}`, source: 'you' }])}
        status={
          <SizableText size="$1" color="$soft">
            main
          </SizableText>
        }
      />
    </YStack>
  )
}

/** Shut — only the header, with the error count on the log tab. */
export function Shut() {
  const [height, setHeight] = useState(36)
  return (
    <YStack width="100%">
      <Console lines={[{ id: 1, level: 'error', text: 'build failed' }]} height={height} onHeight={setHeight} />
    </YStack>
  )
}
