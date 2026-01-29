/**
 * Property-based tests for permission service functions.
 * Uses fast-check to verify permission checking invariants.
 *
 * **Validates: Requirements 3.3, 3.4**
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { ModulePermission } from '~/lib/db/types'
import {
  PERMISSION_TEMPLATES,
  getPermissionsFromTemplate,
  hasPermission,
  validatePermissions,
} from '~/features/digital-foreman/permission-service'

// All valid permissions
const ALL_PERMISSIONS: Array<ModulePermission> = [
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

// Arbitraries
const validPermission = fc.constantFrom<ModulePermission>(...ALL_PERMISSIONS)
const permissionArray = fc.array(validPermission, {
  minLength: 0,
  maxLength: ALL_PERMISSIONS.length,
})
const invalidPermission = fc
  .string()
  .filter((s) => !ALL_PERMISSIONS.includes(s as ModulePermission))

describe('Permission Service - Property Tests', () => {
  describe('hasPermission', () => {
    /**
     * Property 19: Worker Permission Check
     * - Returns true if permission is in array
     * - Returns false if permission is not in array
     */
    it('should return true when permission exists in array', () => {
      fc.assert(
        fc.property(
          permissionArray,
          validPermission,
          (permissions, required) => {
            const uniquePermissions = [...new Set([...permissions, required])]
            expect(hasPermission(uniquePermissions, required)).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should return false when permission does not exist in array', () => {
      fc.assert(
        fc.property(validPermission, (required) => {
          const otherPermissions = ALL_PERMISSIONS.filter((p) => p !== required)
          expect(hasPermission(otherPermissions, required)).toBe(false)
        }),
        { numRuns: 20 },
      )
    })

    it('should return false for empty permissions array', () => {
      fc.assert(
        fc.property(validPermission, (required) => {
          expect(hasPermission([], required)).toBe(false)
        }),
        { numRuns: 20 },
      )
    })

    it('should be idempotent - multiple checks return same result', () => {
      fc.assert(
        fc.property(
          permissionArray,
          validPermission,
          (permissions, required) => {
            const result1 = hasPermission(permissions, required)
            const result2 = hasPermission(permissions, required)
            expect(result1).toBe(result2)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should handle duplicate permissions in array', () => {
      fc.assert(
        fc.property(
          validPermission,
          fc.integer({ min: 2, max: 5 }),
          (permission, count) => {
            const duplicates = Array(count).fill(permission)
            expect(hasPermission(duplicates, permission)).toBe(true)
          },
        ),
        { numRuns: 20 },
      )
    })
  })

  describe('getPermissionsFromTemplate', () => {
    it('should return array for all template names', () => {
      const templateNames = Object.keys(PERMISSION_TEMPLATES) as Array<
        keyof typeof PERMISSION_TEMPLATES
      >
      for (const name of templateNames) {
        const permissions = getPermissionsFromTemplate(name)
        expect(Array.isArray(permissions)).toBe(true)
        expect(permissions.length).toBeGreaterThan(0)
      }
    })

    it('should return only valid permissions', () => {
      const templateNames = Object.keys(PERMISSION_TEMPLATES) as Array<
        keyof typeof PERMISSION_TEMPLATES
      >
      for (const name of templateNames) {
        const permissions = getPermissionsFromTemplate(name)
        for (const perm of permissions) {
          expect(ALL_PERMISSIONS).toContain(perm)
        }
      }
    })

    it('should return a new array each time (not reference)', () => {
      const templateNames = Object.keys(PERMISSION_TEMPLATES) as Array<
        keyof typeof PERMISSION_TEMPLATES
      >
      for (const name of templateNames) {
        const permissions1 = getPermissionsFromTemplate(name)
        const permissions2 = getPermissionsFromTemplate(name)
        expect(permissions1).not.toBe(permissions2)
        expect(permissions1).toEqual(permissions2)
      }
    })

    it('full_access template should include all common permissions', () => {
      const fullAccess = getPermissionsFromTemplate('full_access')
      expect(fullAccess).toContain('feed:log')
      expect(fullAccess).toContain('mortality:log')
      expect(fullAccess).toContain('task:complete')
      expect(fullAccess).toContain('batch:view')
    })
  })

  describe('validatePermissions', () => {
    it('should return true for valid permission arrays', () => {
      fc.assert(
        fc.property(permissionArray, (permissions) => {
          expect(validatePermissions(permissions)).toBe(true)
        }),
        { numRuns: 50 },
      )
    })

    it('should return true for empty array', () => {
      expect(validatePermissions([])).toBe(true)
    })

    it('should return false when array contains invalid permission', () => {
      fc.assert(
        fc.property(
          permissionArray,
          invalidPermission,
          (validPerms, invalidPerm) => {
            fc.pre(invalidPerm.length > 0) // Ensure non-empty invalid string
            const mixed = [...validPerms, invalidPerm]
            expect(validatePermissions(mixed)).toBe(false)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should return false for completely invalid arrays', () => {
      const invalidArrays = [
        ['invalid'],
        ['read', 'write'],
        ['admin'],
        ['feed:write'], // close but not valid
      ]
      for (const arr of invalidArrays) {
        expect(validatePermissions(arr)).toBe(false)
      }
    })
  })

  describe('Permission Template Coverage', () => {
    it('feed_handler should have feed and task permissions', () => {
      const perms = getPermissionsFromTemplate('feed_handler')
      expect(hasPermission(perms, 'feed:log')).toBe(true)
      expect(hasPermission(perms, 'task:complete')).toBe(true)
      expect(hasPermission(perms, 'batch:view')).toBe(true)
    })

    it('health_monitor should have health-related permissions', () => {
      const perms = getPermissionsFromTemplate('health_monitor')
      expect(hasPermission(perms, 'mortality:log')).toBe(true)
      expect(hasPermission(perms, 'vaccination:log')).toBe(true)
      expect(hasPermission(perms, 'water_quality:log')).toBe(true)
    })

    it('full_access should be superset of other templates', () => {
      const fullAccess = getPermissionsFromTemplate('full_access')
      const feedHandler = getPermissionsFromTemplate('feed_handler')
      const healthMonitor = getPermissionsFromTemplate('health_monitor')

      for (const perm of feedHandler) {
        expect(hasPermission(fullAccess, perm)).toBe(true)
      }
      for (const perm of healthMonitor) {
        expect(hasPermission(fullAccess, perm)).toBe(true)
      }
    })
  })
})
