import { ClipboardList, HeartPulse, Skull } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SummaryCard } from '~/components/ui/summary-card'

interface MortalitySummaryProps {
  summary: {
    totalDeaths: number
    recordCount: number
    criticalAlerts: number
    totalAlerts: number
  }
}

export function MortalitySummary({ summary }: MortalitySummaryProps) {
  const { t } = useTranslation(['mortality', 'common'])

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 mb-6 md:mb-8">
      <SummaryCard
        title={t('mortality:totalDeaths', { defaultValue: 'Total Deaths' })}
        value={summary.totalDeaths.toLocaleString()}
        icon={Skull}
        className="text-destructive border-destructive/20 bg-destructive/5"
      />

      <SummaryCard
        title={t('mortality:healthAlerts', { defaultValue: 'Health Alerts' })}
        value={`${summary.criticalAlerts}`}
        icon={HeartPulse}
        description={t('mortality:totalAlerts', {
          count: summary.totalAlerts,
          defaultValue: '{{count}} total alerts',
        })}
        className="text-orange-600 border-orange-500/20 bg-orange-500/5"
      />

      <SummaryCard
        title={t('common:records', { defaultValue: 'Records' })}
        value={summary.recordCount}
        icon={ClipboardList}
        description={t('mortality:recordedIncidents', {
          defaultValue: 'Recorded incidents',
        })}
      />
    </div>
  )
}
