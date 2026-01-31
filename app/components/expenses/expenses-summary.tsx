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
import type { LucideIcon } from 'lucide-react'
import { SummaryCard } from '~/components/ui/summary-card'

interface ExpensesSummaryData {
  byCategory: Record<string, { count: number; amount: number }>
  total: { count: number; amount: number }
}

interface ExpensesSummaryProps {
  summary: ExpensesSummaryData
  formatCurrency: (value: string | number) => string
}

const CATEGORY_ICONS: Partial<Record<string, LucideIcon>> = {
  feed: Package,
  medicine: Pill,
  equipment: Wrench,
  utilities: Zap,
  labor: Users,
  transport: Truck,
  livestock: Bird,
  livestock_chicken: Bird,
  livestock_fish: Fish,
  maintenance: Hammer,
  marketing: Megaphone,
  other: Settings,
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
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
      <SummaryCard
        title={t('labels.totalExpenses')}
        value={formatCurrency(summary.total.amount)}
        icon={Banknote}
        description={`${summary.total.count} ${t('labels.records')}`}
        className="col-span-2 lg:col-span-1 border-red-500/20 bg-red-500/5 text-red-500"
      />

      {topCategories.map(([category, data]) => (
        <SummaryCard
          key={category}
          title={t('categories.' + category, {
            defaultValue: category,
          })}
          value={formatCurrency(data.amount)}
          icon={CATEGORY_ICONS[category] ?? Settings}
          description={`${data.count} ${t('labels.records')}`}
        />
      ))}
    </div>
  )
}
