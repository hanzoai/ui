import { H1, Paragraph, YStack } from '@hanzo/gui'
import { Head } from 'one'
import { useMemo } from 'react'

import { brand } from '~/brand'
import type { Doc } from '~/mdx'
import { Frame } from './docs'
import { components, render } from './mdx'

/** One docs page: its title and description, then the body the page wrote. */
export function Page({ title, description, code, headings, sections }: Doc) {
  const Body = useMemo(() => render(code), [code])
  return (
    <Frame sections={sections} headings={headings}>
      <Head>
        <title>{`${title} — ${brand.name}`}</title>
        <meta name="description" content={description} />
      </Head>
      <YStack gap="$3">
        <H1>{title}</H1>
        {description ? (
          <Paragraph size="$5" color="$color11" maxW={640}>
            {description}
          </Paragraph>
        ) : null}
      </YStack>
      <YStack className="doc" gap="$4">
        <Body components={components} />
      </YStack>
    </Frame>
  )
}
