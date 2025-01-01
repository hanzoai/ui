// cf: https://github.com/domharrington/js-number-abbreviate/blob/master/index.js

const DEF_ABBREVIATIONS = ['K', 'M', 'B', 'T']

class NumberAbbreviator {

  private _units: string[]

  constructor(units?: string[]) {
    this._units = units ?? DEF_ABBREVIATIONS
  }

  private _abbreviate = (n: number, decPlaces: number): string  => {

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

  abbreviate = (n: number, decPlaces: number) => {
    const abbreviatedNumber = this._abbreviate(Math.abs(n), decPlaces || 0)
    return n < 0 ? '-' + abbreviatedNumber : abbreviatedNumber
  }  
}


export default NumberAbbreviator

/*
(function(root){
  'use strict';

  function NumberAbbreviate() {
    var units
    if (!(this instanceof NumberAbbreviate)) {
      // function usage: abbrev(n, decPlaces, units)
      var n = arguments[0]
      var decPlaces = arguments[1]
      units = arguments[2]
      var ab = new NumberAbbreviate(units)
      return ab.abbreviate(n, decPlaces)
    }
    // class usage: new NumberAbbreviate(units)
    units = arguments[0]
    this.units = units == null ? ['k', 'm', 'b', 't'] : units
  }

  NumberAbbreviate.prototype._abbreviate = function(number, decPlaces) {
    decPlaces = Math.pow(10, decPlaces)

    for (var i = this.units.length - 1; i >= 0; i--) {

      var size = Math.pow(10, (i + 1) * 3)

      if (size <= number) {
        number = Math.round(number * decPlaces / size) / decPlaces

        if ((number === 1000) && (i < this.units.length - 1)) {
          number = 1
          i++
        }

        number += this.units[i]

        break
      }
    }

    return number
  }

  NumberAbbreviate.prototype.abbreviate = function(number, decPlaces) {
    var isNegative = number < 0
    var abbreviatedNumber = this._abbreviate(Math.abs(number), decPlaces || 0)

    return isNegative ? '-' + abbreviatedNumber : abbreviatedNumber;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NumberAbbreviate
  } else {
    root.NumberAbbreviate = NumberAbbreviate
  }

})(this);
*/