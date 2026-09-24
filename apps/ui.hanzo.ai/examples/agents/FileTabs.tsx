import { useState } from 'react'
import { YStack } from '@hanzo/gui'
import { FileTabs, type OpenFile } from '@hanzo/ui/agents'

/** Editing — open files as tabs over the editor; an edit marks its tab until the host saves it. */
export function Editing() {
  const [files, setFiles] = useState<OpenFile[]>([
    { path: 'src/app.tsx', content: 'export function App() {\n  return <h1>MEGA Shop</h1>\n}\n' },
    { path: 'README.md', content: '# MEGA Shop\n' },
    { path: 'public/hero.png', error: 'A binary file — open it from the preview.' },
  ])
  const [shown, setShown] = useState<string | null>('src/app.tsx')
  return (
    <YStack width="100%" maxW={640} height={280} borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
      <FileTabs
        files={files}
        value={shown}
        onSelect={setShown}
        onClose={(path) => setFiles((all) => all.filter((f) => f.path !== path))}
        onChange={(path, content) =>
          setFiles((all) => all.map((f) => (f.path === path ? { ...f, content, dirty: true } : f)))
        }
      />
    </YStack>
  )
}

/** Read-only — no `onChange`, so the field shows the file and takes no edits. */
export function ReadOnly() {
  return (
    <YStack width="100%" maxW={640} height={200} borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
      <FileTabs files={[{ path: 'go.mod', content: 'module widgets\n' }]} value="go.mod" onSelect={() => {}} />
    </YStack>
  )
}
