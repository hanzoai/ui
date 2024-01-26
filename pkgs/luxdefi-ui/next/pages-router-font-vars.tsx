
import nextFonts from './lux-next-fonts'
import type NextFontDesc from './next-font-desc'

const PagesRouterFontVars: React.FC = () => {

  const fontVars = nextFonts.map((fd: NextFontDesc) => (
    `${fd.cssVar}: ${fd.nextFont.style.fontFamily}`
  )).join('\n')

  return <style jsx global>{`
    html {
      ${fontVars}
    }
  `}</style>
}

export default PagesRouterFontVars
