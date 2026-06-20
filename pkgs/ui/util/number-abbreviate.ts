// cf: https://github.com/domharrington/js-number-abbreviate/blob/master/index.js

type QuantityAbbrSymbol = 'K' | 'M' | 'B' | 'T'
const ABBR_SYMBOLS_ARRAY = ['K', 'M', 'B', 'T'] satisfies QuantityAbbrSymbol[]

class NumberAbbreviator {

  private _units: QuantityAbbrSymbol[]

  constructor(units?: QuantityAbbrSymbol[]) {
    this._units = units ?? ABBR_SYMBOLS_ARRAY
  }

  private _abbreviate = (
    n: number, 
    decPlaces: number,
    log: boolean = false
  ): string  => {

    const _decPlaces = Math.pow(10, decPlaces)
    let _n = n

    let _unit
    for (let i = this._units.length - 1; i >= 0; i--) {
      const size = Math.pow(10, (i + 1) * 3)
      if (size <= _n) {
        _n = Math.round(_n * _decPlaces / size) / _decPlaces
        if ((_n === 1000) && (i < this._units.length - 1)) {
          _n = 1
          i++
        }
        _unit = this._units[i]
        break
      }
    }
    return _n.toString() + (_unit ?? '')
  }

  abbreviate = (n: number, decPlaces: number, log: boolean = false) => {
    const abbreviatedNumber = this._abbreviate(Math.abs(n), decPlaces, log)
    return n < 0 ? '-' + abbreviatedNumber : abbreviatedNumber
  }  
}

export {
  type QuantityAbbrSymbol,
  ABBR_SYMBOLS_ARRAY, 
  NumberAbbreviator as default 
}
