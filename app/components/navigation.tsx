import { Link, useLocation } from '@tanstack/react-router'
import {
  BarChart3,
  Building2,
  Droplets,
  Egg,
  FileText,
  Home,
  Menu,
  Receipt,
  Scale,
  ShoppingCart,
  Syringe,
  TrendingDown,
  Truck,
  UserCircle,
  Users,
  Wheat,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '~/lib/utils'
import { ThemeToggle } from '~/components/theme-toggle'
import { Button } from '~/components/ui/button'

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Farms', href: '/farms', icon: Building2 },
  { name: 'Inventory', href: '/batches', icon: Users },
  { name: 'Mortality', href: '/mortality', icon: TrendingDown },
  { name: 'Feed', href: '/feed', icon: Wheat },
  { name: 'Eggs', href: '/eggs', icon: Egg },
  { name: 'Weight', href: '/weight', icon: Scale },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Health', href: '/vaccinations', icon: Syringe },
  { name: 'Water', href: '/water-quality', icon: Droplets },
  { name: 'Customers', href: '/customers', icon: UserCircle },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

export function Navigation() {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <nav className="hidden md:flex items-center gap-1">
        {navigation.map((item) => {
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
                {navigation.map((item) => {
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
                JayFarms
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
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
