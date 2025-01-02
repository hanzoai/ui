import Abbr from './number-abbreviate'

const abbr = new Abbr(['K', 'M', 'B', 'T'])

const formatToMaxChar = (
  n: number | null, 
  maxChars: number, 
    /** 
     * Chars that will be added by ui if the number is rounded.  
     * For example, if the desired output for 10.15 is "~10.1", 
     * the tilda counts as 1 char.  
     */
  roundingAdds: number = 1 
): {
  result: string 
  change: 'rounded' | 'none' | 'abbr' | 'empty' 
} => {
  if (n === null) {
    return {
      result: '',
      change: 'empty'
    }
  }
  const s = n.toString()
  if (s.length > maxChars) {
      // Highest number that can be rounded down to an 
      // acceptable string.
      // Decimal point, plus one decimal place = 2 chars
    const cuttoff = Math.pow(10, maxChars - 2 - roundingAdds) - 0.05
    if (n < cuttoff) {
      const intPortion = Math.floor(n)
      const len = intPortion.toString().length
        // 1 is for dec point itself
      const availDecimals = maxChars - len - 1 - roundingAdds 
        // removes trailing zeros, if any
      const roundedNumerical = parseFloat(n.toFixed(availDecimals))
      return {
        result: roundedNumerical.toString(),
        change: 'rounded'
      }
    }
    else {

      const str = abbr.abbreviate(n, maxChars)
      const numStr = str.slice(0, -1)
      const abbreviation = str.slice(-1)
      const numerical = parseFloat(numStr)

        // minus abbr, dec point, and roundingAdds / tilda,  
        // (1 + 1 + roundingAdds)
        // ("precision" does NOT include the decimal point itself, 
        // so we have to explicitly factor it in.)
      const roundedString = numerical.toPrecision(maxChars - (2 + roundingAdds)) 
        // remove trailing zeros, if any
      const roundedNumerical = parseFloat(roundedString)
      return {
        result: roundedNumerical.toString() + abbreviation,
        change: roundedNumerical === numerical ? 'abbr' : 'rounded'
      }
    }
  }
  return {
    result: s,
    change: 'none'
  }
}

export default formatToMaxChar
