import luxTwFonts  from './lux-tw-fonts'
import type TwFontDesc from './tw-font-desc'

export const fontFamily = (ignoreTheme: any): {
  [key: string]: string[] 
} => {

  let result: any = {}
  luxTwFonts.forEach((font: TwFontDesc) => {
    result[font.twName] = font.fontFamily
    // eg: heading: ['var(--font-druk-text-wide)']
  })

  return result as {
    [key: string]: string[] 
  }
}

export const fontSize = {
  xxs: ['0.6.5rem', { lineHeight: '0.8rem' }],    // very fine print               
  xs: ['0.8rem', { lineHeight: '1rem' }],       // fine print               
  sm: ['0.9rem', { lineHeight: '1.2rem' }],     // 'standard' some news article cards  (set manually when using typography-sm)
  base: ['1rem', { lineHeight: 1.4 }],     
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
  '6xl': ['3.75rem', { lineHeight: '1' }],
}