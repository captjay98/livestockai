import { useMemo } from 'react'

import type { ModuleKey } from '~/lib/modules/types'
import { useModules } from '~/components/module-context'
import { CORE_NAVIGATION, MODULE_NAVIGATION } from '~/lib/modules/constants'

export interface NavigationItem {
  name: string
  href: string
  icon: any
}

/**
 * Filter navigation items based on enabled modules
 * Exported for testing
 */
export function filterNavigationByModules<T extends { name: string }>(
  navigation: Array<T>,
  enabledModules: Array<ModuleKey>,
): Array<T> {
  const filtered = navigation.filter((item) => {
    // Core navigation items are always visible
    if (CORE_NAVIGATION.includes(item.name)) {
      return true
    }

    // Check if item belongs to any enabled module
    return enabledModules.some((moduleKey) => {
      const moduleNav = MODULE_NAVIGATION[moduleKey]
      return moduleNav.includes(item.name)
    })
  })

  // Remove duplicates while preserving order
  const seen = new Set<string>()
  return filtered.filter((item) => {
    if (seen.has(item.name)) return false
    seen.add(item.name)
    return true
  })
}

/**
 * Hook to get navigation items filtered by enabled modules
 */
export function useModuleNavigation<T extends { name: string }>(
  navigation: Array<T>,
): Array<T> {
  const { enabledModules } = useModules()

  return useMemo(() => {
    return filterNavigationByModules(navigation, enabledModules)
  }, [navigation, enabledModules])
}
