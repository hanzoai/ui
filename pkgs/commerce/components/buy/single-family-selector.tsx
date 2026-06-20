import React from 'react'
import { observer } from 'mobx-react-lite'

import { MediaStack, Skeleton } from '@hanzo/ui/primitives'
import type { Dimensions } from '@hanzo/ui/types'

import { useCommerce } from '../..'

import type { ItemSelectorOptions, ItemSelectorProps, LineItem } from '../../types'
import TitleAndByline from './title-and-byline'
import { accessItemOptions } from '../../util'
import { cn } from '@hanzo/ui/util'


const DEF_MEDIA_CONSTRAINT = {w: 200, h: 200}

const SingleFamilySelector: React.FC<{
  items: LineItem[] // these may be sorted, so are we can't just use currentFamily.products
  Selector: React.ComponentType<ItemSelectorProps>
  selOptions: ItemSelectorOptions | undefined
  scrollable?: boolean
  showItemMedia?: boolean
  mediaConstraint?: Dimensions
  mobile?: boolean
  clx?: string
  titleAreaClx?: string
}> = ({
  items,
  Selector,
  selOptions,
  scrollable=false,
  showItemMedia=true,
  mediaConstraint=DEF_MEDIA_CONSTRAINT,
  mobile=false,
  clx='',
  titleAreaClx=''
}) => {
  
  const cmmc = useCommerce()


  const MyTitleAndByline: React.FC<{clx?: string}> = observer(({
    clx=''
  }) => {
    const { familyTitle, showFamilyByline } = accessItemOptions(selOptions)
    const title = (familyTitle === 'none' ? 
      undefined 
      : 
      (familyTitle === 'long' ? 
        cmmc.currentFamily?.title 
        : 
        (cmmc.currentFamily?.titleShort ?? cmmc.currentFamily?.title)
      ) 
    )
    const byline = (familyTitle !== 'none') && showFamilyByline ? cmmc.currentFamily?.byline :  undefined
    return ( <TitleAndByline clx={clx} title={title} byline={byline}/> )
  })

  const ItemMedia: React.FC = observer(() => (
    cmmc.currentItem ? (
      <MediaStack 
        media={cmmc.currentItem!} 
        constrainTo={mediaConstraint} 
        clx={'mb-2 ' + (scrollable ? 'shrink-0' : '')}
      />
    ) : (
      <Skeleton className={'w-[200px] h-[200px] my-2 ' + (scrollable ? 'shrink-0' : '')}/>
    )
  ))

  return (
    <div className={cn(clx, 'flex flex-col items-center', (scrollable ? 'shrink' : ''))}>
      <MyTitleAndByline clx={cn(titleAreaClx, (scrollable ? 'shrink-0' : ''))} />
      {showItemMedia && (<ItemMedia />)}
      {items && (
        <Selector 
          items={items}
          selectedItemRef={cmmc}
          selectSku={cmmc.setCurrentItem.bind(cmmc)}
          scrollable={scrollable}
          mobile={mobile}
          options={selOptions}
          clx={(scrollable ? 'shrink' : '')}
        />  
      )}
    </div>
  )
}

export default SingleFamilySelector
