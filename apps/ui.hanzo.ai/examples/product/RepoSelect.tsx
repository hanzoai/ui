import { useState } from 'react'
import { XStack } from '@hanzo/gui'
import { RepoSelect, type Repo, type RepoLoad } from '@hanzo/ui/product'

const REPOS: Repo[] = [
  { owner: 'hanzo-inc', name: 'cloud', private: true },
  { owner: 'acmglobaltech', name: 'site' },
  { owner: 'activeuser', name: 'activeuser.js' },
  { owner: 'ad-xyz', name: 'openrtb' },
  { owner: 'arcalabs', name: 'ethereum-reader' },
]

/** A mock loader: the host's API in the shape the chip reads — a page of repos and a cursor. */
const load: RepoLoad = async (q) => ({
  repos: REPOS.filter((r) => `${r.owner}/${r.name}`.includes(q)),
  next: null,
})

/** Which repository a run works in — the chosen one pinned first, a troubleshooting link under the list. */
export function Composer() {
  const [repo, setRepo] = useState<Repo>(REPOS[0])
  return (
    <XStack pt={260}>
      <RepoSelect
        value={repo}
        onChange={setRepo}
        load={load}
        troubleshoot={{ label: 'Troubleshoot GitHub connection', href: '/docs' }}
      />
    </XStack>
  )
}

/** With a row action — Ctrl+Enter or a click runs it on the row under the cursor. */
export function WithAction() {
  const [added, setAdded] = useState<string[]>([])
  return (
    <XStack pt={260} gap="$3" items="center">
      <RepoSelect
        onChange={() => {}}
        load={load}
        action={{ label: 'Add to project', onPress: (r) => setAdded((a) => [...a, r.name]) }}
      />
      {added.length ? `Added: ${added.join(', ')}` : null}
    </XStack>
  )
}
