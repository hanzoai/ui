'use client'
import React, { 
  createContext, 
  useContext, 
  useRef, 
  type PropsWithChildren 
} from 'react'

// https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18
import { enableStaticRendering } from 'mobx-react-lite'
enableStaticRendering(typeof window === "undefined")

import type { ServiceOptions } from '..'
import type CommerceService from '../types/commerce-service'
import getInstance from '../service/get-instance'
import type { Family, CategoryNode, SelectionUISpecifier } from '../types'
import  { type CommerceUI, CommerceUIStore } from './commerce-ui'

type CommerceContextValue = {
  service: CommerceService
  ui: CommerceUI  
}

const CommerceContext = createContext<CommerceContextValue | undefined>(undefined)

const useCommerce = (): CommerceService => {
  return (useContext(CommerceContext) as CommerceContextValue)?.service
}

const useCommerceUI = (): CommerceUI => {
  return (useContext(CommerceContext) as CommerceContextValue)?.ui
}

const CommerceProvider: React.FC<PropsWithChildren & {
  families: Family[]
  rootNode: CategoryNode
  options?: ServiceOptions
  uiSpecs?: Record<string, SelectionUISpecifier>
}> = ({ 
  children,
  families,
  rootNode,
  options,
  uiSpecs
}) => {

    // TODO: Inject Promo fixture here from siteDef
  const serviceRef = useRef<CommerceContextValue>({
    service: getInstance(families, rootNode, options, uiSpecs),
    ui: new CommerceUIStore()
  })
  return (
    <CommerceContext.Provider value={serviceRef.current}>
      {children}
    </CommerceContext.Provider>
  )
}

export {
  useCommerce, 
  useCommerceUI, 
  CommerceProvider
}