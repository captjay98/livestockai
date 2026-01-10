import { Link, useLocation } from '@tanstack/react-router'
import { Building2, LogOut, User as UserIcon, X } from 'lucide-react'
import { navigation } from '~/components/navigation'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { FarmSelector } from '~/components/farm-selector'
import { ThemeToggle } from '~/components/theme-toggle'

import { User } from '~/lib/auth/types'

interface SidebarProps {
  className?: string
  onClose?: () => void
  user: User
}

export function Sidebar({ className, onClose, user }: SidebarProps) {
  const location = useLocation()

  const userName = user.name || 'User'
  const userEmail = user.email || ''

  return (
    <div
      className={cn(
        'flex flex-col h-full text-sidebar-foreground transition-all duration-300',
        className,
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-3 transition-transform hover:scale-[1.02]"
            onClick={onClose}
          >
            <img src="/logo-wordmark.png" alt="JayFarms" className="h-8" />
          </Link>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <FarmSelector className="w-full shadow-sm rounded-lg" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar">
        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const isActive =
              location.pathname.startsWith(item.href) &&
              (item.href !== '/' || location.pathname === '/')

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 m-4 mt-2 bg-sidebar-accent rounded-lg border border-sidebar-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-background border border-border shadow-sm flex items-center justify-center shrink-0">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{userName}</p>
              {userEmail && (
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
          <ThemeToggle />
        </div>
        <Link to="/login" onClick={onClose}>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 rounded-lg bg-background/50 hover:bg-background border-border/50"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </Link>
      </div>
    </div>
  )
}
