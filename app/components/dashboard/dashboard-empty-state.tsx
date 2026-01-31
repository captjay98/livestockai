import { useTranslation } from 'react-i18next'
import { Package, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface DashboardEmptyStateProps {
  selectedFarmId: string | null
  onCreateBatch: () => void
}

export function DashboardEmptyState({
  selectedFarmId,
  onCreateBatch,
}: DashboardEmptyStateProps) {
  const { t } = useTranslation(['dashboard', 'batches'])

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden relative border-dashed border-2">
      {/* Decorative Orbs */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="py-16 sm:py-24 text-center relative z-10">
        <div className="p-4 rounded-full bg-white/40 dark:bg-white/10 w-fit mx-auto mb-6 shadow-inner border border-white/20">
          <Package className="h-10 w-10 text-primary/40" />
        </div>
        <h3 className="text-xl font-black mb-3 tracking-tight">
          {t('noDataTitle', {
            defaultValue: 'No data available yet',
          })}
        </h3>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-medium">
          {t('noDataDescription', {
            defaultValue: 'Start adding batches to see your metrics.',
          })}
        </p>
        <Button
          size="lg"
          className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20 hover:scale-[1.05] transition-all"
          onClick={() => selectedFarmId && onCreateBatch()}
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('batches:create', {
            defaultValue: 'Add Your First Batch',
          })}
        </Button>
      </CardContent>
    </Card>
  )
}
