import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Bird,
  Calendar,
  Edit,
  Fish,
  MapPin,
  Trash2,
  Warehouse,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useFormatDate } from '~/features/settings'

export interface BatchHeaderData {
  id: string
  batchName: string | null
  species: string
  status: string
  sourceSize: string | null
  acquisitionDate: Date
  livestockType: string
  farmName?: string | null
  structureName?: string | null
}

interface BatchHeaderProps {
  batch: BatchHeaderData
  onEdit: () => void
  onDelete: () => void
}

export function BatchHeader({ batch, onEdit, onDelete }: BatchHeaderProps) {
  const { t } = useTranslation(['batches', 'common'])
  const { format: formatDate } = useFormatDate()

  const ageInDays = Math.floor(
    (new Date().getTime() - new Date(batch.acquisitionDate).getTime()) /
      (1000 * 60 * 60 * 24),
  )

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8 group">
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="mt-1 hover:bg-white/10 rounded-full h-10 w-10"
        >
          <Link
            to="/batches"
            aria-label={t('batches:backToBatches', {
              defaultValue: 'Back to batches',
            })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              {batch.livestockType === 'poultry' ? (
                <Bird className="h-6 w-6 text-orange-600" />
              ) : (
                <Fish className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {batch.batchName || batch.species}
                </h1>
                <Badge
                  variant={batch.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    'rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest',
                    batch.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-muted/50 text-muted-foreground',
                  )}
                >
                  {batch.status}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-2 mt-2 flex-wrap font-medium">
                <span className="text-foreground/80">{batch.species}</span>
                {batch.sourceSize && (
                  <>
                    <span className="opacity-30">•</span>
                    <span className="capitalize">{batch.sourceSize}</span>
                  </>
                )}

                {batch.farmName && (
                  <>
                    <span className="opacity-30">•</span>
                    <div
                      className="flex items-center gap-1.5"
                      title={t('batches:farmLocation', {
                        defaultValue: 'Farm Location',
                      })}
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary/70" />
                      <span className="text-xs">{batch.farmName}</span>
                    </div>
                  </>
                )}

                {batch.structureName && (
                  <>
                    <span className="opacity-30">•</span>
                    <div
                      className="flex items-center gap-1.5"
                      title={t('common:a11y.structure', {
                        defaultValue: 'Structure',
                      })}
                    >
                      <Warehouse className="h-3.5 w-3.5 text-primary/70" />
                      <span className="text-xs">{batch.structureName}</span>
                    </div>
                  </>
                )}

                <span className="opacity-30">•</span>
                <div className="flex items-center gap-1.5 bg-white/40 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <Calendar className="h-3 w-3 text-primary/70" />
                  <span className="text-[11px] font-bold">
                    {formatDate(batch.acquisitionDate)}{' '}
                    <span className="opacity-60">
                      {t('batches:ageInDays', {
                        count: ageInDays,
                        defaultValue: '({{count}} days)',
                      })}
                    </span>
                  </span>
                </div>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="rounded-xl font-bold glass shadow-sm px-4"
        >
          <Edit className="h-4 w-4 mr-2 text-primary" />{' '}
          {t('common:edit', { defaultValue: 'Edit' })}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="rounded-xl font-bold text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all px-4"
        >
          <Trash2 className="h-4 w-4 mr-2" />{' '}
          {t('common:delete', { defaultValue: 'Delete' })}
        </Button>
      </div>
    </div>
  )
}
