// Wire the built-in field types to their renderers. Importing this module (the
// barrel does) registers everything. The types with no editor — uuid, actor and
// position — are written by the system, never by a person; `registerField` over
// any type replaces its renderers.
import { registerField } from './registry'
import {
  TextDisplay, LongTextDisplay, RichTextDisplay, NumberDisplay, PercentDisplay, CurrencyDisplay,
  BooleanDisplay, SelectDisplay, MultiSelectDisplay, DateDisplay, DateTimeDisplay,
  EmailDisplay, UrlDisplay, PhoneDisplay, LinksDisplay, RatingDisplay,
  RelationDisplay, JsonDisplay, FilesDisplay, UuidDisplay, FullNameDisplay, AddressDisplay,
  NumberDisplay as PositionDisplay, ActorDisplay,
} from './displays'
import {
  TextInput, LongTextInput, NumberInput, PercentInput, CurrencyInput,
  BooleanInput, SelectInput, MultiSelectInput, DateInput, EmailInput,
  UrlInput, PhoneInput, RatingInput, RelationInput, FileInput, JsonInput,
  LinksInput, FullNameInput, AddressInput,
} from './inputs'

let done = false

/** Idempotent — registers the built-in renderers once. */
export function registerDefaultFields(): void {
  if (done) return
  done = true

  registerField('text', { Display: TextDisplay, Input: TextInput })
  registerField('longText', { Display: LongTextDisplay, Input: LongTextInput })
  registerField('richText', { Display: RichTextDisplay, Input: LongTextInput })
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
  registerField('files', { Display: FilesDisplay, Input: FileInput })
  registerField('uuid', { Display: UuidDisplay })
  registerField('fullName', { Display: FullNameDisplay, Input: FullNameInput })
  registerField('address', { Display: AddressDisplay, Input: AddressInput })
  registerField('position', { Display: PositionDisplay })
  registerField('actor', { Display: ActorDisplay })
}

registerDefaultFields()
