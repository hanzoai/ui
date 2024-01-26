import { determineDeviceMiddleware } from './determine-device-middleware'
import NotFoundMDX from './not-found-content.mdx'
import NotFound from './not-found'
import RootLayout from './root-layout'
import luxNextFonts from './lux-next-fonts'
import type {default as NextFontDesc,  NextFontWithVariable,} from './next-font-desc'
import getAppRouterBodyFontClasses from './get-app-router-font-classes'
import PagesRouterFontVars from './pages-router-font-vars'

export {
  determineDeviceMiddleware,
  NotFoundMDX,
  NotFound,
  RootLayout,
  getAppRouterBodyFontClasses,
  PagesRouterFontVars,
  luxNextFonts,
  type NextFontDesc,
  type NextFontWithVariable,
}
