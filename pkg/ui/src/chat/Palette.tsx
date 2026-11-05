'use client'

/**
 * The composer's commands: what a surface can do from where the draft is — run
 * it, open the repository in an editor, go to its issues. A `ChipSelect` with
 * no words on its chip, so the search, the arrows, Enter and Esc are the ones
 * every pill already has. ⌘K (Ctrl+K) opens it from the field.
 *
 * A command's `keys` is what already does it elsewhere (⌘↵ sends), never a key
 * this list binds: a shortcut shown and not bound is a promise the page breaks.
 */
import { useI18n } from '@hanzo/i18n/react'
import { Sparkles } from '@hanzogui/lucide-icons-2'
import { GLYPH, STROKE } from './look'
import type { ReactNode } from 'react'

import { ChipSelect, type ChipPlacement } from '../product/ChipSelect'
import type { ChipItem } from '../product/chipSelect.logic'

export interface Command {
  id: string
  label: string
  icon?: ReactNode
  /** The keys that do this elsewhere, as said on the row (`⌘↵`). */
  keys?: string
  run: () => void
  disabled?: boolean
}

type Row = ChipItem & { command: Command }

export function Palette({
  commands,
  open,
  onOpenChange,
  placement = 'top-end',
  size,
  disabled,
}: {
  commands: readonly Command[]
  open: boolean
  onOpenChange: (open: boolean) => void
  placement?: ChipPlacement
  /** The button's box, px: the composer's control size. */
  size?: number
  disabled?: boolean
}) {
  const { t } = useI18n()
  const items: Row[] = commands.map((c) => ({ id: c.id, label: c.label, icon: c.icon, hint: c.keys, disabled: c.disabled, command: c }))
  return (
    <ChipSelect<Row>
      name={t('Commands')}
      label=""
      quiet
      {...(size ? { box: size } : null)}
      icon={<Sparkles size={GLYPH} strokeWidth={STROKE} color="$quiet" />}
      items={items}
      onChange={(i) => i.command.run()}
      placeholder={t('Search commands…')}
      empty={t('Nothing matches')}
      placement={placement}
      width={300}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
