import { Link } from '@tanstack/react-router'
import { LogOut, User as UserIcon, X } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NavSection } from './nav-section'
import type { User } from '~/features/auth/types'
import { getNavigationSections } from '~/components/navigation'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { FarmSelector } from '~/components/farms/selector'
import { ThemeToggle } from '~/components/theme-toggle'
import { Logo } from '~/components/logo'
import { useModules } from '~/features/modules/context'
import { filterNavigationByModules } from '~/hooks/useModuleNavigation'

interface SidebarProps {
  className?: string
  onClose?: () => void
  user: User
}

export function Sidebar({ className, onClose, user }: SidebarProps) {
  const { t } = useTranslation(['common'])
  const { enabledModules, isLoading } = useModules()

  const sections = useMemo(() => getNavigationSections(t), [t])

  const filteredSections = useMemo(() => {
    // Show all navigation when no modules loaded (no farm selected or loading)
    if (enabledModules.length === 0 && !isLoading) {
      return sections
    }

    return sections
      .map((section) => ({
        ...section,
        items: filterNavigationByModules(section.items, enabledModules),
      }))
      .filter((section) => section.items.length > 0)
  }, [enabledModules, isLoading, sections])

  const userName = user.name || t('common:user')
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
            <Logo className="h-8" variant="full" />
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

      <div className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar space-y-4">
        {filteredSections.map((section) => (
          <NavSection
            key={section.title}
            title={section.title}
            items={section.items}
            defaultOpen={section.title !== 'Setup'}
            onItemClick={onClose}
          />
        ))}
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
            {t('common:signOut')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
