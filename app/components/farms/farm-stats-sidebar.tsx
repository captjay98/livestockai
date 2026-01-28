import { TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatCurrency } from '~/features/settings'

interface FarmStatsSidebarProps {
    stats: {
        batches: {
            totalLivestock: number
            active: number
        }
        sales: {
            revenue: number
            count: number
        }
        expenses: {
            amount: number
            count: number
        }
    }
}

export function FarmStatsSidebar({ stats }: FarmStatsSidebarProps) {
    const { t } = useTranslation(['farms'])
    const { format: formatCurrency } = useFormatCurrency()

    return (
        <div className="space-y-6">
            <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('farms:dashboard.livestock')}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.batches.totalLivestock.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('farms:dashboard.activeBatches', {
                            count: stats.batches.active,
                        })}
                    </p>
                </CardContent>
            </Card>
            <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('farms:dashboard.revenue')}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(stats.sales.revenue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('farms:dashboard.salesTransactions', {
                            count: stats.sales.count,
                        })}
                    </p>
                </CardContent>
            </Card>
            <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('farms:dashboard.expenses')}
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(stats.expenses.amount)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('farms:dashboard.expenseRecords', {
                            count: stats.expenses.count,
                        })}
                    </p>
                </CardContent>
            </Card>
            <div className="p-4 rounded-lg bg-muted/50 border border-muted text-sm text-muted-foreground">
                <h4 className="font-semibold text-foreground mb-1">
                    {t('farms:quickActions.tip.title')}
                </h4>
                <p>{t('farms:quickActions.tip.text')}</p>
            </div>
        </div>
    )
}
