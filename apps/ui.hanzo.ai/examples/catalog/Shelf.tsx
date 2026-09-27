import { useState } from 'react'
import { XStack } from '@hanzo/gui'
import { BookOpen, Bot, Plug, Puzzle } from '@hanzogui/lucide-icons-2'
import { Add, Shelf, Tile, Tiles } from '@hanzo/ui/catalog'

const KINDS = [
  { id: 'skills', label: 'Skills', icon: BookOpen },
  { id: 'connectors', label: 'Connectors', icon: Plug },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
  { id: 'agents', label: 'Agents', icon: Bot },
]

const SKILLS = [
  { name: 'git_repos', detail: 'List the forge’s repositories.', from: 'git' },
  { name: 'git_branches', detail: 'List a repository’s branches.', from: 'git' },
  { name: 'kms_secrets', detail: 'Read the names of an org’s secrets.', from: 'kms' },
]

/** The page — the kinds as tabs, Yours and Discover, one search and one Add over both, and the cards. */
export function Default() {
  const [tab, setTab] = useState('skills')
  const [view, setView] = useState('discover')
  const [query, setQuery] = useState('')
  const [added, setAdded] = useState<string[]>(['git_branches'])
  const shown = SKILLS.filter((s) => s.name.includes(query.trim()))
  return (
    <XStack height={560} width="100%">
      <Shelf
        title="Customize"
        detail="What the agent brings to a run: the skills it knows, the connectors it calls, the plugins it runs."
        tabs={KINDS}
        tab={tab}
        onTab={setTab}
        view={view}
        onView={setView}
        search="Search skills"
        query={query}
        onQuery={setQuery}
        add="New skill"
        onAdd={() => {}}
      >
        <Tiles label="Skills to add">
          {shown.map((s) => (
            <Tile
              key={s.name}
              title={s.name}
              detail={s.detail}
              meta={s.from}
              onOpen={() => {}}
              action={<Add name={s.name} added={added.includes(s.name)} onPress={() => setAdded([...added, s.name])} />}
            />
          ))}
        </Tiles>
      </Shelf>
    </XStack>
  )
}
