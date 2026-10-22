// The corner, mounted the way a host mounts it: under `<Hanzo>`, on a page with
// content behind it, given help links, 85 languages and a currency list.
// `scripts/corner.mjs` drives it in a real browser; it is also the page to open
// by hand (`?dir=rtl`).
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Paragraph, SizableText, YStack } from '@hanzo/gui'
import { BookOpen, GraduationCap, MessagesSquare } from '@hanzogui/lucide-icons-2'
import { I18nProvider } from '@hanzo/i18n/react'

import '../dist/theme.css'
import '../src/styles/motion.css'
import { config } from '../src/gui-config'
import { Hanzo } from '../src/root'
import { Corner } from '../src/corner'
import { CURRENCIES, LANGUAGES } from './corner.data'

const rtl = document.documentElement.dir === 'rtl'

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

/** The card's own words in Arabic, keyed by their English, as a host's catalog carries them. */
const AR: Record<string, string> = {
  'Help and preferences': 'المساعدة والتفضيلات',
  Help: 'مساعدة',
  Preferences: 'التفضيلات',
  Theme: 'المظهر',
  Auto: 'تلقائي',
  Light: 'فاتح',
  Dark: 'داكن',
  Language: 'اللغة',
  Currency: 'العملة',
  Search: 'بحث',
  Back: 'رجوع',
  Close: 'إغلاق',
  'No matches': 'لا توجد نتائج',
  'Search: {list}': 'بحث: {list}',
  '{link} (opens in a new tab)': '{link} (يفتح في علامة تبويب جديدة)',
}

createRoot(document.getElementById('root')!).render(
  <I18nProvider userId="corner" initialLocale={rtl ? 'ar' : 'en'} loadCatalog={async () => AR}>
    <Hanzo>
      <Page />
    </Hanzo>
  </I18nProvider>,
)
