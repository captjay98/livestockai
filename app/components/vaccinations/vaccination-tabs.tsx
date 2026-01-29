import { Pill, Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'

interface VaccinationTabsProps {
  onVaccinate: () => void
  onTreat: () => void
}

export function VaccinationTabs({
  onVaccinate,
  onTreat,
}: VaccinationTabsProps) {
  const { t } = useTranslation(['vaccinations'])

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button onClick={onVaccinate}>
        <Syringe className="h-4 w-4 mr-2" />
        {t('actions.vaccinate')}
      </Button>
      <Button variant="outline" onClick={onTreat}>
        <Pill className="h-4 w-4 mr-2" />
        {t('actions.treat')}
      </Button>
    </div>
  )
}
