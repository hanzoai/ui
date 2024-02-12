import { Icons } from '../common'
import type { LinkDef } from '../types'

  // @ts-ignore (will build in project that has @svgr support)
import SVG_warp_logo from './svg/warpcast-logo.svg'

const SOC_ICON_SIZE = 18

export default [
  [
    {
      title: 'Products',
      href: '',
      variant: 'linkFG'
    },
    {
      title: 'Lux Silver',
      href: '/silver',
    },
    {
      title: 'Lux Gold',
      href: '/gold',
    },
    {
      title: 'Lux Coin',
      href: '/coin',
    },
    /*{
      title: 'Lux Uranium',
      href: '/uranium',
    },*/
    {
      title: 'Lux Credit',
      href: '/credit',
    },
    {
      title: 'Lux Validator',
      href: '/validator',
    },
    {
      title: 'Lux Pass',
      href: '/pass',
    },
  ],
  [
    {
      title: 'Network',
      href: "https://lux.network/",
      variant: 'linkFG'
    },
    {
      title: 'Bridge',
      href: "https://bridge.lux.network/",
    },
    {
      title: 'Explore',
      href: "https://explore.lux.network/",
    },
    {
      title: 'Wallet',
      href: "https://wallet.lux.network/",
    },
    {
      title: 'Safe',
      href: "https://wafe.lux.network/",
    },
    {
      title: 'Github',
      href: 'https://github.com/luxdefi',
    },
  ],
  [
    {
      title: 'Company',
      href: "https://lux.partners/",
      variant: 'linkFG',
    },
    {
      title: 'About',
      href: 'https://lux.partners',
      newTab: false,
    },
    {
      title: 'Partner with Lux',
      href: 'https://apply.lux.partners/',
    },
    {
      title: 'Lux Fund',
      href: 'https://lux.fund',
      newTab: false,
    },
    {
      title: 'Lux Support',
      href: 'mailto:support@lux.partners?subject=%E2%96%BC%20Lux%20Support',
    },
    {
      title: 'Careers',
      href: 'https://docs.lux.network/about/v/lux-job-listings/',
      newTab: false,
    },
    {
      title: 'Press Kit',
      href: 'https://drive.google.com/drive/folders/14OJtKLVakGY6883XO9yGbiHtlFxQUUm5?usp=share_link',
    },
  ],  
  [
    {
      title: 'Community',
      href: '',
      variant: 'linkFG',
    },
    {
      title: 'luxdefi Discussions',
      href: 'https://github.com/orgs/luxdefi/discussions',
      icon: <Icons.SocialIcon network='github' size={SOC_ICON_SIZE} />
    },

    /*
    {
      title: 'Discord',
      href: 'https://discord.gg/luxdefi',
      external: true,
      icon: <Icons.SocialIcon network='discord' size={SOC_ICON_SIZE} />
    },
    {
      title: 'Telegram',
      href: 'https://t.me/luxdefi',
      external: true,
      icon: <Icons.SocialIcon network='telegram' size={SOC_ICON_SIZE} />
    },
    */
    {
      title: '@luxdefi',
      href: 'https://twitter.com/luxdefi',
      icon: <Icons.SocialIcon network='x' size={SOC_ICON_SIZE} />
    },
    {
      title: 'lux',
      href: 'https://warpcast.com/~/channel/lux',
      icon: <SVG_warp_logo width={SOC_ICON_SIZE} height={SOC_ICON_SIZE} /> //<Icons.SocialIcon network='warpcast' size={SOC_ICON_SIZE} />
    },
    {
      title: 'luxdefi',
      href: 'https://facebook.com/luxdefi',
      icon: <Icons.SocialIcon network='facebook' size={SOC_ICON_SIZE + 2} />
    },
    {
      title: 'company/luxdefi',
      href: 'https://linkedin.com/company/luxdefi',
      icon: <Icons.SocialIcon network='linkedin' size={SOC_ICON_SIZE + 2} />
    },
    {
      title: '@luxdefi',
      href: 'https://instagram.com/luxdefi',
      icon: <Icons.SocialIcon network='instagram' size={SOC_ICON_SIZE + 2} />
    },

  ],
  [
    {
      title: 'Legal',
      href: '',
      variant: 'linkFG',
    },
    {
      title: 'Terms and Conditions',
      href: '/assets/standard-docs/LUX-NFT-Terms-and-Conditions.pdf',
      newTab: true,
    },
    {
      title: 'Privacy Policy',
      href: '/assets/standard-docs/LUX-Privacy-Policy.pdf',
      newTab: true,
    },
  ],
] satisfies LinkDef[][] 

