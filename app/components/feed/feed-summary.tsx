import { Package, TrendingUp, Wheat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatCurrency } from '~/features/settings'

interface FeedSummaryProps {
    summary: {
        totalQuantityKg: number
        totalCost: number
        recordCount: number
    }
    inventoryCount: number
}

export function FeedSummary({ summary, inventoryCount }: FeedSummaryProps) {
    const { t } = useTranslation(['feed', 'common'])
    const { format: formatCurrency } = useFormatCurrency()

    return (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 mb-6 md:mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
                    <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('feed:summaries.totalConsumed', {
                            defaultValue: 'Total Consumed',
                        })}
                    </CardTitle>
                    <Wheat className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
                    <div className="text-lg sm:text-2xl font-bold">
                        {summary.totalQuantityKg.toLocaleString()}{' '}
                        {t('common:units.kg', { defaultValue: 'kg' })}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {summary.recordCount}{' '}
                        {t('feed:summaries.records', {
                            defaultValue: 'records',
                        })}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
                    <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('feed:summaries.totalCost', {
                            defaultValue: 'Total Cost',
                        })}
                    </CardTitle>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
                    <div className="text-lg sm:text-2xl font-bold">
                        {formatCurrency(summary.totalCost)}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {t('feed:summaries.acrossBatches', {
                            defaultValue: 'across all batches',
                        })}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
                    <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('feed:summaries.feedTypes', {
                            defaultValue: 'Feed Types',
                        })}
                    </CardTitle>
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
                    <div className="text-lg sm:text-2xl font-bold">
                        {inventoryCount}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {t('feed:summaries.inInventory', {
                            defaultValue: 'in inventory',
                        })}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
