import { ChevronDown } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import { cn } from '~/lib/utils'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface NavSectionProps {
  title: string
  items: Array<NavItem>
  defaultOpen?: boolean
  onItemClick?: () => void
}

export function NavSection({
  title,
  items,
  defaultOpen = true,
  onItemClick,
  className,
}: NavSectionProps & { className?: string }) {
  const location = useLocation()

  if (items.length === 0) return null

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn('space-y-1', className)}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-bold text-foreground/60 uppercase tracking-widest hover:text-foreground/80 transition-colors">
        {title}
        <ChevronDown className="h-3 w-3 transition-transform duration-200 [[data-state=closed]_&]:-rotate-90 opacity-50" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {items.map((item) => {
          const isActive =
            location.pathname.startsWith(item.href) &&
            (item.href !== '/' || location.pathname === '/')
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              preload="intent"
              onClick={onItemClick}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-sm border border-primary/10'
                  : 'text-foreground/70 dark:text-foreground/80 hover:bg-white/20 dark:hover:bg-white/10 hover:text-foreground',
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/5 blur-sm" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 relative z-10 transition-transform group-hover:scale-110 duration-300',
                  isActive
                    ? 'text-primary'
                    : 'text-foreground/60 dark:text-foreground/70 group-hover:text-primary/80',
                )}
              />
              <span className="relative z-10">{item.name}</span>
            </Link>
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}
