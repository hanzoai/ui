'use client'

/**
 * Table — a real `<table>` and its sections/rows/cells, laid out with the
 * host's native table algorithm (each part keeps its matching `display: table-*`)
 * rather than a flex or grid stand-in, so `colSpan`/`rowSpan` and column-width
 * alignment across rows work the way the browser already does them for free.
 * It is the semantic counterpart to `DataTable` (sorting/filtering/pagination
 * over a grid): this one is markup for tabular content someone else already
 * shaped, the way a changelog or an invoice line-item list is markup, not a
 * data structure.
 *
 * `display: table-*` and a couple of CSS properties gui does not model as
 * typed style props (`overflow: auto`, `transition`, `text-align`) go through
 * the plain `style` object every host element accepts, the same escape hatch
 * `calendar.tsx` uses for `textAlign` — the styled() variant surface stays
 * limited to the tokens gui actually knows.
 *
 * The scrolling frame is a separate part from the table itself so a caption,
 * header, body and footer all scroll together as one unit on a narrow
 * viewport.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import type * as React from 'react'
import { slot } from './slot'

const TableScroll = styled(XStack, {
  name: 'TableScroll',
  position: 'relative',
  width: '100%',
})

const TableFrame = styled(YStack, {
  name: 'TableFrame',
  width: '100%',
})

const TableHeaderFrame = styled(YStack, {
  name: 'TableHeaderFrame',
})

const TableBodyFrame = styled(YStack, {
  name: 'TableBodyFrame',
})

const TableFooterFrame = styled(YStack, {
  name: 'TableFooterFrame',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  bg: '$panel',
})

const TableRowFrame = styled(YStack, {
  name: 'TableRowFrame',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  hoverStyle: { bg: '$hover' },

  variants: {
    selected: {
      true: { bg: '$hover' },
    },
  } as const,
})

const TableHeadFrame = styled(YStack, {
  name: 'TableHeadFrame',
  height: 48,
  px: '$3',
})

const TableCellFrame = styled(YStack, {
  name: 'TableCellFrame',
  p: '$3',
})

const TableCaptionFrame = styled(YStack, {
  name: 'TableCaptionFrame',
  mt: '$4',
})

export type TableProps = React.ComponentProps<typeof TableFrame>
export type TableHeaderProps = React.ComponentProps<typeof TableHeaderFrame>
export type TableBodyProps = React.ComponentProps<typeof TableBodyFrame>
export type TableFooterProps = React.ComponentProps<typeof TableFooterFrame>
export type TableRowProps = React.ComponentProps<typeof TableRowFrame> & { selected?: boolean }
export type TableHeadProps = React.ComponentProps<typeof TableHeadFrame>
export type TableCellProps = React.ComponentProps<typeof TableCellFrame> & {
  colSpan?: number
  rowSpan?: number
}
export type TableCaptionProps = React.ComponentProps<typeof TableCaptionFrame>

export function Table({ children, ...props }: TableProps) {
  return (
    <TableScroll {...slot('table-scroll')} style={{ overflow: 'auto' }}>
      <TableFrame
        {...slot('table')}
        render="table"
        style={{ borderCollapse: 'collapse', captionSide: 'bottom', display: 'table' }}
        {...props}
      >
        {children}
      </TableFrame>
    </TableScroll>
  )
}

export function TableHeader({ children, ...props }: TableHeaderProps) {
  return (
    <TableHeaderFrame
      {...slot('table-header')}
      render="thead"
      style={{ display: 'table-header-group' }}
      {...props}
    >
      {children}
    </TableHeaderFrame>
  )
}

export function TableBody({ children, ...props }: TableBodyProps) {
  return (
    <TableBodyFrame
      {...slot('table-body')}
      render="tbody"
      style={{ display: 'table-row-group' }}
      {...props}
    >
      {children}
    </TableBodyFrame>
  )
}

export function TableFooter({ children, ...props }: TableFooterProps) {
  return (
    <TableFooterFrame
      {...slot('table-footer')}
      render="tfoot"
      style={{ display: 'table-footer-group' }}
      {...props}
    >
      {children}
    </TableFooterFrame>
  )
}

export function TableRow({ children, selected = false, ...props }: TableRowProps) {
  return (
    <TableRowFrame
      {...slot('table-row')}
      data-state={selected ? 'selected' : undefined}
      selected={selected}
      render="tr"
      style={{ display: 'table-row', transition: 'background-color 0.15s ease' }}
      {...props}
    >
      {children}
    </TableRowFrame>
  )
}

export function TableHead({ children, ...props }: TableHeadProps) {
  return (
    <TableHeadFrame
      {...slot('table-head')}
      render="th"
      style={{ display: 'table-cell', textAlign: 'left', verticalAlign: 'middle' }}
      {...props}
    >
      <SizableText size="$2" fontWeight="500" color="$quiet">
        {children}
      </SizableText>
    </TableHeadFrame>
  )
}

export function TableCell({ children, colSpan, rowSpan, ...props }: TableCellProps) {
  const cellAttrs = { colSpan, rowSpan } as object
  return (
    <TableCellFrame
      {...slot('table-cell')}
      render="td"
      style={{ display: 'table-cell', verticalAlign: 'middle' }}
      {...props}
      {...cellAttrs}
    >
      <SizableText size="$2">{children}</SizableText>
    </TableCellFrame>
  )
}

export function TableCaption({ children, ...props }: TableCaptionProps) {
  return (
    <TableCaptionFrame
      {...slot('table-caption')}
      render="caption"
      style={{ display: 'table-caption' }}
      {...props}
    >
      <SizableText size="$2" color="$quiet">
        {children}
      </SizableText>
    </TableCaptionFrame>
  )
}
