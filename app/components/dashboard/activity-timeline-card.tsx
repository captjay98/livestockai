import {
    Calendar,
    Plus,
    Receipt,
    ShoppingCart,
    TrendingDown,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

export function ActivityTimelineCard() {
    const { t } = useTranslation(['dashboard', 'common'])

    const activityItems = [
        {
            icon: Plus,
            title: t('dashboard.activity.batchAdded', {
                defaultValue: 'Batch added',
            }),
            desc: t('dashboard.activity.newLivestock', {
                defaultValue: 'New livestock',
            }),
            time: t('common.hoursAgo', { count: 2, defaultValue: '2h ago' }),
            color: 'text-emerald-600 bg-emerald-100',
        },
        {
            icon: ShoppingCart,
            title: t('dashboard.activity.saleRecorded', {
                defaultValue: 'Sale recorded',
            }),
            desc: t('dashboard.activity.customerPurchase', {
                defaultValue: 'Customer purchase',
            }),
            time: t('common.hoursAgo', { count: 4, defaultValue: '4h ago' }),
            color: 'text-blue-600 bg-blue-100',
        },
        {
            icon: Receipt,
            title: t('dashboard.activity.expenseLogged', {
                defaultValue: 'Expense logged',
            }),
            desc: t('dashboard.activity.farmSupplies', {
                defaultValue: 'Farm supplies',
            }),
            time: t('common:yesterday', { defaultValue: 'Yesterday' }),
            color: 'text-red-600 bg-red-100',
        },
        {
            icon: TrendingDown,
            title: t('dashboard.activity.mortality', {
                defaultValue: 'Mortality',
            }),
            desc: t('dashboard.activity.healthCheck', {
                defaultValue: 'Health check',
            }),
            time: t('common:yesterday', { defaultValue: 'Yesterday' }),
            color: 'text-amber-600 bg-amber-100',
        },
    ]

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('dashboard.recentActivity', {
                        defaultValue: 'Recent Activity',
                    })}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {activityItems.map((item, i) => (
                        <div key={i} className="relative">
                            <div
                                className={cn(
                                    'absolute -left-[21px] top-0 h-7 w-7 rounded-full flex items-center justify-center',
                                    item.color
                                        .replace('text-', 'bg-')
                                        .replace('600', '200'),
                                )}
                            >
                                <item.icon
                                    className={cn('h-3.5 w-3.5', item.color)}
                                />
                            </div>
                            <div className="pl-2">
                                <p className="text-sm font-medium">
                                    {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {item.desc}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {item.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
