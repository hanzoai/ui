// Wire the built-in field types to their renderers. Importing this module (the
// barrel does) registers everything. Every non-system type is now fully
// EDITABLE — relation (record picker), files, links, json, fullName, address
// have Inputs alongside their Displays. Only the truly system/read-only types
// (uuid, position, actor) stay display-only.
import { registerField } from './registry'
import {
  TextDisplay, LongTextDisplay, NumberDisplay, PercentDisplay, CurrencyDisplay,
  BooleanDisplay, SelectDisplay, MultiSelectDisplay, DateDisplay, DateTimeDisplay,
  EmailDisplay, UrlDisplay, PhoneDisplay, LinksDisplay, RatingDisplay,
  RelationDisplay, JsonDisplay, FallbackDisplay,
} from './displays'
import {
  TextInput, LongTextInput, NumberInput, PercentInput, CurrencyInput,
  BooleanInput, SelectInput, MultiSelectInput, DateInput, EmailInput,
  UrlInput, PhoneInput, RatingInput,
  RelationInput, FilesInput, LinksInput, JsonInput, FullNameInput, AddressInput,
} from './inputs'

let done = false

/** Idempotent — registers the built-in renderers once. */
export function registerDefaultFields(): void {
  if (done) return
  done = true

  registerField('text', { Display: TextDisplay, Input: TextInput })
  registerField('longText', { Display: LongTextDisplay, Input: LongTextInput })
  registerField('richText', { Display: LongTextDisplay, Input: LongTextInput })
  registerField('number', { Display: NumberDisplay, Input: NumberInput })
  registerField('percent', { Display: PercentDisplay, Input: PercentInput })
  registerField('currency', { Display: CurrencyDisplay, Input: CurrencyInput })
  registerField('boolean', { Display: BooleanDisplay, Input: BooleanInput })
  registerField('select', { Display: SelectDisplay, Input: SelectInput })
  registerField('multiSelect', { Display: MultiSelectDisplay, Input: MultiSelectInput })
  registerField('date', { Display: DateDisplay, Input: DateInput })
  registerField('dateTime', { Display: DateTimeDisplay, Input: DateInput })
  registerField('email', { Display: EmailDisplay, Input: EmailInput })
  registerField('url', { Display: UrlDisplay, Input: UrlInput })
  registerField('phone', { Display: PhoneDisplay, Input: PhoneInput })
  registerField('rating', { Display: RatingDisplay, Input: RatingInput })
  registerField('links', { Display: LinksDisplay, Input: LinksInput })
  registerField('relation', { Display: RelationDisplay, Input: RelationInput })
  registerField('json', { Display: JsonDisplay, Input: JsonInput })
  registerField('fullName', { Display: FallbackDisplay, Input: FullNameInput })
  registerField('address', { Display: FallbackDisplay, Input: AddressInput })
  registerField('files', { Display: FallbackDisplay, Input: FilesInput })
  // System / read-only types (never edited directly).
  registerField('uuid', { Display: FallbackDisplay })
  registerField('position', { Display: NumberDisplay })
  registerField('actor', { Display: FallbackDisplay })
}

registerDefaultFields()
