// Wire the built-in field types to their renderers. Importing this module (the
// barrel does) registers everything. Read-only types (uuid, position, actor,
// json, files, address, relation, links) omit an Input until a richer editor
// (record picker, file upload, calendar) is registered over them — the table
// and detail views already work with display-only types.
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
  registerField('links', { Display: LinksDisplay })
  registerField('relation', { Display: RelationDisplay })
  registerField('json', { Display: JsonDisplay })
  registerField('uuid', { Display: FallbackDisplay })
  registerField('fullName', { Display: FallbackDisplay })
  registerField('address', { Display: FallbackDisplay })
  registerField('files', { Display: FallbackDisplay })
  registerField('position', { Display: NumberDisplay })
  registerField('actor', { Display: FallbackDisplay })
}

registerDefaultFields()
