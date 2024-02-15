/*
  if rem = 16px
  256 tw units is enough to specify up to
  1024px in 4px (0.25rem) increments.
  If one needs more than that, one can
  use screen sizes to define constraints.
  eg, 'max-w-screen-lg'
*/
const MAX = 256 

const sp = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem'
}

for (let i = 4; i <= MAX; i++) {

  const twoPlaces = Math.round(((i * 0.25) + Number.EPSILON) * 100) / 100

  if (Number.isSafeInteger(twoPlaces)) {
    sp[i] = `${Math.round(twoPlaces)}rem`
  }
  else {
    sp[i] = `${parseFloat(twoPlaces).toFixed(2)}rem`
  }
}

export default sp
