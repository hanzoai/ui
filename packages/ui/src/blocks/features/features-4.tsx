import * as React from 'react'
import { cn } from '@hanzo/ui'

export function FeaturesBlock4({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      <div className="@container">  <div className="grid grid-cols-1 @sm:grid-cols-2">    <img      src="/img/photo-1.jpg"      className="aspect-square @sm:aspect-3/2 object-cover"    / />    <img      src="/img/photo-2.jpg"      className="aspect-square @sm:aspect-3/2 object-cover"    / />    <img      src="/img/photo-3.jpg"      className="aspect-square @sm:aspect-3/2 object-cover"    / />    <img      src="/img/photo-4.jpg"      className="aspect-square @sm:aspect-3/2 object-cover"    / />  </div></div>
    </div>
  )
}

export default FeaturesBlock4
