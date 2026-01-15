import { useState } from 'react'
import { AlertCircle, Check, Loader2 } from 'lucide-react'

import type { ModuleKey } from '~/features/modules/types'
import { useModules } from '~/features/modules/context'
import { MODULE_METADATA } from '~/features/modules/constants'
import { Alert, AlertDescription } from '~/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

export function ModuleSelector() {
  const { enabledModules, toggleModule, canDisableModule, isLoading } =
    useModules()
  const [pendingToggle, setPendingToggle] = useState<ModuleKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const handleToggle = async (moduleKey: ModuleKey) => {
    const isEnabled = enabledModules.includes(moduleKey)
    setError(null)

    if (isEnabled) {
      // Check if can disable
      setIsChecking(true)
      try {
        const canDisable = await canDisableModule(moduleKey)
        setIsChecking(false)
        if (!canDisable) {
          setError(
            `Cannot disable ${MODULE_METADATA[moduleKey].name}: active batches exist.`,
          )
          return
        }
        setPendingToggle(moduleKey)
      } catch {
        setIsChecking(false)
        setError('Failed to check module status')
      }
    } else {
      // Enable directly
      try {
        await toggleModule(moduleKey)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to enable module')
      }
    }
  }

  const handleConfirmDisable = async () => {
    if (pendingToggle) {
      try {
        await toggleModule(pendingToggle)
        setPendingToggle(null)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to disable module',
        )
      }
    }
  }

  const allModuleKeys: Array<ModuleKey> = [
    'poultry',
    'aquaculture',
    'cattle',
    'goats',
    'sheep',
    'bees',
  ]

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allModuleKeys.map((moduleKey) => {
          const module = MODULE_METADATA[moduleKey]
          const isEnabled = enabledModules.includes(moduleKey)

          return (
            <Card
              key={moduleKey}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isEnabled
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:border-muted-foreground/50',
              )}
              onClick={() =>
                !isLoading && !isChecking && handleToggle(moduleKey)
              }
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{module.icon}</span>
                    <CardTitle className="text-sm">{module.name}</CardTitle>
                  </div>
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                      isEnabled
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30',
                    )}
                  >
                    {isEnabled && <Check className="h-3 w-3" />}
                    {isChecking && <Loader2 className="h-3 w-3 animate-spin" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {module.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog
        open={!!pendingToggle}
        onOpenChange={() => setPendingToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Module?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggle && (
                <>
                  Disable{' '}
                  <span className="font-semibold">
                    {MODULE_METADATA[pendingToggle].name}
                  </span>
                  ? Related features will be hidden. You can re-enable anytime.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDisable}>
              Disable
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
