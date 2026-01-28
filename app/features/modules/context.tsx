import { createContext, useContext, useEffect, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import type { ModuleContextState, ModuleKey } from '~/features/modules/types'
import {
    canDisableModuleFn,
    getFarmModulesFn,
    toggleModuleFn,
} from '~/features/modules/server'

const ModuleContext = createContext<ModuleContextState | null>(null)

interface ModuleProviderProps {
    children: ReactNode
    farmId: string | null
}

export function ModuleProvider({ children, farmId }: ModuleProviderProps) {
    const [enabledModules, setEnabledModules] = useState<Array<ModuleKey>>([])
    const queryClient = useQueryClient()

    // Query to fetch farm modules
    const { data: modules, isLoading } = useQuery({
        queryKey: ['farm-modules', farmId],
        queryFn: async () => {
            if (!farmId) return []
            return getFarmModulesFn({ data: { farmId } })
        },
        enabled: !!farmId,
    })

    // Update enabled modules when data changes
    useEffect(() => {
        if (modules) {
            const enabled = modules
                .filter((m) => m.enabled)
                .map((m) => m.moduleKey)
            setEnabledModules(enabled)
        } else {
            setEnabledModules([])
        }
    }, [modules])

    // Mutation to toggle a module
    const toggleMutation = useMutation({
        mutationFn: async ({
            moduleKey,
            enabled,
        }: {
            moduleKey: ModuleKey
            enabled: boolean
        }) => {
            if (!farmId) throw new Error('No farm selected')
            return toggleModuleFn({ data: { farmId, moduleKey, enabled } })
        },
        onSuccess: () => {
            // Invalidate and refetch modules
            queryClient.invalidateQueries({
                queryKey: ['farm-modules', farmId],
            })
        },
    })

    const toggleModule = async (moduleKey: ModuleKey) => {
        const currentlyEnabled = enabledModules.includes(moduleKey)
        const newEnabled = !currentlyEnabled

        // If disabling, check if it's allowed
        if (!newEnabled && farmId) {
            const canDisable = await canDisableModuleFn({
                data: { farmId, moduleKey },
            })
            if (!canDisable) {
                throw new Error(
                    'Cannot disable module with active batches. Please complete or sell all batches first.',
                )
            }
        }

        await toggleMutation.mutateAsync({ moduleKey, enabled: newEnabled })
    }

    const canDisableModule = async (moduleKey: ModuleKey): Promise<boolean> => {
        if (!farmId) return false
        return canDisableModuleFn({ data: { farmId, moduleKey } })
    }

    const refreshModules = async () => {
        if (farmId) {
            await queryClient.invalidateQueries({
                queryKey: ['farm-modules', farmId],
            })
        }
    }

    const value: ModuleContextState = {
        enabledModules,
        isLoading,
        toggleModule,
        canDisableModule,
        refreshModules,
    }

    return (
        <ModuleContext.Provider value={value}>
            {children}
        </ModuleContext.Provider>
    )
}

export function useModules(): ModuleContextState {
    const context = useContext(ModuleContext)
    if (!context) {
        throw new Error('useModules must be used within a ModuleProvider')
    }
    return context
}
