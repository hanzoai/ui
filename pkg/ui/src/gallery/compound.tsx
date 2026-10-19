'use client'

/**
 * The record kit's compound controls in the gallery: grouped buttons and the
 * Button axes they hand down, every tone on every variant that takes one, the
 * loading positions — regular and compact. A module of the one gallery
 * (`gallery/records.tsx` renders it), so the stylesheet generator, the render
 * test and the consumer screenshots see these as they see everything else.
 */
import { ChevronDown, Minus, Plus, Trash2 } from '@hanzogui/lucide-icons-2'
import { Section } from './section'
import { Button, type ButtonTone, type ButtonVariant } from '../backends/gui/button'
import { ButtonGroup } from '../backends/gui/button-group'
import { Density } from '../backends/gui/density'

const NOOP = () => {}

const TONES: ButtonTone[] = ['accent', 'danger', 'success']
/** The variants a tone restates: outline-shaped, ghost, soft and solid. */
const TONED: ButtonVariant[] = ['default', 'outline', 'ghost', 'secondary', 'primary']

export function Compound() {
  return (
    <>
      <Section name="button-group">
        <ButtonGroup aria-label="Update view">
          <Button>Update view</Button>
          <Button size="icon" aria-label="More update options">
            <ChevronDown size={16} />
          </Button>
        </ButtonGroup>
        <ButtonGroup attached={false} aria-label="Unattached">
          <Button size="sm">Day</Button>
          <Button size="sm">Week</Button>
          <Button size="sm">Month</Button>
        </ButtonGroup>
        <ButtonGroup framed attached={false} size="icon-2xs" variant="ghost" aria-label="Zoom">
          <Button aria-label="Zoom out">
            <Minus />
          </Button>
          <Button aria-label="Zoom in">
            <Plus />
          </Button>
        </ButtonGroup>
        <ButtonGroup framed size="xs" variant="ghost" aria-label="Cell actions">
          <Button>Open</Button>
          <Button>Copy</Button>
        </ButtonGroup>
      </Section>

      <Section name="button-tone">
        {TONES.flatMap((tone) =>
          TONED.map((variant) => (
            <Button key={`${tone}-${variant}`} tone={tone} variant={variant} size="sm">
              {`${tone} ${variant}`}
            </Button>
          )),
        )}
        <Button tone="danger" variant="ghost" size="icon-xs" aria-label="Delete">
          <Trash2 />
        </Button>
      </Section>

      <Section name="button-state">
        <Button isLoading loadingPosition="center">
          Saving
        </Button>
        <Button isLoading loadingPosition="end" variant="outline">
          Saving
        </Button>
        <Button elevated>Continue</Button>
        <Button elevated variant="primary">
          Continue
        </Button>
        <Button size="icon-sm" shape="round" aria-label="Add">
          <Plus size={16} />
        </Button>
        <Button disabled focusableWhenDisabled onPress={NOOP}>
          Merge
        </Button>
        <Button size="icon-sm" variant="ghost" tooltip="Close side panel">
          <Minus size={16} />
        </Button>
        <Button fullWidth variant="outline">
          Full width
        </Button>
      </Section>

      <Density value="compact">
        <Section name="button-group-compact">
          <ButtonGroup aria-label="Update view, compact">
            <Button>Update view</Button>
            <Button size="icon-sm" aria-label="More update options">
              <ChevronDown size={14} />
            </Button>
          </ButtonGroup>
          <Button tone="danger" variant="outline">
            Delete
          </Button>
        </Section>
      </Density>
    </>
  )
}
