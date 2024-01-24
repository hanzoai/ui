import React, { type PropsWithChildren } from 'react'

import { inter, drukTextWide } from '../next-fonts'
import Header from '../common/header'
import type SiteConf from '../types/site-conf'

// Next 14: https://nextjs.org/docs/app/building-your-application/upgrading/codemods#use-viewport-export
const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

/*
  These '.variable' fields are actually autogenerate css classnames that *define* the actual
  css variables ('--foo-var') that one asks for in the utility functions.
  They are what make them available in their scope, so this MUST
  be done like this for the tailwind font classes to work.
  
  (not to be confused with the css var itself.  This field should be named something else!)
*/

// overflow-y-hidden overflow-x-hidden ,-- cannot have these on body tag for scroll-snap on iOS
const bodyClasses = 
  'bg-background text-foreground ' + 
  `${inter.variable} ${drukTextWide.variable} font-sans` 

    // re <base />: https://stackoverflow.com/a/75716588/11645689 
const RootLayout: React.FC<
  PropsWithChildren & { conf: SiteConf }
> = ({ 
  conf,
  children,
}) =>  (
  <html lang='en' suppressHydrationWarning className='lux-dark-theme'>
    <head >
      <base target='_blank' />
    </head>
    <body className={bodyClasses}>
      <Header conf={conf}/>
      {children}
    </body>
  </html>
)

export {
  RootLayout as default,
  viewport
}
