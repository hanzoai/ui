'use client'

/**
 * The record kit's icons in the gallery: stored names drawn by Glyph (a Lucide
 * name, Tabler names through their pairs, an unknown object's fallback) and the
 * IconPicker's trigger. Glyph draws its box on the server and its icon once the
 * one icon chunk has loaded, so a server render shows the boxes.
 */
import { Section } from './section'
import { Glyph, IconPicker } from '../backends/gui/icon-picker'
import { FIELD_ICONS } from '../backends/gui/icons'

export function IconsGallery() {
  return (
    <Section name="icons">
      <Glyph name="Building2" />
      <Glyph name="IconBuildingSkyscraper" />
      <Glyph name="IconUser" size={14} />
      <Glyph name="IconNoSuchThing" kind="object" size={20} />
      {Object.entries(FIELD_ICONS)
        .slice(0, 6)
        .map(([type, name]) => (
          <Glyph key={type} name={name} />
        ))}
      <IconPicker value="Building2" label="Object icon" />
      <IconPicker value="IconTargetArrow" kind="object" label="Opportunity icon" disabled />
    </Section>
  )
}
