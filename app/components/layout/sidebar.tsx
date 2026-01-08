import { Link, useLocation } from '@tanstack/react-router'
import { navigation } from '~/components/navigation'
import { cn } from '~/lib/utils'
import { Building2, LogOut, User, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { FarmSelector } from '~/components/farm-selector'
import { ThemeToggle } from '~/components/theme-toggle'
import { useSession } from '~/lib/auth/client'

interface SidebarProps {
  className?: string
  onClose?: () => void
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const location = useLocation()
  const { data: session } = useSession()

  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email || ''

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground',
        className,
      )}
    >
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="bg-primary/10 p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">JayFarms</span>
          </Link>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-3 py-3 border-b border-sidebar-border">
        <FarmSelector className="w-full" />
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
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
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              {userEmail && (
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              )}
            </div>
          </div>
          <ThemeToggle />
        </div>
        <Link to="/login" onClick={onClose}>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
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
