  // https://tailwindcss.com/docs/content-configuration#dynamic-class-names
  // https://tailwindcss.com/docs/content-configuration#safelisting-classes
export default [

  'font-sans',
  { 
    pattern: /grid-cols-[1-6]/,
    variants: [ 'xs', 'sm', 'md', 'lg', 'xl', '2xl' ]
  },
  { // SpaceBlock
    pattern: /h-([0-9]|[1-3][0-9]|40)/,
    variants: [ 'xs', 'sm', 'md', 'lg', 'xl', '2xl' ]
  },
  { 
    pattern: /order-[0-6]/
  },
  { // EnhHeadingBlock
    pattern: /mb-([1-9]|1[0-2])/
  },
  'md:text-left', // EnhHeadingBlock
  'md:text-center',
  'md:text-right',
  'md:self-start',
  'md:self-center',
  'md:self-end',
]
