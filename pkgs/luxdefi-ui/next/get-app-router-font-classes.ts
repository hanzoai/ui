import fontDescs from './lux-next-fonts'
import type NextFontDesc from './next-font-desc'

  // These will be injected for <body> in app router app that uses our RootLayout

  // First is assumed to be mapped to the default font and is injected into <body>
  // as a normal tw font family class.
export default () => {
  let nextFonts: NextFontDesc[] = []
  fontDescs.forEach((desc: NextFontDesc) => {
    if (desc.nextFont) {
      nextFonts.push(desc)
    }
  })
  return nextFonts.map(
    (desc: NextFontDesc) => (desc.nextFont!.variable)
  ).join(' ') + ` font-${nextFonts[0].twName}`
}
