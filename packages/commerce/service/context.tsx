'use client'
import { createContext, useContext, useRef, type PropsWithChildren, useEffect } from 'react'

// https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18
import { enableStaticRendering } from 'mobx-react-lite'
enableStaticRendering(typeof window === "undefined")


import type CommerceService from '../types/commerce-service'
import type { ServiceOptions } from '..'
import getInstance from './get-instance'
import type { Family, CategoryNode, SelectionUISpecifier } from '../types'

const CommerceServiceContext = createContext<CommerceService | undefined>(undefined)

const useCommerce = (): CommerceService => {
  return useContext(CommerceServiceContext) as CommerceService
}

const CommerceServiceProvider: React.FC<PropsWithChildren & {
  productsByFamily: Family[]
  rootNode: CategoryNode
  options?: ServiceOptions
  uiSpecs?: Record<string, SelectionUISpecifier>
}> = ({ 
  children,
  productsByFamily,
  rootNode,
  options,
  uiSpecs
}) => {

    // TODO: Inject Promo fixture here
  const serviceRef = useRef<CommerceService>(getInstance(productsByFamily, rootNode, options, uiSpecs))
  return (
    <CommerceServiceContext.Provider value={serviceRef.current}>
      {children}
    </CommerceServiceContext.Provider>
  )
}

export {
  useCommerce, CommerceServiceProvider
}