import { useTranslation } from 'react-i18next'
import {
    Banknote,
    Bird,
    Fish,
    Hammer,
    Megaphone,
    Package,
    Pill,
    Settings,
    Truck,
    Users,
    Wrench,
    Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface ExpensesSummaryData {
    byCategory: Record<string, { count: number; amount: number }>
    total: { count: number; amount: number }
}

interface ExpensesSummaryProps {
    summary: ExpensesSummaryData
    formatCurrency: (value: string | number) => string
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    feed: <Package className="h-4 w-4" />,
    medicine: <Pill className="h-4 w-4" />,
    equipment: <Wrench className="h-4 w-4" />,
    utilities: <Zap className="h-4 w-4" />,
    labor: <Users className="h-4 w-4" />,
    transport: <Truck className="h-4 w-4" />,
    livestock: <Bird className="h-4 w-4" />,
    livestock_chicken: <Bird className="h-4 w-4" />,
    livestock_fish: <Fish className="h-4 w-4" />,
    maintenance: <Hammer className="h-4 w-4" />,
    marketing: <Megaphone className="h-4 w-4" />,
    other: <Settings className="h-4 w-4" />,
}

export function ExpensesSummary({
    summary,
    formatCurrency,
}: ExpensesSummaryProps) {
    const { t } = useTranslation(['expenses'])

    const topCategories = Object.entries(summary.byCategory)
        .sort(([, a], [, b]) => b.amount - a.amount)
        .slice(0, 3)

    return (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6 md:mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
                    <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('labels.totalExpenses')}
                    </CardTitle>
                    <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-2 pt-0">
                    <div className="text-lg sm:text-2xl font-bold text-destructive">
                        {formatCurrency(summary.total.amount)}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {summary.total.count} {t('labels.records')}
                    </p>
                </CardContent>
            </Card>

            {topCategories.map(([category, data]) => (
                <Card key={category}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
                        <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                            {t('categories.' + category, {
                                defaultValue: category,
                            })}
                        </CardTitle>
                        <div className="text-muted-foreground">
                            {CATEGORY_ICONS[category] || (
                                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                        <div className="text-lg sm:text-2xl font-bold">
                            {formatCurrency(data.amount)}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {data.count} {t('labels.records')}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
