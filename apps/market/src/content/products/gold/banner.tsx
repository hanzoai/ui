import { type CTABlock } from '@hanzo/ui/blocks'

import video from './video'

export default {
  blockType: 'banner',
  title: 'LUX GOLD',
  byline: <>Responsibly manufactured, <br className='sm:hidden'/>ethically sourced.</>,
  video: {...video, sizing: { vh: 50}},
  /*
  contentAfter: <AddToCartForm product={{
    id: 'gold',
    title: 'Gold',
    price: 123.45,
    description: 'Responsibly manufactured, ethically sourced.',
    image: '/assets/video/luxgold-poster.jpg'
  }}/>,
  */
  cta: {
    blockType: 'cta',
    elements: [
      {
        title: "Learn More",
        href: "/gold",
        variant: 'outline'
      },
      {
        title: "Buy Now",
        href: "/store?c=AU",
        variant: 'primary'
      },
    ]
  } as CTABlock
}