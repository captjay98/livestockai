import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  BarChart3,
  LogOut,
  MapPin,
  User as UserIcon,
  X,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { NavSection } from './nav-section'
import { RoleSwitcher } from './role-switcher'
import type { User } from '~/features/auth/types'
import { getNavigationSections } from '~/components/navigation'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { FarmSelector } from '~/components/farms/selector'
import { ThemeToggle } from '~/components/theme-toggle'
import { Logo } from '~/components/logo'
import { useModules } from '~/features/modules/context'
import { filterNavigationByModules } from '~/hooks/useModuleNavigation'
import { useExtensionNav } from '~/features/extension/use-extension-nav'
import { useFarm } from '~/features/farms/context'
import { getFarmsForUserFn } from '~/features/farms/server'

interface SidebarProps {
  className?: string
  onClose?: () => void
  user: User
}

export function Sidebar({ className, onClose, user }: SidebarProps) {
  const { t } = useTranslation(['common'])
  const { enabledModules, isLoading } = useModules()
  const { isExtensionWorker, isSupervisor } = useExtensionNav()
  const { selectedFarmId } = useFarm()

  // Fetch user's farms
  const { data: farms = [] } = useQuery({
    queryKey: ['farms', 'user'],
    queryFn: () => getFarmsForUserFn({ data: {} }),
  })

  // Check if user has both farm ownership and extension access
  const hasFarmAccess = !!selectedFarmId || farms.length > 0
  const hasExtensionAccess = isExtensionWorker

  const sections = useMemo(
    () => getNavigationSections(t, (user as any).userType),
    [t, user],
  )

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

  // Add extension section if user is extension worker
  const allSections = useMemo(() => {
    if (!isExtensionWorker) return filteredSections

    const extensionSection = {
      title: t('common:extension', { defaultValue: 'Extension' }),
      items: [
        {
          name: t('common:myDistricts', {
            defaultValue: 'My Districts',
          }),
          href: '/extension',
          icon: MapPin,
        },
        {
          name: t('common:outbreakAlerts', {
            defaultValue: 'Outbreak Alerts',
          }),
          href: '/extension/alerts',
          icon: AlertTriangle,
        },
        ...(isSupervisor
          ? [
              {
                name: t('common:supervisorDashboard', {
                  defaultValue: 'Supervisor Dashboard',
                }),
                href: '/extension/supervisor',
                icon: BarChart3,
              },
            ]
          : []),
      ],
    }

    return [extensionSection, ...filteredSections]
  }, [filteredSections, isExtensionWorker, isSupervisor, t])

  const userName = user.name || t('common:user')
  const userEmail = user.email || ''

  return (
    <div
      className={cn(
        'flex flex-col h-full text-foreground transition-all duration-300 backdrop-blur-xl bg-white/40 dark:bg-black/40 border-r border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden',
        className,
      )}
    >
      {/* Sidebar background gradient mesh */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center gap-3 transition-transform hover:scale-[1.02] group"
            onClick={onClose}
          >
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg group-hover:shadow-primary/20 transition-all">
              <Logo className="h-6 w-auto text-primary" variant="icon" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              LivestockAL
            </span>
          </Link>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <FarmSelector
          farms={farms}
          className="w-full shadow-lg rounded-xl border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-black/60 transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar space-y-6 relative z-10">
        {allSections.map((section) => (
          <NavSection
            key={section.title}
            title={section.title}
            items={section.items}
            defaultOpen={
              section.title === 'Overview' || section.title === 'Operations'
            }
            onItemClick={onClose}
            className="glass-nav-section"
          />
        ))}
      </div>

      {/* Role Switcher - only show if user has both farm and extension access */}
      <RoleSwitcher
        hasFarmAccess={hasFarmAccess}
        hasExtensionAccess={hasExtensionAccess}
      />

      <div className="p-4 m-4 mt-2 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent rounded-2xl border border-white/10 shadow-lg backdrop-blur-md relative z-10 group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-white/10 shadow-inner flex items-center justify-center shrink-0">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {userName}
              </p>
              {userEmail && (
                <p className="text-xs text-muted-foreground/80 truncate">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
          <ThemeToggle />
        </div>
        <Link to="/login" onClick={onClose}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-muted-foreground"
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
