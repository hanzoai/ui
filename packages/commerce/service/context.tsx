'use client'
import { createContext, useContext, useRef, type PropsWithChildren } from 'react'

// https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18
import { enableStaticRendering } from 'mobx-react-lite'
enableStaticRendering(typeof window === "undefined")


import type CommerceService from '../types/commerce-service'
import type { ServiceOptions } from '..'
import getServiceSingleton from './impls'
import type { Category, FacetsDesc } from '../types'

const CommerceServiceContext = createContext<CommerceService | undefined>(undefined)


const useCommerce = (): CommerceService => {
  return useContext(CommerceServiceContext) as CommerceService
}

const CommerceServiceProvider: React.FC<PropsWithChildren & {
  productsByCategory: Category[]
  facets: FacetsDesc
  options?: ServiceOptions
}> = ({ 
  children,
  productsByCategory,
  facets,
  options
}) => {

  const serviceRef = useRef<CommerceService>(getServiceSingleton(productsByCategory, facets, options))
  return (
    <CommerceServiceContext.Provider value={serviceRef.current}>
      {children}
    </CommerceServiceContext.Provider>
  )
}

export {
  useCommerce, CommerceServiceProvider
}