/*
  NextFontDesc and TwFontDesc have to be seperate because they are needed 
  at different times during the next compile / build.  Otherwise a nasty 
  race condition happens! That's why they are in different files.
*/

interface TwFontDesc {
  twName: string
  cssVar?: string
  fontFamily: string[]
}

export {
  type TwFontDesc as default
}
