import '@hanzo/gui-polyfill-dev'

import { MenuPredefined } from '@hanzo/gui-create-menu'

import { createMenu } from './Menu'

export const Menu = createMenu({
  Icon: MenuPredefined.MenuIcon,
  Image: MenuPredefined.MenuImage,
  Indicator: MenuPredefined.MenuIndicator,
  Item: MenuPredefined.MenuItem,
  Label: MenuPredefined.MenuLabel,
  MenuGroup: MenuPredefined.MenuGroup,
  Separator: MenuPredefined.MenuSeparator,
  SubTitle: MenuPredefined.SubTitle,
  Title: MenuPredefined.Title,
})
