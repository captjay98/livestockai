import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '~/components/ui/alert'

interface StalenessIndicatorProps {
  lastSyncTime: Date | null
}

export function StalenessIndicator({ lastSyncTime }: StalenessIndicatorProps) {
  const { t } = useTranslation('marketplace')

  if (!lastSyncTime) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('staleness.noSync', { 
            defaultValue: 'No data available. Please check your connection and try again.' 
          })}
        </AlertDescription>
      </Alert>
    )
  }

  const now = new Date()
  const hoursSinceSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60)
  
  // Show warning if data is older than 24 hours
  if (hoursSinceSync > 24) {
    const daysSinceSync = Math.floor(hoursSinceSync / 24)
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('staleness.stale', { 
            defaultValue: 'Listings may be outdated. Last updated {{days}} day(s) ago.',
            days: daysSinceSync
          })}
        </AlertDescription>
      </Alert>
    )
  }

  return null
}