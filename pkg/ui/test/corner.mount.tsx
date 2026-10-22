// The corner, mounted the way a host mounts it: under `<Hanzo>`, on a page with
// content behind it, given help links, 85 languages and a currency list.
// `scripts/corner.mjs` drives it in a real browser; it is also the page to open
// by hand (`?dir=rtl`). `?host=own` mounts it the other way a host does: its own
// gui provider, the person's look resolved by the host, signed in, and published
// for the corner (`Look`).
import { useMemo, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider, Paragraph, SizableText, YStack } from '@hanzo/gui'
import { useAppearance, useScheme } from '@hanzo/appearance'
import { BookOpen, GraduationCap, MessagesSquare } from '@hanzogui/lucide-icons-2'

import '../dist/theme.css'
import '../src/styles/motion.css'
import { config } from '../src/gui-config'
import { Hanzo } from '../src/root'
import { Corner, Look } from '../src/corner'
import { CURRENCIES, LANGUAGES } from './corner.data'

const rtl = document.documentElement.dir === 'rtl'
const own = new URLSearchParams(location.search).get('host') === 'own'

/**
 * A host with its own gui provider that resolves the person's look itself, with
 * their IAM account (hanzo.ai does this through @hanzo/rooms `useLook`), and
 * publishes it. The account's preferences are this origin's, answered by the gate.
 */
function Own({ children }: { children: ReactNode }) {
  const { pref, set } = useAppearance({ account: { base: location.origin, token: 'gate' } })
  const look = useMemo(() => ({ pref, set }), [pref, set])
  const scheme = useScheme()
  return (
    <Look.Provider value={look}>
      <GuiProvider config={config} defaultTheme={scheme} disableInjectCSS>
        {children}
      </GuiProvider>
    </Look.Provider>
  )
}

function Page() {
  const [language, setLanguage] = useState(rtl ? 'ar' : 'en')
  const [currency, setCurrency] = useState('USD')
  return (
    <YStack minH="100vh" bg="$background" p="$6" gap="$4">
      <SizableText size="$8" color="$ink" fontWeight="600">
        {rtl ? 'منصة هانزو' : 'Hanzo platform'}
      </SizableText>
      {Array.from({ length: 6 }, (_, i) => (
        <Paragraph key={i} size="$3" color="$aside" maxW={640}>
          {rtl
            ? 'هذه صفحة تجريبية. الزر في الزاوية السفلية يفتح المساعدة والتفضيلات، ويبقى صغيراً حتى لا يغطي المحتوى.'
            : 'A page with content behind the corner. The control at the bottom start corner opens help and preferences, and stays small so it never covers what is under it.'}
        </Paragraph>
      ))}
      <Corner
        help={[
          { label: rtl ? 'احصل على مساعدة' : 'Get help', href: 'https://help.hanzo.ai', icon: <GraduationCap size={18} color="$aside" /> },
          { label: rtl ? 'المستندات' : 'Docs', href: 'https://docs.hanzo.ai', icon: <BookOpen size={18} color="$aside" /> },
          { label: rtl ? 'اتصل بنا' : 'Contact us', href: 'https://hanzo.ai/contact', icon: <MessagesSquare size={18} color="$aside" /> },
        ]}
        language={{ value: language, options: LANGUAGES, onChange: setLanguage }}
        currency={{ value: currency, options: CURRENCIES, onChange: setCurrency }}
        {...(rtl
          ? {
              words: {
                open: 'المساعدة والتفضيلات',
                help: 'مساعدة',
                preferences: 'التفضيلات',
                theme: 'المظهر',
                auto: 'تلقائي',
                light: 'فاتح',
                dark: 'داكن',
                language: 'اللغة',
                currency: 'العملة',
                search: 'بحث',
                back: 'رجوع',
                close: 'إغلاق',
                none: 'لا توجد نتائج',
                leaves: 'يفتح في علامة تبويب جديدة',
              },
            }
          : null)}
      />
    </YStack>
  )
}

// What the published `styles.css` carries and `<Hanzo>` imports: the config's
// theme and token sheet. Off source there is no built sheet, so it is put on the
// document here, once, the way the file would be.
const sheet = document.createElement('style')
sheet.textContent = config.getCSS()
document.head.appendChild(sheet)
document.documentElement.style.setProperty('--hanzo-ui-styles', '1')

createRoot(document.getElementById('root')!).render(
  own ? (
    <Own>
      <Page />
    </Own>
  ) : (
    <Hanzo>
      <Page />
    </Hanzo>
  ),
)
