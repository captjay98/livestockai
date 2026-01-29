import { Droplets } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '~/components/page-header'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'

export function WaterQualitySkeleton() {
  const { t } = useTranslation('water-quality')
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        icon={Droplets}
        actions={
          <Button disabled>
            <Skeleton className="h-4 w-4 mr-2" />
            {t('addRecord')}
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
