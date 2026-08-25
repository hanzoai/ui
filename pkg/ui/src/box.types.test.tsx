/**
 * What the TYPES let a caller write.
 *
 * These assertions are the point of the generic. An app converting its markup
 * writes `<Box tag="select" onChange={e => e.target.value}>`, and if `tag` does
 * not drive inference the event target comes back as a union with
 * HTMLDivElement — an error on the one element that has a value. Caught at
 * compile time by `tc`, which is why the bodies do nothing.
 */
import { describe, expect, it } from 'vitest'
import { Box } from './box'

describe('Box types', () => {
  it('infers the element from tag', () => {
    const nodes = (
      <>
        {/* a select's change event carries a select */}
        <Box tag="select" onChange={(e) => void e.target.value.trim()}>
          <option value="x">x</option>
        </Box>
        {/* an anchor takes href */}
        <Box tag="a" href="/x" target="_blank" rel="noreferrer">x</Box>
        {/* a button takes type and disabled */}
        <Box tag="button" type="submit" disabled onClick={() => {}}>x</Box>
        {/* a form takes onSubmit */}
        <Box tag="form" onSubmit={(e) => e.preventDefault()}>x</Box>
        {/* a label takes htmlFor */}
        <Box tag="label" htmlFor="f">x</Box>
        {/* an input's change event carries an input */}
        <Box tag="textarea" onChange={(e) => void e.target.value.length} />
        {/* plain CSS, which is what reaches the DOM */}
        <Box style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>x</Box>
      </>
    )
    expect(nodes).toBeTruthy()
  })
})
