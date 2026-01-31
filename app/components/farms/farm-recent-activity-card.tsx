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
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-3xl overflow-hidden hover:bg-white/40 dark:hover:bg-black/40 transition-all h-full">
      <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-bold">
            {t('farms:recentActivity.title')}
          </CardTitle>
          <div className="flex bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setActivityTab('sales')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activityTab === 'sales'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
              }`}
            >
              {t('farms:recentActivity.sales')}
            </button>
            <button
              onClick={() => setActivityTab('expenses')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activityTab === 'expenses'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/10 hover:border-emerald-500/20 hover:bg-white/60 dark:hover:bg-white/5 transition-all group"
                >
                  <div>
                    <div className="font-bold text-sm text-foreground group-hover:text-emerald-600 transition-colors">
                      {sale.customerName ||
                        t('farms:recentActivity.noCustomer', {
                          defaultValue: 'Unknown Customer',
                        })}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">
                      {sale.quantity}{' '}
                      {sale.batchSpecies ||
                        t(`common:livestock.${sale.livestockType}`)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-emerald-600 tabular-nums">
                      +{formatCurrency(Number(sale.totalAmount))}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                      {formatDate(sale.date)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-center">
                <Link to="/sales" preload="intent">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs hover:bg-white/10"
                  >
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
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/10 hover:border-red-500/20 hover:bg-white/60 dark:hover:bg-white/5 transition-all group"
              >
                <div>
                  <div className="font-bold text-sm capitalize text-foreground group-hover:text-destructive transition-colors">
                    {t(`expenses:categories.${expense.category}`)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px] font-medium mt-0.5">
                    {expense.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-destructive tabular-nums">
                    -{formatCurrency(Number(expense.amount))}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {formatDate(expense.date)}
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2 text-center">
              <Link to="/expenses" preload="intent">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs hover:bg-white/10"
                >
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
