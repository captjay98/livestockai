import { Rocket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '~/components/ui/skeleton'
import { PageHeader } from '~/components/page-header'
import { LogoSpinner } from '~/components/ui/loading/logo-spinner'

export function OnboardingSkeleton() {
  const { t } = useTranslation('onboarding')

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t('title')}
        description={t('description')}
        icon={Rocket}
      />

      <div className="max-w-2xl mx-auto space-y-12">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Loading Visual */}
        <div className="flex flex-col items-center justify-center p-12 border border-white/10 rounded-[2.5rem] bg-white/5 backdrop-blur-sm space-y-6">
          <LogoSpinner size="lg" variant="pulse" />
          <div className="space-y-2 text-center">
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>

        {/* Step Content Placeholder */}
        <div className="border border-white/5 rounded-[2rem] p-8 space-y-8 bg-white/5">
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-12 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
