import screenDef from './screens.tailwind'

const screens = Object.keys(screenDef)

const fulls = () => {
  const r = []
  r.push('w-full')
  r.push('max-w-full')
  r.push('h-full')
  r.push('max-h-full')
  screens.forEach((sc) => {
    r.push(`${sc}:w-full`)
    r.push(`${sc}:max-w-full`)
    r.push(`${sc}:h-full`)
    r.push(`${sc}:max-h-full`)
  })
  return r
}


// https://tailwindcss.com/docs/content-configuration#dynamic-class-names
  // https://tailwindcss.com/docs/content-configuration#safelisting-classes
export default [

  'font-sans',
  { 
    pattern: /grid-cols-[1-6]/,
    variants: [ 'xs', 'sm', 'md', 'lg', 'xl', '2xl' ]
  },
  { // SpaceBlock h-1 through h-40
    pattern: /h-([0-9]|[1-3][0-9]|40)/,
    variants: [ 'xs', 'sm', 'md', 'lg', 'xl', '2xl' ]
  },
  { 
    pattern: /order-[0-6]/
  },
  { // EnhHeadingBlock
    pattern: /mb-([1-9]|1[0-2])/
  },
    // util/index: getConstraintClx() w-1 --> w-256, and h-1 --> h-256
    // util/index: getConstraintClx() w-[1%] --> w-[100%] and h-[1%] --> h-[100%] 
    // https://github.com/tailwindlabs/tailwindcss/discussions/7908
  ...[...Array(256).keys()].flatMap((i) => {
    const r = []
    r.push(`max-w-${i}`)
    r.push(`max-h-${i}`)
    screens.forEach((sc) => {
      r.push(`${sc}:max-w-${i}`)
      r.push(`${sc}:max-h-${i}`)
    })
    return r
  }),
  ...[...Array(99).keys()].flatMap((i) => {
    const r = []
    r.push(`max-w-[${i}%]`)
    r.push(`max-h-[${i}%]`)
    screens.forEach((sc) => {
      r.push(`${sc}:max-w-[${i}%]`)
      r.push(`${sc}:max-h-[${i}%]`)
    })
    return r
  }),
  ...fulls(),
  /*
  { // util/index: getConstraintClx() w-1 --> w-256, and h-1 --> h-256
    pattern: /(w|h)-([1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-6])/
  },
  { 
    // util/index: getConstraintClx() w-[1%] --> w-[256]
    pattern: /(w|h)-\[([1-9]|[1-9][0-9]|100)%\]/
  },
  */

  'md:text-left', // EnhHeadingBlock
  'md:text-center',
  'md:text-right',
  'md:self-start',
  'md:self-center',
  'md:self-end',
]
