import type Icon from './icon'

interface BulletItem {
  text: string,
  icon?: Icon | string // Icon = ReactNode; ReactNode can be a string
}

export {
  type BulletItem as default
}