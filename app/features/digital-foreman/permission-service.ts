import type { ModulePermission } from '~/lib/db/types'

export const PERMISSION_TEMPLATES = {
    feed_handler: ['feed:log', 'batch:view', 'task:complete'] as const,
    health_monitor: [
        'mortality:log',
        'vaccination:log',
        'water_quality:log',
        'batch:view',
        'task:complete',
    ] as const,
    full_access: [
        'feed:log',
        'mortality:log',
        'weight:log',
        'vaccination:log',
        'water_quality:log',
        'egg:log',
        'sales:view',
        'task:complete',
        'batch:view',
    ] as const,
} satisfies Record<string, ReadonlyArray<ModulePermission>>

export function hasPermission(
    workerPermissions: Array<ModulePermission>,
    requiredPermission: ModulePermission,
): boolean {
    return workerPermissions.includes(requiredPermission)
}

export function getPermissionsFromTemplate(
    templateName: keyof typeof PERMISSION_TEMPLATES,
): Array<ModulePermission> {
    return [...PERMISSION_TEMPLATES[templateName]]
}

export function validatePermissions(permissions: Array<string>): boolean {
    const validPermissions: Array<ModulePermission> = [
        'feed:log',
        'mortality:log',
        'weight:log',
        'vaccination:log',
        'water_quality:log',
        'egg:log',
        'sales:view',
        'task:complete',
        'batch:view',
    ]

    return permissions.every((p) =>
        validPermissions.includes(p as ModulePermission),
    )
}
