import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'

import type { ModuleKey } from '~/features/modules/types'
import { useModules } from '~/features/modules/context'
import {
    CORE_NAVIGATION,
    MODULE_NAVIGATION,
} from '~/features/modules/constants'

/**
 * Navigation menu item structure
 */
export interface NavigationItem {
    /** Display name of the navigation item */
    name: string
    /** Route path */
    href: string
    /** Lucide icon component */
    icon: LucideIcon
}

/**
 * Filter navigation items based on enabled modules.
 * This function compares the navigation item names against the list of enabled modules
 * and the core navigation items to determine visibility.
 *
 * @param navigation - Array of navigation items to filter
 * @param enabledModules - Array of enabled module keys
 * @returns Filtered navigation items for enabled modules
 *
 * @example
 * ```typescript
 * const filtered = filterNavigationByModules(
 *   [{ name: 'Poultry', ... }, { name: 'Settings', ... }],
 *   ['poultry']
 * )
 * // Returns items for 'Poultry' and 'Settings' (core)
 * ```
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
 * React hook that filters a navigation array based on the user's enabled modules.
 * This ensures that menu items for inactive modules (e.g., eggs, management) are hidden.
 *
 * It consumes the `ModulesContext` to retrieve the currently active modules for the user's farm
 * and cross-references them with the `MODULE_NAVIGATION` definition.
 *
 * Core navigation items (Dashboard, Settings, Finance) defined in `CORE_NAVIGATION` are always visible.
 *
 * @param navigation - Array of navigation items to filter. Each item must have a `name` property.
 * @returns Memoized array of navigation items accessible to the user, with duplicates removed.
 *
 * @example
 * ```tsx
 * // In a layout component or sidebar
 * import { useModuleNavigation } from '~/hooks/useModuleNavigation'
 * import { BASE_NAV_ITEMS } from '~/config/navigation'
 *
 * function Sidebar() {
 *   const filteredItems = useModuleNavigation(BASE_NAV_ITEMS)
 *
 *   return (
 *     <nav>
 *       {filteredItems.map(item => (
 *         <NavLink key={item.name} to={item.href}>{item.name}</NavLink>
 *       ))}
 *     </nav>
 *   )
 * }
 * ```
 */
export function useModuleNavigation<T extends { name: string }>(
    navigation: Array<T>,
): Array<T> {
    const { enabledModules } = useModules()

    return useMemo(() => {
        return filterNavigationByModules(navigation, enabledModules)
    }, [navigation, enabledModules])
}
