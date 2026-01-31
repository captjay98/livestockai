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
      color: 'text-blue-500',
      bgConfig: 'bg-blue-500/10 hover:bg-blue-500/20',
    },
    {
      id: 'feed',
      icon: Wheat,
      label: t('common:feed', { defaultValue: 'Feed' }),
      onClick: () => onAction('feed'),
      color: 'text-amber-500',
      bgConfig: 'bg-amber-500/10 hover:bg-amber-500/20',
    },
    {
      id: 'expenses',
      icon: Receipt,
      label: t('common:expenses', { defaultValue: 'Expenses' }),
      onClick: () => onAction('expense'),
      color: 'text-red-500',
      bgConfig: 'bg-red-500/10 hover:bg-red-500/20',
    },
    {
      id: 'sale',
      icon: ShoppingCart,
      label: t('newSale', { defaultValue: 'New Sale' }),
      onClick: () => onAction('sale'),
      color: 'text-emerald-500',
      bgConfig: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    },
    {
      id: 'mortality',
      icon: AlertTriangle,
      label: t('common:mortality', { defaultValue: 'Mortality' }),
      onClick: () => onAction('mortality'),
      color: 'text-orange-500',
      bgConfig: 'bg-orange-500/10 hover:bg-orange-500/20',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        {t('quickActions', { defaultValue: 'Quick Actions' })}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={!selectedFarmId}
            className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div
              className={`p-2.5 rounded-xl ${action.bgConfig} transition-colors`}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
        <Link
          to="/reports"
          search={{
            reportType: 'profit-loss',
            farmId: selectedFarmId || undefined,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          }}
          className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors text-center leading-tight">
            {t('common:reports', { defaultValue: 'Reports' })}
          </span>
        </Link>
      </div>
    </div>
  )
}
