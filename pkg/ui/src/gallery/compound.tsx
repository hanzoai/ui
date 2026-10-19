'use client'

/**
 * The record kit's compound controls in the gallery: grouped buttons and the
 * Button axes they hand down, every tone on every variant that takes one, the
 * loading positions — regular and compact. A module of the one gallery
 * (`gallery/records.tsx` renders it), so the stylesheet generator, the render
 * test and the consumer screenshots see these as they see everything else.
 */
import { ChevronDown, Columns3, Minus, Plus, Rows3, Trash2 } from '@hanzogui/lucide-icons-2'
import { Section } from './section'
import { Button, type ButtonTone, type ButtonVariant } from '../backends/gui/button'
import { ButtonGroup } from '../backends/gui/button-group'
import { Density } from '../backends/gui/density'
import { NumberField } from '../backends/gui/number-field'
import { Input } from '../backends/gui/input'
import { InputGroup } from '../backends/gui/input-group'
import { CurrencyPicker } from '../backends/gui/currency-picker'
import { PhoneCountryPicker } from '../backends/gui/phone-country-picker'
import { CountrySelect } from '../backends/gui/country-select'
import { PrimaryButton } from '../product/PrimaryButton'
import { Segmented } from '../product/Filters'
import { ImageInput } from '../backends/gui/image-input'
import { ComboBox } from '../product/ComboBox'

const NOOP = () => {}

/** Sample data: the pickers are data-free, so the gallery brings its own. */
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', disabled: true },
]
const PHONES = [
  { value: 'US', label: 'United States', callingCode: '1' },
  { value: 'FR', label: 'France', callingCode: '33' },
  { value: 'DE', label: 'Germany', callingCode: '49' },
]
const COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'GB', label: 'United Kingdom of Great Britain and Northern Ireland' },
]

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
        <Button size="sm" shortcut={['Mod', 'Enter']}>
          Update view
        </Button>
        <Button size="sm" variant="ghost" shortcut={[['G'], ['P']]}>
          Go to people
        </Button>
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
        <PrimaryButton>Get started</PrimaryButton>
        <ComboBox value="" onChange={NOOP} options={[{ value: 'kai-1' }, { value: 'enso-flash' }]} placeholder="Model" />
      </Section>

      <Section name="number-field">
        <NumberField aria-label="Amount" defaultValue={1234.5} locale="en-US" />
        <NumberField aria-label="Seats" defaultValue={2} min={1} max={150} buttons />
        <NumberField aria-label="Decimals" size="sm" defaultValue={2} min={0} max={100} buttons />
        <NumberField aria-label="Limit" size="xs" defaultValue={10} buttons readOnly />
        <NumberField aria-label="Rate" size="sm" defaultValue={0.25} format={{ style: 'percent' }} />
        <NumberField aria-label="Invalid" size="sm" defaultValue={3} aria-invalid />
      </Section>

      <Section name="pickers">
        <InputGroup>
          <CurrencyPicker currencies={CURRENCIES} defaultValue="USD" />
          <NumberField aria-label="Amount" defaultValue={1200} />
        </InputGroup>
        <InputGroup size="sm">
          <CurrencyPicker currencies={CURRENCIES} />
          <Input aria-label="Amount, no currency" placeholder="0.00" />
        </InputGroup>
        <InputGroup size="sm">
          <PhoneCountryPicker countries={PHONES} defaultValue="FR" />
          <Input aria-label="Phone number" placeholder="6 12 34 56 78" />
        </InputGroup>
        <InputGroup size="xs">
          <PhoneCountryPicker countries={PHONES} />
          <Input aria-label="Phone number, no country" placeholder="Number" />
        </InputGroup>
        <InputGroup size="sm">
          <CurrencyPicker currencies={CURRENCIES} defaultValue="EUR" disabled />
          <Input aria-label="Disabled amount" disabled placeholder="0.00" />
        </InputGroup>
        <CountrySelect countries={COUNTRIES} defaultValue="GB" label="Country" />
        <CountrySelect countries={COUNTRIES} size="sm" aria-label="Country, none" />
        <CountrySelect countries={[]} size="xs" aria-label="Country, empty" />
      </Section>

      <Section name="segmented">
        <Segmented
          variant="track"
          aria-label="When"
          options={[
            { label: 'Send now', value: 'now' },
            { label: 'Schedule', value: 'later' },
          ]}
          value="now"
          onChange={NOOP}
        />
        <Segmented
          variant="track"
          trackSize="sm"
          itemWidth="content"
          aria-label="Layout"
          options={[
            { label: '', value: 'table', icon: <Rows3 size={16} />, 'aria-label': 'Table' },
            { label: '', value: 'kanban', icon: <Columns3 size={16} />, 'aria-label': 'Kanban' },
          ]}
          value="kanban"
          onChange={NOOP}
        />
        <Segmented
          variant="track"
          disabled
          aria-label="Disabled choice"
          options={[
            { label: 'Left', value: 'l' },
            { label: 'Right', value: 'r' },
          ]}
          value="l"
          onChange={NOOP}
        />
      </Section>

      <Section name="image-input">
        <ImageInput title="Logo" helperText="PNG or JPG, up to 2MB" />
        <ImageInput title="Photo" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="" />
        <ImageInput title="Uploading" isUploading />
        <ImageInput title="Broken" errorMessage="That file is too large" />
        <ImageInput title="Off" disabled />
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
          <NumberField aria-label="Compact amount" defaultValue={42} buttons />
          <InputGroup>
            <CurrencyPicker currencies={CURRENCIES} defaultValue="GBP" />
            <NumberField aria-label="Compact grouped amount" defaultValue={99} />
          </InputGroup>
          <CountrySelect countries={COUNTRIES} defaultValue="DE" aria-label="Compact country" />
          <PrimaryButton>Continue</PrimaryButton>
          <ComboBox value="" onChange={NOOP} options={[{ value: 'kai-1' }, { value: 'enso-flash' }]} placeholder="Model" />
        </Section>
      </Density>
    </>
  )
}
