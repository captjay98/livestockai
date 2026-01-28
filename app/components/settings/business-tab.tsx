import { useTranslation } from 'react-i18next'
import { Loader2, Save } from 'lucide-react'
import type { UserSettings } from '~/features/settings'
import { Card } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'

interface BusinessTabProps {
    settings: UserSettings
    onSettingsChange: (updates: Partial<UserSettings>) => void
    onSave: (updates: Partial<UserSettings>) => Promise<void>
    isSaving: boolean
}

export function BusinessTab({
    settings,
    onSettingsChange,
    onSave,
    isSaving,
}: BusinessTabProps) {
    const { t } = useTranslation(['settings', 'common'])

    return (
        <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">{t('business.title')}</h2>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="paymentTerms">
                        {t('business.paymentTerms')}
                    </Label>
                    <Input
                        id="paymentTerms"
                        type="number"
                        min="0"
                        value={
                            settings.defaultPaymentTermsDays === 0
                                ? '0'
                                : settings.defaultPaymentTermsDays || ''
                        }
                        onChange={(e) => {
                            const val = e.target.value
                            if (val === '') {
                                onSettingsChange({
                                    defaultPaymentTermsDays: NaN,
                                })
                            } else {
                                onSettingsChange({
                                    defaultPaymentTermsDays: parseInt(val),
                                })
                            }
                        }}
                        onBlur={(e) => {
                            const val = parseInt(e.target.value)
                            if (isNaN(val)) {
                                onSettingsChange({
                                    defaultPaymentTermsDays: 30,
                                })
                            }
                        }}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('business.paymentTermsDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fiscalYear">
                        {t('business.fiscalYear')}
                    </Label>
                    <Select
                        value={settings.fiscalYearStartMonth.toString()}
                        onValueChange={(value) =>
                            value &&
                            onSettingsChange({
                                fiscalYearStartMonth: parseInt(value),
                            })
                        }
                    >
                        <SelectTrigger id="fiscalYear">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">January</SelectItem>
                            <SelectItem value="2">February</SelectItem>
                            <SelectItem value="3">March</SelectItem>
                            <SelectItem value="4">April</SelectItem>
                            <SelectItem value="5">May</SelectItem>
                            <SelectItem value="6">June</SelectItem>
                            <SelectItem value="7">July</SelectItem>
                            <SelectItem value="8">August</SelectItem>
                            <SelectItem value="9">September</SelectItem>
                            <SelectItem value="10">October</SelectItem>
                            <SelectItem value="11">November</SelectItem>
                            <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {t('business.fiscalYearDesc')}
                    </p>
                </div>
            </div>
            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
                <Button
                    onClick={() =>
                        onSave({
                            defaultPaymentTermsDays:
                                settings.defaultPaymentTermsDays,
                            fiscalYearStartMonth: settings.fiscalYearStartMonth,
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
