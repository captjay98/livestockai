import { ClipboardList } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function TaskPageHeader() {
  const { t } = useTranslation(['common', 'tasks'])

  return (
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-primary/10 rounded-xl">
        <ClipboardList className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{t('common:tasks')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('tasks:description')}
        </p>
      </div>
    </div>
  )
}
