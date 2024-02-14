// From Next Image Dim
type Dimensions = {
  w: number | `${number}`
  h: number | `${number}`
}

type TShirtDimensions = { 
  xs?: Dimensions            
  sm?: Dimensions 
  md:  Dimensions 
  lg?: Dimensions 
  xl?: Dimensions
}

export {
  type Dimensions,
  type TShirtDimensions
}

  