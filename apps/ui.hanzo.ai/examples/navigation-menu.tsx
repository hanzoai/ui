import { Paragraph, Text, YStack } from "@hanzo/gui"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@hanzo/ui"

/** Default — a trigger opens a panel of links; a plain link sits beside it. */
export function Default() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <YStack p="$4" gap="$3" width={280}>
              <NavigationMenuLink href="/ui/button">
                <Text fontWeight="600">Components</Text>
                <Paragraph size="$2" color="$color11">
                  Every module this package ships.
                </Paragraph>
              </NavigationMenuLink>
              <NavigationMenuLink href="/ui/glass">
                <Text fontWeight="600">Glass</Text>
                <Paragraph size="$2" color="$color11">
                  Elevation and the material behind it.
                </Paragraph>
              </NavigationMenuLink>
            </YStack>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/" className={navigationMenuTriggerStyle()}>
            Docs
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
