import { Button, TooltipSimple, type ButtonProps } from '@hanzo/gui'
import { Moon, Sun, SunMoon } from '@hanzogui/lucide-icons-2'
import { useSystemScheme, useUserScheme } from '@vxrn/color-scheme'
import { useEffect, useState } from 'react'

const ORDER = { light: ['system', 'dark', 'light'], dark: ['system', 'light', 'dark'] } as const

/** System, then the opposite of what the system says, then the other one. */
export function ThemeToggle(props: ButtonProps) {
  const user = useUserScheme()
  const system = useSystemScheme()
  const [setting, setSetting] = useState(user.setting)
  useEffect(() => {
    if (user.setting !== setting) setSetting(user.setting)
  }, [user.setting])
  const Icon = setting === 'system' ? SunMoon : setting === 'dark' ? Moon : Sun
  const label = setting === 'system' ? 'System' : setting[0].toUpperCase() + setting.slice(1)
  const next = () => {
    const order = ORDER[system === 'light' ? 'light' : 'dark']
    const to = order[(order.indexOf(user.setting) + 1) % 3]
    setSetting(to)
    setTimeout(() => user.set(to), 20)
  }
  return (
    <TooltipSimple label={label}>
      <Button size="$3" circular chromeless aria-label="Toggle light/dark color scheme" icon={Icon} onPress={next} {...props} />
    </TooltipSimple>
  )
}
