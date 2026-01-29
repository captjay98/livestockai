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
    <Card>
      <CardContent className="py-12 text-center">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('farms:empty.title')}</h3>
        <p className="text-muted-foreground mb-4">
          {t('farms:empty.description')}
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t('farms:create')}
        </Button>
      </CardContent>
    </Card>
  )
}
