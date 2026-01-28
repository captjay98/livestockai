import { useTranslation } from 'react-i18next'
import { Loader2, Save } from 'lucide-react'
import type { UserSettings } from '~/features/settings'
import { Card } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { LanguageSwitcher } from '~/components/ui/language-switcher'

interface PreferencesTabProps {
    settings: UserSettings
    onSettingsChange: (updates: Partial<UserSettings>) => void
    onSave: (updates: Partial<UserSettings>) => Promise<void>
    isSaving: boolean
}

export function PreferencesTab({
    settings,
    onSettingsChange,
    onSave,
    isSaving,
}: PreferencesTabProps) {
    const { t } = useTranslation(['settings', 'common'])

    return (
        <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">{t('title')}</h2>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="language">{t('language')}</Label>
                    <LanguageSwitcher />
                    <p className="text-xs text-muted-foreground">
                        {t('languageDescription')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="theme">
                        {t('theme.label', { defaultValue: 'Theme' })}
                    </Label>
                    <Select
                        value={settings.theme}
                        onValueChange={(value) =>
                            value &&
                            onSettingsChange({
                                theme: value,
                            })
                        }
                    >
                        <SelectTrigger id="theme">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">
                                {t('theme.light', { defaultValue: 'Light' })}
                            </SelectItem>
                            <SelectItem value="dark">
                                {t('theme.dark', { defaultValue: 'Dark' })}
                            </SelectItem>
                            <SelectItem value="system">
                                {t('theme.system', { defaultValue: 'System' })}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
                <Button
                    onClick={() =>
                        onSave({
                            language: settings.language,
                            theme: settings.theme,
                        })
                    }
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    {t('common:save')}
                </Button>
            </div>
        </Card>
    )
}
