import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatCurrency, useFormatDate } from '~/features/settings'

export interface RecentSale {
  id: string
  customerName: string | null
  quantity: number
  batchSpecies: string | null
  livestockType: string
  totalAmount: number
  date: Date
}

export interface RecentExpense {
  id: string
  category: string
  description: string
  amount: number
  date: Date
}

interface FarmRecentActivityCardProps {
  recentSales: Array<RecentSale>
  recentExpenses: Array<RecentExpense>
}

export function FarmRecentActivityCard({
  recentSales,
  recentExpenses,
}: FarmRecentActivityCardProps) {
  const { t } = useTranslation(['farms', 'common', 'expenses'])
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const [activityTab, setActivityTab] = useState<'sales' | 'expenses'>('sales')

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('farms:recentActivity.title')}</CardTitle>
          <div className="flex bg-muted rounded-md p-1">
            <button
              onClick={() => setActivityTab('sales')}
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                activityTab === 'sales'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('farms:recentActivity.sales')}
            </button>
            <button
              onClick={() => setActivityTab('expenses')}
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                activityTab === 'expenses'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('farms:recentActivity.expenses')}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activityTab === 'sales' ? (
          recentSales.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              {t('farms:recentActivity.noSales')}
            </p>
          ) : (
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                >
                  <div>
                    <div className="font-medium">
                      {sale.customerName ||
                        t('farms:recentActivity.noCustomer', {
                          defaultValue: 'Unknown Customer',
                        })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sale.quantity}{' '}
                      {sale.batchSpecies ||
                        t(`common:livestock.${sale.livestockType}`)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">
                      +{formatCurrency(Number(sale.totalAmount))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(sale.date)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-center">
                <Link to="/sales">
                  <Button variant="ghost" size="sm" className="w-full">
                    {t('farms:recentActivity.viewAllSales')}
                  </Button>
                </Link>
              </div>
            </div>
          )
        ) : recentExpenses.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">
            {t('farms:recentActivity.noExpenses')}
          </p>
        ) : (
          <div className="space-y-4">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
              >
                <div>
                  <div className="font-medium capitalize">
                    {t(`expenses:categories.${expense.category}`)}
                  </div>
                  <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {expense.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-destructive">
                    -{formatCurrency(Number(expense.amount))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(expense.date)}
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2 text-center">
              <Link to="/expenses">
                <Button variant="ghost" size="sm" className="w-full">
                  {t('farms:recentActivity.viewAllExpenses')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
