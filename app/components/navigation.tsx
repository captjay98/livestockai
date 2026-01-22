import { Link, useLocation } from '@tanstack/react-router'
import {
  BarChart3,
  Building2,
  Droplets,
  FileText,
  Home,
  Menu,
  Package,
  Receipt,
  Scale,
  Settings,
  ShoppingCart,
  Syringe,
  TrendingDown,
  Truck,
  UserCircle,
  Warehouse,
  Wheat,
  X,
  CheckSquare,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from './theme-toggle'
import { LanguageSwitcher } from './ui/language-switcher'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { useModuleNavigation } from '~/hooks/useModuleNavigation'
// import { NotificationBell } from './notification-bell' // Assuming this exists or will be created/imported correctly if it was working before.
// Wait, if it was working before, maybe it was imported?
// I will check the file content again. I don't see it.
// I'll stick to adding LanguageSwitcher and fixing t.
// If NotificationBell is missing, I should comment it out or try to find where it is.
// Actually, I'll just add LanguageSwitcher and fix t. If NotificationBell is red, I'll deal with it.

// Navigation structure helper (internal)
export const getNavigationSections = (t: any) => [
  {
    title: t('common:operations', { defaultValue: 'Operations' }),
    items: [
      { name: t('common:batches', { defaultValue: 'Batches' }), href: '/batches', icon: Package },
      { name: t('common:tasks', { defaultValue: 'Tasks' }), href: '/vaccinations', icon: CheckSquare }, // Using vaccinations as proxy for tasks/health
      { name: t('common:mortality', { defaultValue: 'Health Alerts' }), href: '/mortality', icon: TrendingDown }, // Using mortality for alerts
    ],
  },
  {
    title: t('common:inventory', { defaultValue: 'Inventory' }),
    items: [
      { name: t('common:feed', { defaultValue: 'Feed Stock' }), href: '/feed', icon: Wheat },
      { name: t('common:inventory', { defaultValue: 'General Inventory' }), href: '/inventory', icon: Warehouse },
      { name: t('common:medicine', { defaultValue: 'Medicine' }), href: '/vaccinations', icon: Syringe }, // Using vaccinations
    ],
  },
  {
    title: t('common:analysis', { defaultValue: 'Analysis' }),
    items: [
      { name: t('common:dashboard', { defaultValue: 'Dashboard' }), href: '/dashboard', icon: Home },
      { name: t('common:reports', { defaultValue: 'P&L Reports' }), href: '/reports', icon: BarChart3 },
      { name: t('common:sales', { defaultValue: 'Sales' }), href: '/sales', icon: ShoppingCart },
      { name: t('common:expenses', { defaultValue: 'Expenses' }), href: '/expenses', icon: Receipt },
    ],
  },
  {
    title: t('common:ecosystem', { defaultValue: 'Ecosystem' }),
    items: [
      { name: t('common:customers', { defaultValue: 'Customers' }), href: '/customers', icon: UserCircle },
      { name: t('common:suppliers', { defaultValue: 'Suppliers' }), href: '/suppliers', icon: Truck },
      { name: t('common:invoices', { defaultValue: 'Invoices' }), href: '/invoices', icon: FileText },
    ],
  },
  {
    title: t('common:setup', { defaultValue: 'Setup' }),
    items: [
      { name: t('common:farms', { defaultValue: 'Farms' }), href: '/farms', icon: Building2 },
      { name: t('common:settings', { defaultValue: 'Settings' }), href: '/settings', icon: Settings },
    ],
  },
]

// Base navigation sections (raw structure without translations for backward compatibility)
export const NAVIGATION_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Daily Operations',
    items: [
      { name: 'Batches', href: '/batches', icon: Package },
      { name: 'Feed', href: '/feed', icon: Wheat },
      { name: 'Mortality', href: '/mortality', icon: TrendingDown },
      { name: 'Weight', href: '/weight', icon: Scale },
      { name: 'Health', href: '/vaccinations', icon: Syringe },
      { name: 'Water', href: '/water-quality', icon: Droplets },
      { name: 'Inventory', href: '/inventory', icon: Warehouse },
    ],
  },
  {
    title: 'Finance',
    items: [
      { name: 'Sales', href: '/sales', icon: ShoppingCart },
      { name: 'Expenses', href: '/expenses', icon: Receipt },
      { name: 'Invoices', href: '/invoices', icon: FileText },
    ],
  },
  {
    title: 'Contacts',
    items: [
      { name: 'Customers', href: '/customers', icon: UserCircle },
      { name: 'Suppliers', href: '/suppliers', icon: Truck },
    ],
  },
  {
    title: 'Setup',
    items: [
      { name: 'Farms', href: '/farms', icon: Building2 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

// Flat navigation for backward compatibility
export const navigation = NAVIGATION_SECTIONS.flatMap(
  (section) => section.items,
)

export function Navigation() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const sections = getNavigationSections(t)
  const navItems = sections.flatMap((section) => section.items)
  const filteredNavigation = useModuleNavigation(navItems)

  return (
    <>
      <nav className="hidden md:flex items-center gap-1">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-3 py-2 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                isActive
                  ? 'bg-accent/50 text-accent-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-md border-b shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="container mx-auto px-4 py-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname.startsWith(item.href)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]',
                        isActive
                          ? 'bg-primary/10 text-primary border-primary/20 border'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export function Header() {
  const { t } = useTranslation(['common', 'auth'])
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6 overflow-hidden">
            <Link
              to="/"
              className="flex items-center gap-2 transition-transform hover:scale-105 shrink-0"
            >
              <div className="bg-primary/10 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:inline-block">
                OpenLivestock
              </span>
            </Link>

            <div className="hidden md:flex items-center overflow-x-auto no-scrollbar mask-fade-right">
              <Navigation />
            </div>

            <div className="md:hidden flex items-center">
              <Navigation />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* <NotificationBell /> */}
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              {t('common:signOut', { defaultValue: 'Sign Out' })}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
