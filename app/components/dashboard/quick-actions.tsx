import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
    Activity,
    AlertTriangle,
    Receipt,
    ShoppingCart,
    TrendingUp,
    Users,
    Wheat,
} from 'lucide-react'
import type { DashboardAction } from '~/features/dashboard/types'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface QuickActionsProps {
    selectedFarmId: string | null
    onAction: (action: DashboardAction) => void
}

export function QuickActions({ selectedFarmId, onAction }: QuickActionsProps) {
    const { t } = useTranslation(['dashboard', 'common'])

    const actions = [
        {
            id: 'batches',
            icon: Users,
            label: t('common:batches', { defaultValue: 'Batches' }),
            onClick: () => onAction('batch'),
        },
        {
            id: 'feed',
            icon: Wheat,
            label: t('common:feed', { defaultValue: 'Feed' }),
            onClick: () => onAction('feed'),
        },
        {
            id: 'expenses',
            icon: Receipt,
            label: t('common:expenses', { defaultValue: 'Expenses' }),
            onClick: () => onAction('expense'),
        },
        {
            id: 'sale',
            icon: ShoppingCart,
            label: t('newSale', { defaultValue: 'New Sale' }),
            onClick: () => onAction('sale'),
        },
        {
            id: 'mortality',
            icon: AlertTriangle,
            label: t('common:mortality', { defaultValue: 'Mortality' }),
            onClick: () => onAction('mortality'),
        },
    ]

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t('quickActions', { defaultValue: 'Quick Actions' })}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {actions.map((action) => (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            disabled={!selectedFarmId}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <action.icon className="h-5 w-5" />
                            <span className="text-xs font-medium">
                                {action.label}
                            </span>
                        </button>
                    ))}
                    <Link
                        to="/reports"
                        search={{
                            reportType: 'profit-loss',
                            farmId: selectedFarmId || undefined,
                            startDate: new Date(
                                Date.now() - 30 * 24 * 60 * 60 * 1000,
                            )
                                .toISOString()
                                .split('T')[0],
                            endDate: new Date().toISOString().split('T')[0],
                        }}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                    >
                        <TrendingUp className="h-5 w-5" />
                        <span className="text-xs font-medium">
                            {t('common:reports', { defaultValue: 'Reports' })}
                        </span>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
