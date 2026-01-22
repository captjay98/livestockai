import { Link } from '@tanstack/react-router'
import { Building2, TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

interface FarmQuickActionsProps {
  farmId: string
  onRecordSale: () => void
  onRecordExpense: () => void
}

export function FarmQuickActions({
  farmId,
  onRecordSale,
  onRecordExpense,
}: FarmQuickActionsProps) {
  const { t } = useTranslation(['farms', 'reports'])

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>{t('farms:quickActions.title')}</CardTitle>
        <CardDescription>{t('farms:quickActions.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/batches" className="w-full">
            <Button
              variant="outline"
              className="h-auto p-4 w-full glass flex flex-col items-center justify-center gap-2 hover:bg-accent"
            >
              <Building2 className="h-6 w-6 text-primary" />
              <div className="font-medium">
                {t('farms:quickActions.manageBatches')}
              </div>
            </Button>
          </Link>

          <Button
            variant="outline"
            className="h-auto p-4 w-full glass text-emerald-600 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50"
            onClick={onRecordSale}
          >
            <TrendingUp className="h-6 w-6" />
            <div className="font-medium">
              {t('farms:quickActions.recordSale')}
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 w-full glass text-destructive flex flex-col items-center justify-center gap-2 hover:bg-red-50"
            onClick={onRecordExpense}
          >
            <TrendingDown className="h-6 w-6" />
            <div className="font-medium">
              {t('farms:quickActions.recordExpense')}
            </div>
          </Button>

          <Link
            to="/reports"
            search={{
              reportType: t('reports:profitAndLoss', {
                defaultValue: 'profit-loss',
              }),
              farmId: farmId,
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
              endDate: new Date().toISOString().split('T')[0],
            }}
            className="w-full"
          >
            <Button
              variant="outline"
              className="h-auto p-4 w-full glass text-blue-600 flex flex-col items-center justify-center gap-2 hover:bg-blue-50"
            >
              <Building2 className="h-6 w-6" />
              <div className="font-medium">
                {t('farms:quickActions.viewReports')}
              </div>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
