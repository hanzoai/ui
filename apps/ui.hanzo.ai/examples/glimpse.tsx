import { Anchor, XStack } from "@hanzo/gui"
import {
  Glimpse,
  GlimpseContent,
  GlimpseDescription,
  GlimpseImage,
  GlimpseTitle,
  GlimpseTrigger,
} from "@hanzo/ui"

/** Default — rest a pointer on the link to see the page it points to before you follow it. */
export function Default() {
  return (
    <Glimpse>
      <GlimpseTrigger asChild>
        <Anchor href="https://www.hanzo.ai" target="_blank" rel="noopener noreferrer">
          hanzo.ai
        </Anchor>
      </GlimpseTrigger>
      <GlimpseContent>
        <GlimpseImage
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=640&h=360&fit=crop"
          alt="Hanzo AI"
        />
        <GlimpseTitle>Hanzo AI</GlimpseTitle>
        <GlimpseDescription>
          Frontier AI models, agent infrastructure, and the compute to run them.
        </GlimpseDescription>
      </GlimpseContent>
    </Glimpse>
  )
}

/** No image — a preview with only a title and description still lays out edge to edge. */
export function TextOnly() {
  return (
    <Glimpse>
      <GlimpseTrigger asChild>
        <Anchor href="https://lux.network" target="_blank" rel="noopener noreferrer">
          lux.network
        </Anchor>
      </GlimpseTrigger>
      <GlimpseContent>
        <GlimpseTitle>Lux Network</GlimpseTitle>
        <GlimpseDescription>
          A post-quantum, multi-consensus blockchain built for cross-chain interoperability.
        </GlimpseDescription>
      </GlimpseContent>
    </Glimpse>
  )
}

/** Broken image — a `src` that fails to load falls back to a glyph instead of the browser's own icon. */
export function BrokenImage() {
  return (
    <Glimpse>
      <GlimpseTrigger asChild>
        <Anchor href="https://example.com" target="_blank" rel="noopener noreferrer">
          example.com
        </Anchor>
      </GlimpseTrigger>
      <GlimpseContent>
        <GlimpseImage src="https://example.com/does-not-exist.png" alt="" />
        <GlimpseTitle>Example Domain</GlimpseTitle>
        <GlimpseDescription>Reserved for use in illustrative examples.</GlimpseDescription>
      </GlimpseContent>
    </Glimpse>
  )
}

/** Placement — the panel can open on any side of the trigger, with a shorter open delay. */
export function Placement() {
  return (
    <XStack gap="$6">
      <Glimpse openDelay={0}>
        <GlimpseTrigger asChild>
          <Anchor href="https://zoo.ngo" target="_blank" rel="noopener noreferrer">
            zoo.ngo
          </Anchor>
        </GlimpseTrigger>
        <GlimpseContent side="top">
          <GlimpseTitle>Zoo Labs Foundation</GlimpseTitle>
          <GlimpseDescription>
            Open, community-governed AI and science research.
          </GlimpseDescription>
        </GlimpseContent>
      </Glimpse>
    </XStack>
  )
}
