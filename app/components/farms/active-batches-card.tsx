import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatDate } from '~/features/settings'

export interface ActiveBatch {
  id: string
  species: string
  acquisitionDate: Date
  currentQuantity: number
  livestockType: string
}

interface ActiveBatchesCardProps {
  batches: Array<ActiveBatch>
}

export function ActiveBatchesCard({ batches }: ActiveBatchesCardProps) {
  const { t } = useTranslation(['farms', 'common'])
  const { format: formatDate } = useFormatDate()

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-3xl overflow-hidden hover:bg-white/40 dark:hover:bg-black/40 transition-all h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
          {t('farms:activeBatches.title')}
        </CardTitle>
        <Link to="/batches" preload="intent">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-primary rounded-lg text-xs font-bold uppercase tracking-wider"
          >
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        {batches.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-white/20 dark:bg-white/5 rounded-2xl border border-dashed border-white/10">
            <span className="opacity-70 block mb-2">
              {t('farms:activeBatches.noBatches')}
            </span>
            <div className="mt-3">
              <Link to="/batches" preload="intent">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold bg-white/50 hover:bg-white/80 border-white/20"
                >
                  {t('farms:activeBatches.create')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/10 hover:border-primary/20 hover:bg-white/60 dark:hover:bg-white/5 transition-all group"
              >
                <div>
                  <div className="font-bold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors flex items-center gap-2">
                    {batch.species}
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 h-4 rounded-md bg-white/50 dark:bg-white/10 uppercase tracking-widest font-bold"
                    >
                      Active
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-1 pl-0.5">
                    {t('common:started')}: {formatDate(batch.acquisitionDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl tabular-nums leading-none">
                    {batch.currentQuantity.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1 text-right">
                    {t(`common:livestock.${batch.livestockType}`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
