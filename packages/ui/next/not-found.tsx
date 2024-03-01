import React  from 'react'

import Main from '../primitives/main'
import Footer from '../common/footer'
import { ApplyTypography } from '../primitives'

import NotFoundMDX from './not-found-content.mdx'
import type { SiteDef } from '../types'

const NotFound: React.FC<{
  siteDef: SiteDef
}>  = ({
  siteDef
}) => (<>
  <Main className='xs:h-[100svh] xs:px-8 sm:px-10 sm:h-[700px]'>
    <ApplyTypography className='mt-[200px] flex flex-col md:gap-8 '>
      <NotFoundMDX />
    </ApplyTypography>
  </Main>
  <Footer siteDef={siteDef}/>
</>)

export default NotFound
