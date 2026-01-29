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
}: NavSectionProps) {
  const location = useLocation()

  if (items.length === 0) return null

  return (
    <Collapsible defaultOpen={defaultOpen} className="space-y-1">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=closed]_&]:-rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5">
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
                'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}
