type ConcreteDimensions = {
  w: number
  h: number
}

  // TODO: This is only used by VideoDef. 
  // Is there a better way w @next/video?  
type TShirtDimensions = { 
  xs?: ConcreteDimensions            
  sm?: ConcreteDimensions 
  md:  ConcreteDimensions 
  lg?: ConcreteDimensions 
  xl?: ConcreteDimensions
}

export {
  type TShirtDimensions as default
}

  