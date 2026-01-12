import { useState } from 'react'

import { AlertCircle, Check, Loader2 } from 'lucide-react'

import type { ModuleKey } from '~/lib/modules/types'
import { useModules } from '~/components/module-context'
import { MODULE_METADATA } from '~/lib/modules/constants'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'

export function ModuleSelector() {
  const { enabledModules, toggleModule, canDisableModule, isLoading } =
    useModules()
  const [pendingToggle, setPendingToggle] = useState<{
    moduleKey: ModuleKey
    enabled: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const handleToggleAttempt = async (
    moduleKey: ModuleKey,
    currentlyEnabled: boolean,
  ) => {
    setError(null)

    // If trying to disable, check if it's allowed
    if (currentlyEnabled) {
      setIsChecking(true)
      try {
        const canDisable = await canDisableModule(moduleKey)
        setIsChecking(false)

        if (!canDisable) {
          setError(
            `Cannot disable ${MODULE_METADATA[moduleKey].name} module: active batches exist. Please complete or archive all batches first.`,
          )
          return
        }

        // Show confirmation dialog
        setPendingToggle({ moduleKey, enabled: false })
      } catch (err) {
        setIsChecking(false)
        setError(
          err instanceof Error ? err.message : 'Failed to check module status',
        )
      }
    } else {
      // Enabling - no confirmation needed
      await performToggle(moduleKey, true)
    }
  }

  const performToggle = async (moduleKey: ModuleKey) => {
    try {
      await toggleModule(moduleKey)
      setPendingToggle(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle module')
    }
  }

  const handleConfirmDisable = async () => {
    if (pendingToggle) {
      await performToggle(pendingToggle.moduleKey)
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

      <div className="grid gap-4 md:grid-cols-2">
        {allModuleKeys.map((moduleKey) => {
          const module = MODULE_METADATA[moduleKey]
          const isEnabled = enabledModules.includes(moduleKey)

          return (
            <Card key={moduleKey} className={isEnabled ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{module.icon}</div>
                    <div>
                      <CardTitle className="text-base">{module.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isEnabled && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <Check className="h-3 w-3" />
                      Active
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`module-${moduleKey}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <div className="flex items-center gap-2">
                    {isChecking && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      id={`module-${moduleKey}`}
                      checked={isEnabled}
                      onCheckedChange={() =>
                        handleToggleAttempt(moduleKey, isEnabled)
                      }
                      disabled={isLoading || isChecking}
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Includes:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>
                      {module.livestockTypes.length === 1
                        ? module.livestockTypes[0]
                        : module.livestockTypes.join(', ')}{' '}
                      management
                    </li>
                    <li>{module.speciesOptions.length} species options</li>
                    <li>{module.feedTypes.length} feed types</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Confirmation Dialog */}
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
                  Are you sure you want to disable the{' '}
                  <span className="font-semibold">
                    {MODULE_METADATA[pendingToggle.moduleKey].name}
                  </span>{' '}
                  module? This will hide related navigation items and features
                  from your farm dashboard.
                  <br />
                  <br />
                  You can re-enable it at any time.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleConfirmDisable}>Disable Module</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
