import { Link } from '@tanstack/react-router'
import { ArrowLeft, Edit, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

interface FarmHeaderProps {
  farm: {
    name: string
    type: string
    location: string
  }
  onEdit: () => void
}

export function FarmHeader({ farm, onEdit }: FarmHeaderProps) {
  const { t } = useTranslation(['farms'])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-32 translate-x-32 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100" />

      <div className="flex items-center gap-5 relative z-10">
        <Link to="/farms">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-12 w-12 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/20 dark:border-white/5 backdrop-blur-sm transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 opacity-70" />
            <span className="sr-only">{t('farms:detail.back')}</span>
          </Button>
        </Link>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {farm.name}
            </h1>
            <Badge
              variant={
                farm.type === 'poultry'
                  ? 'default'
                  : farm.type === 'aquaculture'
                    ? 'secondary'
                    : 'outline'
              }
              className="rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm"
            >
              {farm.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <div className="flex items-center gap-1.5 bg-white/40 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-primary/70" />
              <span>{farm.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex sm:justify-end">
        <Button
          onClick={onEdit}
          className="rounded-xl font-bold bg-white/50 dark:bg-white/5 border-white/20 hover:bg-white/70 shadow-sm backdrop-blur-sm"
          variant="outline"
          size="default"
        >
          <Edit className="h-4 w-4 mr-2" />
          {t('farms:detail.edit')}
        </Button>
      </div>
    </div>
  )
}
