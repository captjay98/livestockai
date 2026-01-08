import { Link, useLocation } from '@tanstack/react-router'
import { 
  Building2, 
  Users, 
  TrendingDown, 
  BarChart3, 
  Home,
  Menu,
  X,
  ShoppingCart,
  Receipt,
  Wheat,
  Egg,
  Scale,
  Syringe,
  Droplets,
  UserCircle,
  Truck,
  FileText
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '~/lib/utils'

const navigation = [
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
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href)
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 gap-1.5 px-3",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <button
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 px-3 hover:bg-muted hover:text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname.startsWith(item.href)
                  const Icon = item.icon
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 gap-1.5 px-3",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted hover:text-foreground"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">JayFarms</span>
            </Link>
            <Navigation />
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 gap-1.5 px-3 border border-border bg-background hover:bg-muted hover:text-foreground"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
