import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'

interface VaccinationFiltersProps {
    type: 'all' | 'vaccination' | 'treatment'
    onTypeChange: (type: 'all' | 'vaccination' | 'treatment') => void
}

export function VaccinationFilters({
    type,
    onTypeChange,
}: VaccinationFiltersProps) {
    const { t } = useTranslation(['common', 'vaccinations'])

    return (
        <Tabs
            value={type}
            onValueChange={(val) =>
                onTypeChange(val as 'all' | 'vaccination' | 'treatment')
            }
        >
            <TabsList>
                <TabsTrigger value="all">{t('common:all')}</TabsTrigger>
                <TabsTrigger value="vaccination">
                    {t('vaccinations:tabs.vaccinations')}
                </TabsTrigger>
                <TabsTrigger value="treatment">
                    {t('vaccinations:tabs.treatments')}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
