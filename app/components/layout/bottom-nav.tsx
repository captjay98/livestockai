import { Link, useLocation } from '@tanstack/react-router'
import { CheckSquare, Home, Menu, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/lib/utils'

interface BottomNavProps {
  onMenuClick: () => void
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const { t } = useTranslation(['common'])
  const location = useLocation()

  const items = [
    {
      name: t('common:home', { defaultValue: 'Home' }),
      href: '/dashboard', // Main dashboard as Home
      icon: Home,
    },
    {
      name: t('common:batches', { defaultValue: 'Batches' }),
      href: '/batches',
      icon: Package,
    },
    // Using a placeholder for Tasks as it might not be a top-level route yet
    // Mapping it to 'tasks' or 'vaccinations' (Health) for now as closest proxy
    {
      name: t('common:tasks', { defaultValue: 'Tasks' }),
      href: '/tasks',
      icon: CheckSquare,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              preload="intent"
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('h-6 w-6', isActive && 'fill-current/10')} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}

        {/* Menu Button - Opens the Drawers/Sidebar */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <Menu className="h-6 w-6" />
          <span className="text-[10px] font-medium">
            {t('common:menu', { defaultValue: 'Menu' })}
          </span>
        </button>
      </div>
    </div>
  )
}
