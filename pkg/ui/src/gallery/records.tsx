'use client'

/**
 * The record kit in the gallery: the parts merged from twenty-ui (MIT, NOTICE),
 * every variant, at both densities.
 *
 * A module of the one gallery rather than a second list: `Gallery` renders it,
 * so the stylesheet generator, the render test and the consumer screenshots all
 * see these exactly as they see everything else. Each group of the merge adds
 * its sections here, and each section is rendered twice where density changes
 * what it draws — once regular, once inside `<Density value="compact">`.
 */
import { ChevronDown, Plus, Search, X } from '@hanzogui/lucide-icons-2'
import { Section } from './section'
import { Button, type ButtonSize } from '../backends/gui/button'
import { Input } from '../backends/gui/input'
import { InputGroup } from '../backends/gui/input-group'
import { Density } from '../backends/gui/density'

const NOOP = () => {}

/** The record sizes, beside the regular ones they sit under. */
const SIZES: ButtonSize[] = ['xs', 'icon-xs', 'icon-2xs']

export function Records() {
  return (
    <>
      <Section name="button-record">
        {SIZES.map((size) => (
          <Button key={size} size={size} variant="ghost" aria-label={size}>
            {size.startsWith('icon') ? <Plus /> : size}
          </Button>
        ))}
        <Button startIcon={<Plus />}>New record</Button>
        <Button size="sm" variant="outline" endIcon={<ChevronDown />}>
          Sort
        </Button>
        <Button size="xs" variant="ghost" emphasis="subtle" startIcon={<Plus />}>
          Add filter
        </Button>
        <Button size="icon-xs" variant="ghost" emphasis="subtle" aria-label="Remove">
          <X />
        </Button>
      </Section>

      <Section name="input-record">
        <Input size="sm" placeholder="sm" />
        <Input size="xs" placeholder="xs" />
        <Input size="sm" placeholder="Invalid" aria-invalid />
        <InputGroup start={<Search size={16} />}>
          <Input placeholder="Search any field" />
        </InputGroup>
        <InputGroup size="sm" start={<Search size={16} />} end={<Button size="icon-2xs" variant="ghost" aria-label="Clear" onPress={NOOP}><X /></Button>}>
          <Input placeholder="sm group" />
        </InputGroup>
        <InputGroup size="xs" end={<Button size="icon-2xs" variant="ghost" aria-label="Clear"><X /></Button>}>
          <Input placeholder="xs group" aria-invalid />
        </InputGroup>
        <InputGroup size="sm" start={<Search size={16} />}>
          <Input placeholder="Disabled" disabled />
        </InputGroup>
      </Section>

      <Density value="compact">
        <Section name="density-compact">
          <Button>Update view</Button>
          <Button variant="ghost" startIcon={<Plus />}>
            Add filter
          </Button>
          <Button variant="primary">Save</Button>
          <Input placeholder="Compact field" />
          <InputGroup start={<Search size={16} />}>
            <Input placeholder="Compact group" />
          </InputGroup>
        </Section>
      </Density>
    </>
  )
}
