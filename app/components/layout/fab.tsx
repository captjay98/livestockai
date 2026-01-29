import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  ClipboardList,
  Droplets,
  HeartPulse,
  Plus,
  ShoppingCart,
  Wheat,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export function GlobalQuickAction() {
  const { t } = useTranslation(['common', 'batches'])
  const navigate = useNavigate()
  const location = useLocation()

  // Extract batchId from URL if present
  // Note: useParams might not work directly here if this component is outside the route context
  // So we parse location.pathname
  const batchIdMatch = location.pathname.match(/\/batches\/([^/]+)/)
  const batchId = batchIdMatch ? batchIdMatch[1] : null

  const handleAction = (action: string) => {
    if (batchId) {
      // If we are already in a batch context, we might want to open a modal
      // For now, let's navigate to the specific tab/action
      // Implementation depends on how we handle "Log" actions (modals vs separate routes)
      // Assuming existing tabs for now as per plan
      switch (action) {
        case 'feed':
          // navigate({ to: `/batches/${batchId}`, search: { tab: 'feed' } })
          // For now, simpler navigation, assuming we will add query params or state later
          console.log('Log Feed for', batchId)
          break
        case 'mortality':
          console.log('Log Mortality for', batchId)
          break
      }
    } else {
      // If no batch, we would ask "Which Batch?"
      // For MVP, we go to Batches list
      navigate({ to: '/batches' })
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
          >
            <Plus className="h-8 w-8" />
            <span className="sr-only">
              {t('common:actions', {
                defaultValue: 'Quick Actions',
              })}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" sideOffset={10}>
          <DropdownMenuLabel>
            {batchId
              ? t('common:actions', {
                  defaultValue: 'Batch Actions',
                })
              : t('common:quickActions', {
                  defaultValue: 'Quick Actions',
                })}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleAction('feed')}
            className="gap-2 p-3 cursor-pointer"
          >
            <Wheat className="h-4 w-4" />
            <span>{t('common:logFeed', { defaultValue: 'Log Feed' })}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleAction('water')}
            className="gap-2 p-3 cursor-pointer"
          >
            <Droplets className="h-4 w-4" />
            <span>
              {t('common:logWater', {
                defaultValue: 'Log Water',
              })}
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleAction('mortality')}
            className="gap-2 p-3 cursor-pointer"
          >
            <HeartPulse className="h-4 w-4 text-red-500" />
            <span>
              {t('common:logMortality', {
                defaultValue: 'Log Mortality',
              })}
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleAction('sale')}
            className="gap-2 p-3 cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{t('common:newSale', { defaultValue: 'New Sale' })}</span>
          </DropdownMenuItem>

          {!batchId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate({ to: '/batches' })}
                className="gap-2 p-3 cursor-pointer"
              >
                <ClipboardList className="h-4 w-4" />
                <span>
                  {t('batches:create', {
                    defaultValue: 'New Batch',
                  })}
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
