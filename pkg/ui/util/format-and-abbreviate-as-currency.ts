import Abbr, { QuantityAbbrSymbol, ABBR_SYMBOLS_ARRAY } from './number-abbreviate'

interface FormatThreshold {
  from: number
  use: QuantityAbbrSymbol
}

const usdFormatter = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,  
})

const formatAsUSCurrency = (n: number) => {
  let result = usdFormatter.format(n)
  return result.endsWith('.00') ? result.slice(0, -3) : result
}

const formatAndAbbreviateAsCurrency = (
  n: number | null,
  thresholds: FormatThreshold[] = [{
    from: 1000000000,
    use: 'M'
  }],
    /** 
     * Chars that will be added by ui if the number is rounded.  
     * For example, if the desired output for 10.15 is "~10.1", 
     * the tilda counts as 1 char.  
     */
  roundingAdds: number = 1,
  maxDecimal: number = 2 
): {
  full: string
  result: string 
  change: 'rounded' | 'none' | 'abbr' | 'empty' 
} => {
  if (n === null) {
    return {
      full: '',
      result: '',
      change: 'empty'
    }
  }

  const formatted = formatAsUSCurrency(n)

  if (n < thresholds[0].from) {
    return {
      full: formatted,
      result: formatted,
      change: 'none' 
    }
  }

    // Get operative FormatThreshold pair...
  let threshold: FormatThreshold 
  for (
    let i = 0; 
    i < thresholds.length && n >= thresholds[i].from; 
    threshold = thresholds[i], i++ 
  ) {}

    // Build up units array to all units
    // up to threshold.use
  const units: QuantityAbbrSymbol[] = []
  for (let i = 0; i < ABBR_SYMBOLS_ARRAY.length; i++) {
    const current = ABBR_SYMBOLS_ARRAY[i]
    units.push(current)
    if (current === threshold!.use) {
      break
    }
  }

  const abbreviator = new Abbr(units)

    // Use threshold.from as a guide to how many chars are available:
    // first digit + comma = 2
    // Possible trailing cents: '.xx'.length = 3
    // 3 - 2 = 1
  const charsAvail = formatAsUSCurrency(threshold!.from).length + 1 
  const abbr = abbreviator.abbreviate(n, charsAvail) // arbitrary, but good approx
  const numStr = abbr.slice(0, -1)
  const abbreviation = abbr.slice(-1)
  const numerical = parseFloat(numStr)

  const integral = Math.floor(numerical)
  const integralString = formatAsUSCurrency(integral)
  const commas = integralString.split(',').length - 1

    // minus abbr, dec point, dollar sign, and roundingAdds / tilda,  
    // (1 + 1 + 1 + roundingAdds)
    // ("precision" does NOT include the decimal point itself, 
    // so we have to explicitly factor it in.)
  const roundedString = numerical.toPrecision(charsAvail - commas - (3 + roundingAdds)) 
    // remove trailing zeros, if any
  const roundedNumerical = parseFloat(roundedString)
  const roundedIntegral = Math.trunc(roundedNumerical)
  const roundedIntegralString = formatAsUSCurrency(roundedIntegral)

  let decimalPortion = roundedNumerical - roundedIntegral
  let result
  if (decimalPortion !== 0) {
      // remove trailing zeros if any
    decimalPortion = parseFloat(decimalPortion.toFixed(maxDecimal)) 
    const decimalPortionString = decimalPortion.toString()
    const afterDecimalString = decimalPortionString.slice(decimalPortionString.indexOf('.') + 1)
    result = roundedIntegralString + '.' + afterDecimalString + abbreviation
  }
  else {
    result = roundedIntegralString  + abbreviation  
  }
    // Did we lose any precision? 
  const rounded = (roundedIntegral + decimalPortion !== n)
  return {
    full: formatted,
    result,
    change: rounded ?  'rounded' : 'abbr'
  }
}

export {
  formatAndAbbreviateAsCurrency as default,
  type FormatThreshold, 
  type QuantityAbbrSymbol
}