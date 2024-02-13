import type { LinkDef } from '../../types'

const legal: LinkDef[] = [
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
] 

const title: LinkDef = 
{
  title: 'Legal',
  href: '',
  variant: 'linkFG',
}

const legalColumn: LinkDef[] =  [title, ...legal]

export {
  legal,
  legalColumn
}
