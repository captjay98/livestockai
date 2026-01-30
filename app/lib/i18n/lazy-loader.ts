import i18n from './config'

/**
 * Lazy load a language's translations
 * Only loads if not already loaded
 */
export async function loadLanguage(lang: string): Promise<void> {
  // Skip if already loaded
  if (i18n.hasResourceBundle(lang, 'common')) {
    return
  }

  try {
    // Dynamic import of locale file
    const localeModule = await import(`./locales/${lang}/index.ts`)

    // Get the locale object (named export matching language code)
    const locale = localeModule[lang]

    if (!locale) {
      throw new Error(`Locale ${lang} not found in module`)
    }

    // Add all namespaces from the locale
    Object.keys(locale).forEach((namespace) => {
      i18n.addResourceBundle(lang, namespace, locale[namespace], true, true)
    })
  } catch (error) {
    console.error(`Failed to load language: ${lang}`, error)
    throw error
  }
}

/**
 * Preload a language in the background
 * Useful for prefetching likely language switches
 */
export function preloadLanguage(lang: string): void {
  loadLanguage(lang).catch(() => {
    // Silently fail for preloading
  })
}
