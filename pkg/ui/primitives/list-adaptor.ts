interface ListAdaptor<T> {
  getValue:   (el: T) => string
  equals:     (el1: T, el2: T) => boolean
  valueEquals: (el: T, v: string) => boolean
  getLabel?:  (el: T) => string 
  getImageUrl?:  (el: T) => string | null
}

export {
  type ListAdaptor as default
}
