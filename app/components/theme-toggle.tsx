import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { usePreferences, useSettings } from '~/features/settings'

export function ThemeToggle() {
  const { t } = useTranslation(['common'])
  const { theme } = usePreferences()
  const { updateSettings } = useSettings()

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    updateSettings({ theme: newTheme })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
      title={t('common:toggleTheme', { defaultValue: 'Toggle theme' })}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">
        {t('common:toggleTheme', { defaultValue: 'Toggle theme' })}
      </span>
    </Button>
  )
}
