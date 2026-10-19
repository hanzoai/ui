'use client'

/**
 * The record kit's display parts in the gallery — tags in every hue, chips,
 * avatars, keycaps, counts, statuses, tiles and swatches — so the sheet holds
 * every rule they render, and the browser suites see them in both themes.
 * twenty-ui's data-display parts (MIT, NOTICE), regular and compact.
 */
import { Building2, Heart, Lock, Pencil, Plus, User, X } from '@hanzogui/lucide-icons-2'
import { hues, neutrals } from '@hanzo/tokens/data'
import { Section } from './section'
import { Tag, type TagVariant } from '../backends/gui/tag'
import { Tags } from '../backends/gui/tags'
import { Chip, type ChipVariant } from '../backends/gui/chip'
import { TruncatedText } from '../backends/gui/truncated-text'
import { Avatar, type AvatarSize, type AvatarShape } from '../backends/gui/avatar'
import { AvatarGroup } from '../backends/gui/avatar-group'
import { Shortcut } from '../backends/gui/shortcut'
import { Kbd } from '../backends/gui/kbd'
import { OverflowingList } from '../backends/gui/overflowing-list'
import { Badge, type BadgeSize } from '../backends/gui/badge'
import { Status } from '../backends/gui/status'
import { IconTile } from '../backends/gui/icon-tile'
import { ColorSample } from '../backends/gui/color-sample'
import { StackIcon } from '../backends/gui/stack-icon'
import { Heading } from '../backends/gui/heading'
import { Label } from '../backends/gui/label'
import { Density } from '../backends/gui/density'
import { Crossfade } from '../motion'

const NOOP = () => {}
const ALL = [...hues, ...neutrals]
const TAG_VARIANTS: TagVariant[] = ['soft', 'solid', 'outline', 'ghost']
const CHIP_VARIANTS: ChipVariant[] = ['ghost', 'soft', 'solid']
const AVATAR_SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const AVATAR_SHAPES: AvatarShape[] = ['square', 'rounded', 'circle']
const BADGE_SIZES: BadgeSize[] = ['xs', 'sm', 'md']
const PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Edsger Dijkstra', 'Barbara Liskov', 'Donald Knuth']

function Parts() {
  return (
    <>
      <Section name="tag">
        {/* Every hue, soft and solid: the two variants that paint a hue's fill. */}
        {ALL.map((hue) => (
          <Tag key={`s-${hue}`} color={hue}>
            {hue}
          </Tag>
        ))}
        {ALL.map((hue) => (
          <Tag key={`f-${hue}`} color={hue} variant="solid">
            {hue}
          </Tag>
        ))}
        {TAG_VARIANTS.map((variant) => (
          <Tag key={variant} color="blue" variant={variant} weight="medium" startIcon={<Building2 />}>
            {variant}
          </Tag>
        ))}
        <Tag variant="outline" color="transparent" borderStyle="dashed">
          No value
        </Tag>
        <Tag color="transparent">transparent</Tag>
        <Tag color="green" onPress={NOOP}>
          pressable
        </Tag>
        <Tag color="red" disabled>
          disabled
        </Tag>
        <Tag color="purple" maxW={96}>
          A tag whose label is far too long for it
        </Tag>
        <Tags tags={[{ id: 'a', label: 'Lead', color: 'sky' }, { id: 'b', label: 'Plain' }]} onRemove={NOOP} />
      </Section>

      <Section name="chip">
        {CHIP_VARIANTS.map((variant) => (
          <Chip key={variant} variant={variant} label={variant} />
        ))}
        {CHIP_VARIANTS.map((variant) => (
          <Chip key={`p-${variant}`} variant={variant} label={`${variant} press`} onPress={NOOP} />
        ))}
        <Chip size="md" label="Acme" startElement={<Avatar size="md" name="Acme" />} onPress={NOOP} />
        <Chip shape="round" variant="soft" color="secondary" label="Round" />
        <Chip weight="medium" label="Medium" />
        <Chip label="Not shared" startElement={<Lock size={14} />} variant="soft" />
        <Chip
          label="With end"
          endElementDivider
          endElement={<X size={12} />}
          variant="soft"
        />
        <Chip label="Disabled" disabled onPress={NOOP} />
        <Chip label="A chip whose name runs past its width" maxW={120} variant="soft" />
        <Chip href="https://hanzo.ai" label="Link chip" />
      </Section>

      <Section name="truncated-text">
        <TruncatedText text="One line that is far too long for the narrow box it sits in, cut with an ellipsis" maxW={180} size="$2" />
        <TruncatedText text={'Two lines, clamped, wrapping anywhere, with a word that is longer than everything else'} lineClamp={2} maxW={180} size="$2" />
        <TruncatedText text="Focusable" isFocusable size="$2" />
      </Section>

      <Section name="avatar-record">
        {AVATAR_SIZES.map((size) => (
          <Avatar key={size} size={size} name="Ada Lovelace" />
        ))}
        {AVATAR_SHAPES.map((shape) => (
          <Avatar key={shape} size="lg" shape={shape} name={shape} />
        ))}
        <Avatar size="lg" name="Grace Hopper" variant="outline" />
        <Avatar size="lg" icon={<User />} />
        <Avatar size="lg" name="" />
        <Avatar size="lg" name="Ring" ring />
        <Avatar size="lg" name="Pulsing" pulsing />
        <Avatar size="lg" shape="circle" name="Press" onPress={NOOP} />
        {/* Every hue an initial can be drawn in: the hash picks one per name. */}
        {hues.map((hue) => (
          <Avatar key={hue} size="md" name={hue} colorSeed={hue} />
        ))}
      </Section>

      <Section name="avatar-group">
        <AvatarGroup avatars={PEOPLE.map((p) => <Avatar key={p} size="lg" shape="circle" name={p} ring />)} />
        <AvatarGroup avatars={PEOPLE.slice(0, 3).map((p) => <Avatar key={p} size="md" name={p} ring />)} total={12} />
        <AvatarGroup avatars={PEOPLE.map((p) => <Avatar key={p} size="lg" shape="circle" name={p} ring />)} overflowShape="circle" overlap="left" />
      </Section>

      <Section name="shortcut">
        <Shortcut keys={['Mod', 'K']} platform="mac" />
        <Shortcut keys={['Mod', 'K']} platform="other" />
        <Shortcut keys={[['G'], ['P']]} />
        <Shortcut keys={['Shift', 'Enter']} variant="text" platform="mac" />
        <Shortcut keys={['Mod', 'Enter']} variant="button" platform="mac" />
        <Shortcut keys={['Escape']} visibility="desktop" />
        <Kbd variant="cap">⌘</Kbd>
      </Section>

      <Section name="overflowing-list">
        <OverflowingList maxW={220} showOverflowCount="always">
          {['Lead', 'Customer', 'Partner', 'Investor', 'Press'].map((t, i) => (
            <Tag key={t} color={hues[i * 3]}>
              {t}
            </Tag>
          ))}
        </OverflowingList>
        <OverflowingList maxW={200}>
          {['ada@hanzo.ai', 'grace@hanzo.ai', 'alan@hanzo.ai'].map((e) => (
            <Chip key={e} label={e} variant="soft" />
          ))}
        </OverflowingList>
      </Section>

      <Section name="badge-record">
        {BADGE_SIZES.map((size) => (
          <Badge key={size} size={size} variant="muted">
            {size === 'xs' ? '3' : '12'}
          </Badge>
        ))}
        <Badge size="sm" variant="secondary">
          Soon
        </Badge>
        <Badge size="md" variant="accent">
          New
        </Badge>
        <Badge size="sm" variant="inherit">
          4
        </Badge>
        <Badge size="sm" shape="circle" variant="muted">
          2
        </Badge>
      </Section>

      <Section name="status-record">
        {['gray', 'red', 'teal', 'orange', 'blue', 'chartreuse'].map((c) => (
          <Status key={c} color={c}>
            {c}
          </Status>
        ))}
        {(['success', 'warning', 'error', 'info', 'default'] as const).map((c) => (
          <Status key={c} color={c}>
            {c}
          </Status>
        ))}
        <Status color="teal" loading>
          Importing
        </Status>
        <Status color="green" weight="medium" dot={false}>
          Synced
        </Status>
      </Section>

      <Section name="icon-tile">
        {ALL.map((hue) => (
          <IconTile key={hue} color={hue} icon={<Building2 />} />
        ))}
        <IconTile icon={<User />} />
        <StackIcon icon={<Building2 size={16} />} stackedIcon={<Plus size={10} />} />
      </Section>

      <Section name="color-sample">
        {ALL.map((hue) => (
          <ColorSample key={hue} colorName={hue} />
        ))}
        <ColorSample colorName="blue" variant="circle" />
        <ColorSample color="#3e63dd" variant="circle" />
      </Section>

      <Section name="heading-label">
        <Heading size="$2" tone="primary">
          Section title
        </Heading>
        <Heading size="$1" tone="secondary">
          Group header
        </Heading>
        <Heading size="$4" tone="tertiary">
          Dialog title
        </Heading>
        <Label variant="section">Favorites</Label>
        <Label variant="section-sm">Workspace</Label>
        <Crossfade isActive activeIcon={<X size={14} />} inactiveIcon={<Pencil size={14} />} />
        <Crossfade isActive={false} activeIcon={<Heart size={14} />} inactiveIcon={<Heart size={14} />} />
      </Section>
    </>
  )
}

/** The parts regular, then the density-sensitive ones (chips, tags) under compact. */
export function Display() {
  return (
    <>
      <Parts />
      <Density value="compact">
        <Section name="display-compact">
          <Tag color="amber">compact tag</Tag>
          <Chip label="compact chip" variant="soft" startElement={<Avatar size="sm" name="Compact" />} />
          <Status color="green">compact status</Status>
        </Section>
      </Density>
    </>
  )
}
