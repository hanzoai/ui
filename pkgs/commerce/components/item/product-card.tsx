import React from 'react'

import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  MediaStack
} from '@hanzo/ui/primitives'

import { cn } from '@hanzo/ui/util'

import { formatCurrencyValue } from '../../util'
import type { LineItem } from '../../types'

import AddToCartWidget from '../add-to-cart-widget'

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  item: LineItem
}

const ProductCard: React.FC<ProductCardProps> = ({
  item,
  className,
  ...props
}) => (
  <Card
    itemScope
    itemType='https://schema.org/Product'
    className={cn('max-h-[360px] lg:min-w-[200px] max-w-[260px] overflow-hidden', className)}
    {...props}
  >
    {/* Standard schema.org Product microdata. Neutral and analytics-agnostic:
        track.js `annotate`, GA4 Merchant, or any reader picks up the item with
        zero per-app config. Machine values live in <meta> so the visible,
        formatted UI is untouched. */}
    <meta itemProp='name' content={item.title} />
    <meta itemProp='sku' content={item.sku} />
    <CardHeader className='w-full border-b p-6 min-h-[180px] max-h-[240px] relative'>
      <MediaStack media={item} constrainTo={{w: 700, h:700}} clx='p-6' />
    </CardHeader>
    <CardContent className='grid gap-2.5 p-4'>
      <CardTitle className='text-sm sm:text-base flex flex-col justify-start items-center line-clap-3'>
        {item.title.split(', ').map((e, i) => (<p key={i}>{e}</p>))}
        <p
          className='mt-1 font-semibold'
          itemProp='offers'
          itemScope
          itemType='https://schema.org/Offer'
        >
          <meta itemProp='price' content={String(item.price)} />
          <meta itemProp='priceCurrency' content='USD' />
          {formatCurrencyValue(item.price)}
        </p>
      </CardTitle>
    </CardContent>
    <CardFooter className='p-4 flex flex-row justify-center'>
      <AddToCartWidget item={item} />
    </CardFooter>
  </Card>
)


export default ProductCard
