import { useState } from 'react'
import { YStack } from '@hanzo/gui'
import { FileTree, type Entry } from '@hanzo/ui/agents'

const FILES = ['src/app.tsx', 'src/lib/api.ts', 'src/lib/auth.ts', 'public/logo.svg', 'package.json', 'README.md']

/** Flat — every path at once; the folders are the ones the paths imply, folders first. */
export function Flat() {
  const [file, setFile] = useState<string | null>('src/lib/api.ts')
  return (
    <YStack width={280} height={260} borderWidth={1} borderColor="$borderColor" rounded="$4">
      <FileTree files={FILES} value={file} onSelect={setFile} />
    </YStack>
  )
}

/** Lazy — one directory per call, the way a repository answers, read the first time a folder opens. */
export function Lazy() {
  const load = async (dir: string): Promise<Entry[]> => {
    await new Promise((r) => setTimeout(r, 300))
    if (dir === '') return [{ path: 'cmd', kind: 'dir' }, { path: 'go.mod', kind: 'file' }]
    if (dir === 'cmd') return [{ path: 'cmd/server', kind: 'dir' }]
    return [{ path: `${dir}/main.go`, kind: 'file' }]
  }
  return (
    <YStack width={280} height={220} borderWidth={1} borderColor="$borderColor" rounded="$4">
      <FileTree load={load} />
    </YStack>
  )
}
