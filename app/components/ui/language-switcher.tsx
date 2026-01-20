import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import type { UserSettingsTable } from '~/lib/db/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { useSettings } from '~/features/settings/context'
import { LANGUAGE_STORAGE_KEY } from '~/features/i18n/config'

type Language = UserSettingsTable['language']

const LANGUAGES: ReadonlyArray<{
  code: Language
  label: string
  flag: string
}> = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
]

export interface LanguageSwitcherProps {
  showLabel?: boolean
}

export function LanguageSwitcher({ showLabel = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const { updateSettings } = useSettings()

  const currentLanguage = LANGUAGES.find((l) => l.code === i18n.language)

  const handleLanguageChange = async (newLang: Language) => {
    // 1. Save to localStorage FIRST (always works, even without auth)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang)

    // 2. Update i18n instance immediately for UI feedback
    await i18n.changeLanguage(newLang)

    // 3. Try to sync to server settings (if authenticated)
    // This will fail silently on unauthenticated pages
    try {
      await updateSettings({ language: newLang })
    } catch {
      // Silently fail - localStorage is our source of truth
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size={showLabel ? 'default' : 'sm'}
            className="gap-2 px-3"
          >
            {currentLanguage ? (
              <>
                <span className="text-base">{currentLanguage.flag}</span>
                <span className="text-sm font-medium">
                  {currentLanguage.label}
                </span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 text-muted-foreground" />
                {showLabel && (
                  <span className="text-sm font-medium">Language</span>
                )}
              </>
            )}
            <span className="sr-only">Switch language</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.label}</span>
            {i18n.language === lang.code && (
              <span className="ml-auto text-xs opacity-50">Active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
