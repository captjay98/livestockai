import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatDate } from '~/features/settings'

interface FarmInfoCardProps {
  farm: {
    name: string
    type: string
    location: string
    createdAt: Date
  }
}

export function FarmInfoCard({ farm }: FarmInfoCardProps) {
  const { t } = useTranslation(['farms'])
  const { format: formatDate } = useFormatDate()

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden hover:bg-white/40 dark:hover:bg-black/40 transition-all group relative">
      <div className="absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-10 rounded-full blur-2xl transform translate-x-4 -translate-y-4 pointer-events-none bg-primary transition-opacity" />
      <CardHeader className="relative z-10">
        <CardTitle>{t('farms:detail.info')}</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {t('farms:detail.name')}
            </p>
            <p className="text-sm font-semibold">{farm.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {t('farms:detail.type')}
            </p>
            <p className="text-sm capitalize font-semibold">{farm.type}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {t('farms:detail.location')}
            </p>
            <p className="text-sm font-semibold">{farm.location}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {t('farms:detail.created')}
            </p>
            <p className="text-sm font-semibold">
              {formatDate(farm.createdAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
