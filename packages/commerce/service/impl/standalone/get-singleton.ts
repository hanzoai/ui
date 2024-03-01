import type CommerceService from '../../commerce-service'

import StandaloneCommerceService, {type StandaloneServiceOptions} from './service'

import type { Category, FacetsDesc } from '../../../types'

// https://dev.to/ivandotv/mobx-server-side-rendering-with-next-js-4m18

let instance: CommerceService | undefined =  undefined

export default (categories: Category[], facets: FacetsDesc, options?: any): CommerceService => {

  const _instance = instance ?? 
    new StandaloneCommerceService(
      categories, 
      facets, 
      options ? (options as StandaloneServiceOptions) : {} 
    )
      // For server side rendering always create a new store
  if (typeof window === "undefined") return _instance

    // Create the store once in the client
  if (!instance) {
    instance = _instance
  }  

  return _instance
}