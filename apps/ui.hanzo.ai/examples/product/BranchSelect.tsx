import { useState } from 'react'
import { XStack } from '@hanzo/gui'
import { BranchSelect } from '@hanzo/ui/product'

const BRANCHES = ['main', 'admin-customer', 'agentnode', 'auto-native', 'backup/seo', 'books', 'connector']

/** The branch a run starts from — rows may be bare names or `{ name }`, whichever the host's API answers. */
export function Default() {
  const [branch, setBranch] = useState('main')
  return (
    <XStack pt={240}>
      <BranchSelect
        value={branch}
        onChange={setBranch}
        load={async (q) => ({ branches: BRANCHES.filter((b) => b.includes(q)).map((name) => ({ name })) })}
      />
    </XStack>
  )
}
