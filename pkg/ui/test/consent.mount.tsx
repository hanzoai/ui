// The cookie bar, mounted the way a host mounts it: once, under a gui provider,
// on a page with content behind it, under the rule cloud served (`?mode=eu` or
// `?mode=global`; `?theme=light`, `?dir=rtl`). `scripts/consent.mjs` drives it in
// a real browser; it is also the page to open by hand.
import { createRoot } from 'react-dom/client'
import { GuiProvider, Paragraph, SizableText, YStack } from '@hanzo/gui'
import { serveConsent } from '@hanzo/event'
import { I18nProvider } from '@hanzo/i18n/react'

import '../dist/theme.css'
import { config } from '../src/gui-config'
import { Consent } from '../src/consent'

const q = new URLSearchParams(location.search)
const rtl = document.documentElement.dir === 'rtl'
const theme = q.get('theme') === 'light' ? 'light' : 'dark'
const mode = q.get('mode') === 'global' ? 'global' : 'eu'

// Cloud's answer, as `startTags` hands it over: the rule this visitor is under.
serveConsent({ region: mode === 'eu' ? 'DE' : 'KR', mode, version: 3, floor: 2, refused: false, defaults: {} })

// The config's theme and token sheet, as the published `styles.css` carries it.
const sheet = document.createElement('style')
sheet.textContent = config.getCSS()
document.head.appendChild(sheet)
document.documentElement.classList.add(theme)

/** The bar's own words in Arabic, keyed by their English, as a host's catalog carries them. */
const AR: Record<string, string> = {
  'We use cookies to improve your experience. By continuing to browse, you agree.': 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك. بمتابعة التصفح فإنك توافق.',
  'Essential cookies keep {brand} running. With your OK, optional cookies help us measure performance and ads.':
    'ملفات تعريف الارتباط الأساسية تبقي {brand} يعمل. بموافقتك، تساعدنا الملفات الاختيارية في قياس الأداء والإعلانات.',
  'Your Privacy Choices': 'خيارات الخصوصية',
  'Manage preferences': 'إدارة التفضيلات',
  'Accept all': 'قبول الكل',
  Close: 'إغلاق',
  'Close and use essential cookies only': 'إغلاق واستخدام ملفات تعريف الارتباط الأساسية فقط',
}

createRoot(document.getElementById('root')!).render(
  <I18nProvider userId="consent" initialLocale={rtl ? 'ar' : 'en'} loadCatalog={async () => AR}>
    <GuiProvider config={config} defaultTheme={theme}>
      <YStack minH="100vh" bg="$background" p="$6" gap="$4">
        <SizableText size="$8" color="$ink" fontWeight="600">
          {rtl ? 'منصة هانزو' : 'Hanzo platform'}
        </SizableText>
        {Array.from({ length: 8 }, (_, i) => (
          <Paragraph key={i} size="$3" color="$aside" maxW={640}>
            {rtl
              ? 'هذه صفحة تجريبية خلف شريط ملفات تعريف الارتباط.'
              : 'A page with content behind the cookie bar, which stands at the foot of the window until the visitor answers it.'}
          </Paragraph>
        ))}
        <Consent />
      </YStack>
    </GuiProvider>
  </I18nProvider>,
)
