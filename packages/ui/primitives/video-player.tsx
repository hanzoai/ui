'use client'
import React from 'react'

interface VideoProps extends React.ComponentPropsWithoutRef<"video"> {
  sources: string[]
}

const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoProps>(
({
  sources, 
  ...rest
}, ref) => {
  
  return (
    <video ref={ref} {...rest} >
    {sources.map((source, index) => (  
      <source key={index} src={source} />
    ))} 
    </video>
  )
})

export default VideoPlayer