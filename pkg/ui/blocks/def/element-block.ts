import React from 'react'
import type Block from './block'

interface ElementBlock extends Block {
  blockType: 'element'
  element: React.ReactNode | React.ReactElement
}

export {
  type ElementBlock as default 
}