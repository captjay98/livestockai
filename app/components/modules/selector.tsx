import { useEffect, useState } from 'react'
import { AlertCircle, Check, ChevronDown, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import type { ModuleKey } from '~/features/modules/types'
import { useModules } from '~/features/modules/context'
import { MODULE_METADATA } from '~/features/modules/constants'
import { getSpeciesForModuleFn } from '~/features/breeds/server'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

export function ModuleSelector() {
  const { enabledModules, toggleModule, canDisableModule } = useModules()
  const [localEnabled, setLocalEnabled] = useState<Array<ModuleKey>>([])
  const [expandedModule, setExpandedModule] = useState<ModuleKey | null>(null)
  const [moduleSpecies, setModuleSpecies] = useState<
    Record<ModuleKey, Array<{ value: string; label: string }>>
  >({} as Record<ModuleKey, Array<{ value: string; label: string }>>)
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(false)

  // Unused state commented out for future use
  // const [pendingDisable, setPendingDisable] = useState<ModuleKey | null>(null)
  // const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Sync local state when enabledModules loads
  useEffect(() => {
    if (enabledModules.length > 0 && localEnabled.length === 0) {
      setLocalEnabled(enabledModules)
    }
  }, [enabledModules, localEnabled.length])

  // Fetch species when a module is expanded
  useEffect(() => {
    const fetchSpecies = async () => {
      if (!expandedModule || moduleSpecies[expandedModule]) return

      setIsLoadingSpecies(true)
      try {
        const result = await getSpeciesForModuleFn({
          data: { moduleKey: expandedModule },
        })
        setModuleSpecies((prev) => ({ ...prev, [expandedModule]: result }))
      } catch (err) {
        console.error('Failed to fetch species:', err)
      } finally {
        setIsLoadingSpecies(false)
      }
    }

    fetchSpecies()
  }, [expandedModule, moduleSpecies])

  const hasChanges =
    JSON.stringify([...localEnabled].sort()) !==
    JSON.stringify([...enabledModules].sort())

  const handleToggle = (moduleKey: ModuleKey) => {
    const isEnabled = localEnabled.includes(moduleKey)
    if (isEnabled) {
      setLocalEnabled(localEnabled.filter((k) => k !== moduleKey))
    } else {
      setLocalEnabled([...localEnabled, moduleKey])
    }
  }

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      // Check modules being disabled
      const toDisable = enabledModules.filter((k) => !localEnabled.includes(k))
      for (const moduleKey of toDisable) {
        const canDisable = await canDisableModule(moduleKey)
        if (!canDisable) {
          setError(
            `Cannot disable ${MODULE_METADATA[moduleKey].name}: active batches exist.`,
          )
          setIsSaving(false)
          return
        }
      }

      // Apply changes
      const toEnable = localEnabled.filter((k) => !enabledModules.includes(k))
      for (const moduleKey of [...toDisable, ...toEnable]) {
        await toggleModule(moduleKey)
      }

      toast.success('Modules updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update modules')
    } finally {
      setIsSaving(false)
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
          const isEnabled = localEnabled.includes(moduleKey)
          const isExpanded = expandedModule === moduleKey

          return (
            <Card
              key={moduleKey}
              className={cn(
                'transition-all',
                isEnabled
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-muted',
              )}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => handleToggle(moduleKey)}
                  >
                    <span className="text-2xl">{module.icon}</span>
                    <CardTitle className="text-sm">{module.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors cursor-pointer',
                        isEnabled
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30',
                      )}
                      onClick={() => handleToggle(moduleKey)}
                    >
                      {isEnabled && <Check className="h-3 w-3" />}
                    </div>
                    <button
                      onClick={() =>
                        setExpandedModule(isExpanded ? null : moduleKey)
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-180',
                        )}
                      />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  {module.description}
                </p>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <p className="text-xs font-medium">Species:</p>
                    <div className="flex flex-wrap gap-1">
                      {isLoadingSpecies && expandedModule === moduleKey ? (
                        <span className="text-xs text-muted-foreground animate-pulse">
                          Loading...
                        </span>
                      ) : moduleSpecies[moduleKey]?.length > 0 ? (
                        moduleSpecies[moduleKey].map((species) => (
                          <span
                            key={species.value}
                            className="text-xs px-2 py-0.5 bg-muted rounded"
                          >
                            {species.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No species configured
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}
