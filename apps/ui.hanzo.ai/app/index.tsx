import { H1, H2, Paragraph, Text, YStack } from '@hanzo/gui'
import { Head, useLoader } from 'one'
import { useMemo } from 'react'

import { brand } from '~/brand'
import { Frame, slug, type Heading } from '~/features/docs'
import { Cards } from '~/features/group'

export async function loader() {
  const { groups, overview, sections } = await import('~/catalog')
  return { groups: groups.map(overview), sections: sections() }
}

/** Every module the package exports, one card each, in the order the package names them. */
export default function Index() {
  const { groups, sections } = useLoader(loader)
  const headings = useMemo<Heading[]>(() => groups.map((g) => ({ id: slug(g.title), title: g.title, level: 2 })), [groups])
  return (
    <Frame sections={sections} headings={headings}>
      <Head>
        <title>{brand.name}</title>
        <meta name="description" content={`Every component ${brand.name} ships, rendered from the package itself.`} />
      </Head>
      <YStack gap="$3">
        <H1>{brand.name}</H1>
        <Paragraph size="$5" color="$color11" maxW={640}>
          One component layer for web, native and desktop{brand.framework ? `, built on ${brand.framework.name}` : ''}. Each page
          is a module the package exports: what it renders, the code that rendered it, and its types quoted from the source.
        </Paragraph>
        <Text fontFamily="$mono" fontSize={13} color="$color11">
          npm install {brand.name}
        </Text>
      </YStack>
      {groups.map((g) => (
        <YStack key={g.group} gap="$3">
          <H2 id={slug(g.title)} size="$7">
            {g.title}
          </H2>
          <Paragraph color="$color11" maxW={640}>
            {g.blurb}
          </Paragraph>
          <Text fontFamily="$mono" fontSize={13} color="$color11">
            {g.from}
          </Text>
          <Cards entries={g.entries} />
        </YStack>
      ))}
    </Frame>
  )
}
