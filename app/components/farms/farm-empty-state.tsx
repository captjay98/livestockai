import { Building2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface FarmEmptyStateProps {
  onCreate: () => void
}

export function FarmEmptyState({ onCreate }: FarmEmptyStateProps) {
  const { t } = useTranslation(['farms'])

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden relative border-dashed border-2">
      {/* Decorative Orbs */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="py-20 text-center relative z-10">
        <div className="p-4 rounded-full bg-white/40 dark:bg-white/10 w-fit mx-auto mb-6 shadow-inner border border-white/20">
          <Building2 className="h-10 w-10 text-emerald-500/40" />
        </div>
        <h3 className="text-xl font-black mb-3 tracking-tight">
          {t('farms:empty.title')}
        </h3>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-medium">
          {t('farms:empty.description')}
        </p>
        <Button
          size="lg"
          className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20 hover:scale-[1.05] transition-all"
          onClick={onCreate}
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('farms:create')}
        </Button>
      </CardContent>
    </Card>
  )
}
