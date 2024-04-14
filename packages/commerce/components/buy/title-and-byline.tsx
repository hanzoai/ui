import React from 'react'

import { ApplyTypography } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

const TitleAndByline: React.FC<{
  title: string | undefined
  byline?: string | undefined
  clx?: string
  bylineClx?: string
}> = ({
  title,
  byline,
  clx='',
  bylineClx=''
}) => ( (title || byline) ? (
    <ApplyTypography className={cn('flex flex-col items-center !gap-0 [&>*]:!m-0 ', clx)} >
      <h4>{title}</h4>
      {byline && (<h6 className={bylineClx}>{byline}</h6>)}
    </ApplyTypography>
  ) : (null)
)

export default TitleAndByline

