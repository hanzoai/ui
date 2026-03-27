import { getDefaultGuiConfig } from '@hanzogui/config-default'
import { createGui } from '@hanzogui/core'
import { describe, expect, test } from 'vitest'

const conf = createGui(getDefaultGuiConfig())

describe('Button', () => {
  test(`123`, () => {
    expect(true).toBeTruthy()
  })

  // test(`Adapts to a when given accessibilityRole="link"`, async () => {
  //   const { container } = render(
  //     <GuiProvider config={conf} defaultTheme="light">
  //       <Button href="http://google.com" accessibilityRole="link" />
  //     </GuiProvider>
  //   )

  //   expect(container.firstChild).toMatchSnapshot()
  // })
})
