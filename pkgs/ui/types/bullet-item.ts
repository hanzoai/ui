import React from 'react'

interface BulletItem {
  text: string,
  icon?: React.ReactNode // Icon = ReactNode; ReactNode can be a string
}

export {
  type BulletItem as default
}