import { H1, Paragraph, Text, View, YStack } from '@hanzo/gui'
import type { Href } from 'one'
import { Head, Link } from 'one'

import { brand } from '~/brand'
import type { Overview } from '~/catalog'
import { Frame, type Section } from './docs'

export type Card = Overview['entries'][number]

/** One card per module, in the order the package names them. */
export const Cards = ({ entries }: { entries: Card[] }) => (
  <View display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap="$3">
    {entries.map((e) => (
      <Link key={e.href} href={e.href as Href} style={{ textDecorationLine: 'none', display: 'flex' }}>
        <YStack flex={1} p="$4" gap="$1" rounded="$4" borderWidth={1} borderColor="$borderColor" hoverStyle={{ borderColor: '$color8' }}>
          <Text fontWeight="600">{e.title}</Text>
          <Text fontSize={12} color="$color10">
            {e.members} export{e.members === 1 ? '' : 's'}
          </Text>
        </YStack>
      </Link>
    ))}
  </View>
)

/** A group's own page: what it is, where it imports from, and its modules. */
export function Group({ title, blurb, from, entries, sections }: Overview & { sections: Section[] }) {
  return (
    <Frame sections={sections}>
      <Head>
        <title>{`${title} — ${brand.name}`}</title>
      </Head>
      <YStack gap="$3">
        <H1>{title}</H1>
        <Paragraph size="$5" color="$color11" maxW={640}>
          {blurb}
        </Paragraph>
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          {from}
        </Text>
      </YStack>
      <Cards entries={entries} />
    </Frame>
  )
}
