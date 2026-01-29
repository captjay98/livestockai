import {
  Hammer,
  Megaphone,
  Package,
  Pill,
  Settings,
  Truck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'

export const CATEGORY_COLORS: Record<string, string> = {
  feed: 'text-primary bg-primary/10',
  medicine: 'text-destructive bg-destructive/10',
  equipment: 'text-info bg-info/10',
  utilities: 'text-warning bg-warning/10',
  labor: 'text-purple bg-purple/10',
  transport: 'text-success bg-success/10',
  livestock: 'text-warning bg-warning/10',
  livestock_chicken: 'text-primary bg-primary/10',
  livestock_fish: 'text-info bg-info/10',
  maintenance: 'text-slate bg-slate/10',
  marketing: 'text-purple bg-purple/10',
  other: 'text-muted-foreground bg-muted',
}

export const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    feed: <Package className="h-4 w-4" />,
    medicine: <Pill className="h-4 w-4" />,
    equipment: <Wrench className="h-4 w-4" />,
    labor: <Users className="h-4 w-4" />,
    utilities: <Zap className="h-4 w-4" />,
    transport: <Truck className="h-4 w-4" />,
    maintenance: <Hammer className="h-4 w-4" />,
    marketing: <Megaphone className="h-4 w-4" />,
    other: <Settings className="h-4 w-4" />,
  }
  return iconMap[category] || <Settings className="h-4 w-4" />
}
