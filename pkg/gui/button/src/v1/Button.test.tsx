import { getDefaultTamaguiConfig } from '@hanzo/gui-config-default'
import { createTamagui } from '@hanzo/gui-core'
import { describe, expect, test } from 'vitest'

const conf = createTamagui(getDefaultTamaguiConfig())

describe('Button', () => {
  test(`123`, () => {
    expect(true).toBeTruthy()
  })

  // test(`Adapts to a when given accessibilityRole="link"`, async () => {
  //   const { container } = render(
  //     <TamaguiProvider config={conf} defaultTheme="light">
  //       <Button href="http://google.com" accessibilityRole="link" />
  //     </TamaguiProvider>
  //   )

  //   expect(container.firstChild).toMatchSnapshot()
  // })
})
