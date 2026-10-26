/**
 * The languages dictation listens in, each named in itself. The platform hears
 * the audio, never a browser's built-in recognizer, which ships it to its vendor.
 * Its own module with no imports, so a surface that only names a language
 * (a settings page, a spec) loads it without the composer.
 */
export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'ja', label: '日本語' },
  { id: 'zh', label: '中文' },
]
