export {default as ROOT} from './to-import/root'

export const TS = '-'  // token separator
export const DEC = '_' // decimal substitute

export const ASSETS_PATH = '/assets/img/cart/'
export const IMG = {
  AU_B: 'gold-bar-700x700.png',
  AG_B: 'silver-bar-700x700.png',
  AU_C: 'gold-coin-700x700.png',
  AG_C: 'silver-coin-700x700.png',
  AU_CB: 'gold-bar-700x700.png',
  AG_CB: 'silver-bar-700x700.png',
}

export const IMG_LEVEL_3 = {
  B: 'gold-silver-bars-700x700.png',
  C: 'gold-silver-coins-700x700.png',
  MB: 'gold-multibar-700x700.png',
  GD: 'gold-silver-bars-700x700.png',
}


  // must have last '/'
export const OUT_DIR = './out/'
export const OUT_FN = 'bullion-products-by-category.json'

const globalAGPoz = 22.65
const globalAUPoz = 2048.00

const gPoz = 28.3495

const AUoz = (amount: number) => (
  globalAUPoz * amount * 0.99
)

const AUg = (amount: number) => (
  AUoz(amount) / gPoz
)

const AGoz = (amount: number) => (
  globalAGPoz * amount * 0.9
)

const AGg = (amount: number) => (
  AGoz(amount) / gPoz
)

export {
  AUoz,
  AUg, 
  AGoz, 
  AGg
}