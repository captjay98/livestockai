import { Link } from '@tanstack/react-router'
import { Building2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '~/components/ui/button'

export function DashboardWelcome() {
  const { t } = useTranslation(['dashboard', 'farms'])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 sm:p-8">
      <div className="bg-muted p-6 sm:p-8 rounded-xl mb-6">
        <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-foreground mx-auto" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
        {t('welcome', { defaultValue: 'Welcome to OpenLivestock' })}
      </h1>
      <p className="text-muted-foreground text-base max-w-md mb-6">
        {t('welcomeDescription', {
          defaultValue:
            'Your complete poultry and fishery management solution. Start by creating your first farm.',
        })}
      </p>
      <Link to="/farms" className={buttonVariants({ size: 'lg' })}>
        <Plus className="h-5 w-5 mr-2" />
        {t('farms:createFirst', { defaultValue: 'Create Your First Farm' })}
      </Link>
    </div>
  )
}
