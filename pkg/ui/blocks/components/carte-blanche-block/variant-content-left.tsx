import { EnhHeadingBlockComponent, type CarteBlancheBlock, CTABlockComponent } from '../..'
import {
  CardContent,
  CardFooter,
  CardHeader,
} from '../../../primitives/index-blocks'
import { cn } from '../../../util'
import Content from '../content'

const VariantContentLeft: React.FC<{
  block: CarteBlancheBlock,
  agent?: string
  className?: string
  headingclx?: string
  contentclx?: string
  footerclx?: string
}> = ({
  block,
  agent,
  className,
  headingclx,
  contentclx,
  footerclx,
}) => {
  return (<>
    <div className='flex gap-2'>
      {block.topContent && <Content blocks={block.topContent} agent={agent} className='self-center ml-6 mt-6'/>}
      <div className='flex flex-col'>
        {block.heading && (
          <CardHeader className={cn('typography-img:m-0', headingclx)} >
            <EnhHeadingBlockComponent block={block.heading} className='text-accent' agent={agent}/>
          </CardHeader>
        )}
        {block.content && (
          <CardContent className={cn('typography flex flex-col justify-start', contentclx, className)}>
            <Content blocks={block.content} agent={agent}/>
          </CardContent>
        )}
      </div>
    </div>
    {block.cta && (
      <CardFooter className={cn('grid grid-cols-1 gap-2 md:flex md:flex-row md:justify-center mx-auto', footerclx)}>
        <CTABlockComponent block={block.cta} agent={agent}/>
      </CardFooter>
    )}
  </>)
}

export default VariantContentLeft