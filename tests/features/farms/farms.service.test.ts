import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { CreateFarmData } from '~/features/farms/server'
import {
  canChangeUserRole,
  canDeleteFarm,
  canRemoveUserFromFarm,
  isLastOwner,
  shouldReturnAllFarmsForAdmin,
  validateFarmData,
  validateFarmRole,
  validateUpdateData,
} from '~/features/farms/service'

describe('Farm Service', () => {
  describe('canDeleteFarm', () => {
    it('should return false when farm has batches', () => {
      const result = canDeleteFarm({
        hasBatches: true,
        hasSales: false,
        hasExpenses: false,
      })
      expect(result).toBe(false)
    })

    it('should return false when farm has sales', () => {
      const result = canDeleteFarm({
        hasBatches: false,
        hasSales: true,
        hasExpenses: false,
      })
      expect(result).toBe(false)
    })

    it('should return false when farm has expenses', () => {
      const result = canDeleteFarm({
        hasBatches: false,
        hasSales: false,
        hasExpenses: true,
      })
      expect(result).toBe(false)
    })

    it('should return true when farm has no dependents', () => {
      const result = canDeleteFarm({
        hasBatches: false,
        hasSales: false,
        hasExpenses: false,
      })
      expect(result).toBe(true)
    })

    it('should return false when farm has multiple dependents', () => {
      const result = canDeleteFarm({
        hasBatches: true,
        hasSales: true,
        hasExpenses: true,
      })
      expect(result).toBe(false)
    })

    it('should handle all boolean combinations correctly', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (hasBatches, hasSales, hasExpenses) => {
            const result = canDeleteFarm({
              hasBatches,
              hasSales,
              hasExpenses,
            })
            const expected = !hasBatches && !hasSales && !hasExpenses
            return result === expected
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('isLastOwner', () => {
    it('should return true when other owners count is 0', () => {
      expect(isLastOwner(0)).toBe(true)
    })

    it('should return false when there are other owners', () => {
      expect(isLastOwner(1)).toBe(false)
      expect(isLastOwner(2)).toBe(false)
      expect(isLastOwner(5)).toBe(false)
      expect(isLastOwner(10)).toBe(false)
    })

    it('should always return false for positive counts', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (count) => {
          expect(isLastOwner(count)).toBe(false)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('shouldReturnAllFarmsForAdmin', () => {
    it('should return true for admin role', () => {
      expect(shouldReturnAllFarmsForAdmin('admin')).toBe(true)
    })

    it('should return false for non-admin roles', () => {
      expect(shouldReturnAllFarmsForAdmin('user')).toBe(false)
      expect(shouldReturnAllFarmsForAdmin('manager')).toBe(false)
      expect(shouldReturnAllFarmsForAdmin('viewer')).toBe(false)
      expect(shouldReturnAllFarmsForAdmin('')).toBe(false)
    })
  })

  describe('validateFarmData', () => {
    const validData: CreateFarmData = {
      name: 'Green Acres Farm',
      location: 'Nigeria',
      type: 'poultry',
    }

    const validTypes = [
      'poultry',
      'aquaculture',
      'mixed',
      'cattle',
      'goats',
      'sheep',
      'bees',
      'multi',
    ] as const

    it('should accept valid farm data', () => {
      expect(validateFarmData(validData)).toBeNull()
    })

    it('should accept all valid farm types', () => {
      validTypes.forEach((type) => {
        const result = validateFarmData({ ...validData, type })
        expect(result).toBeNull()
      })
    })

    it('should reject empty name', () => {
      expect(validateFarmData({ ...validData, name: '' })).toBe(
        'Farm name is required',
      )
    })

    it('should reject whitespace-only name', () => {
      expect(validateFarmData({ ...validData, name: '   ' })).toBe(
        'Farm name is required',
      )
      expect(validateFarmData({ ...validData, name: '\t\n' })).toBe(
        'Farm name is required',
      )
    })

    it('should reject empty location', () => {
      expect(validateFarmData({ ...validData, location: '' })).toBe(
        'Farm location is required',
      )
    })

    it('should reject whitespace-only location', () => {
      expect(validateFarmData({ ...validData, location: '   ' })).toBe(
        'Farm location is required',
      )
    })

    it('should reject invalid farm type', () => {
      expect(validateFarmData({ ...validData, type: 'invalid' as any })).toBe(
        'Farm type is required and must be valid',
      )
    })

    it('should reject missing name', () => {
      expect(
        validateFarmData({ location: 'Nigeria', type: 'poultry' } as any),
      ).toBe('Farm name is required')
    })

    it('should reject missing location', () => {
      expect(validateFarmData({ name: 'Farm', type: 'poultry' } as any)).toBe(
        'Farm location is required',
      )
    })

    it('should reject missing type', () => {
      expect(
        validateFarmData({ name: 'Farm', location: 'Nigeria' } as any),
      ).toBe('Farm type is required and must be valid')
    })
  })

  describe('validateUpdateData', () => {
    it('should accept empty update data', () => {
      expect(validateUpdateData({})).toBeNull()
    })

    it('should accept valid name update', () => {
      expect(validateUpdateData({ name: 'New Name' })).toBeNull()
    })

    it('should accept valid location update', () => {
      expect(validateUpdateData({ location: 'New Location' })).toBeNull()
    })

    it('should accept valid type update', () => {
      expect(validateUpdateData({ type: 'aquaculture' })).toBeNull()
    })

    it('should accept all valid farm types for update', () => {
      const validTypes = [
        'poultry',
        'aquaculture',
        'mixed',
        'cattle',
        'goats',
        'sheep',
        'bees',
        'multi',
      ] as const

      validTypes.forEach((type) => {
        expect(validateUpdateData({ type })).toBeNull()
      })
    })

    it('should accept multiple valid field updates', () => {
      expect(
        validateUpdateData({
          name: 'New Name',
          location: 'New Location',
          type: 'cattle',
        }),
      ).toBeNull()
    })

    it('should reject empty name', () => {
      expect(validateUpdateData({ name: '' })).toBe('Farm name cannot be empty')
    })

    it('should reject whitespace-only name', () => {
      expect(validateUpdateData({ name: '   ' })).toBe(
        'Farm name cannot be empty',
      )
    })

    it('should reject empty location', () => {
      expect(validateUpdateData({ location: '' })).toBe(
        'Farm location cannot be empty',
      )
    })

    it('should reject whitespace-only location', () => {
      expect(validateUpdateData({ location: '\t\n' })).toBe(
        'Farm location cannot be empty',
      )
    })

    it('should reject invalid farm type', () => {
      expect(validateUpdateData({ type: 'invalid' as any })).toBe(
        'Farm type must be valid',
      )
    })
  })

  describe('canRemoveUserFromFarm', () => {
    it('should allow removal of non-owners', () => {
      const result = canRemoveUserFromFarm(false, 0)
      expect(result.canRemove).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should allow removal of owner when there are other owners', () => {
      const result = canRemoveUserFromFarm(true, 1)
      expect(result.canRemove).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should prevent removal of last owner', () => {
      const result = canRemoveUserFromFarm(true, 0)
      expect(result.canRemove).toBe(false)
      expect(result.error).toBe('Cannot remove the last owner of a farm')
    })

    it('should allow removal of owner when there are multiple other owners', () => {
      const result = canRemoveUserFromFarm(true, 5)
      expect(result.canRemove).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should handle edge cases correctly', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.integer({ min: 0, max: 100 }),
          (isOwner, otherOwnersCount) => {
            const result = canRemoveUserFromFarm(isOwner, otherOwnersCount)
            const expectedCanRemove = !(isOwner && otherOwnersCount === 0)
            return result.canRemove === expectedCanRemove
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('canChangeUserRole', () => {
    it('should allow promotion to owner', () => {
      const result = canChangeUserRole('manager', 'owner', 0)
      expect(result.canChange).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should allow demotion from manager to viewer', () => {
      const result = canChangeUserRole('manager', 'viewer', 0)
      expect(result.canChange).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should allow role change for non-owners', () => {
      const result = canChangeUserRole('manager', 'viewer', 0)
      expect(result.canChange).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should prevent demotion of last owner', () => {
      const result = canChangeUserRole('owner', 'manager', 0)
      expect(result.canChange).toBe(false)
      expect(result.error).toBe('Cannot demote the last owner of a farm')
    })

    it('should allow owner demotion when there are other owners', () => {
      const result = canChangeUserRole('owner', 'manager', 1)
      expect(result.canChange).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should allow owner to remain owner', () => {
      const result = canChangeUserRole('owner', 'owner', 0)
      expect(result.canChange).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should handle all role combinations correctly', () => {
      const roles = ['owner', 'manager', 'viewer'] as const

      roles.forEach((currentRole) => {
        roles.forEach((newRole) => {
          fc.assert(
            fc.property(fc.integer({ min: 0, max: 10 }), (otherOwnersCount) => {
              const result = canChangeUserRole(
                currentRole,
                newRole,
                otherOwnersCount,
              )
              const isOwnerDemotion =
                currentRole === 'owner' && newRole !== 'owner'
              const expectedCanChange = !isOwnerDemotion || otherOwnersCount > 0
              return result.canChange === expectedCanChange
            }),
            { numRuns: 10 },
          )
        })
      })
    })
  })

  describe('validateFarmRole', () => {
    it('should accept valid farm roles', () => {
      expect(validateFarmRole('owner')).toBeNull()
      expect(validateFarmRole('manager')).toBeNull()
      expect(validateFarmRole('viewer')).toBeNull()
    })

    it('should reject invalid roles', () => {
      expect(validateFarmRole('admin')).not.toBeNull()
      expect(validateFarmRole('user')).not.toBeNull()
      expect(validateFarmRole('')).not.toBeNull()
      expect(validateFarmRole('invalid')).not.toBeNull()
      expect(validateFarmRole('Owner')).not.toBeNull() // Case sensitive
      expect(validateFarmRole('Manager')).not.toBeNull()
    })

    it('should return correct error message', () => {
      expect(validateFarmRole('admin')).toBe(
        'Role must be owner, manager, or viewer',
      )
      expect(validateFarmRole('')).toBe(
        'Role must be owner, manager, or viewer',
      )
    })
  })

  describe('Property-based tests for complex scenarios', () => {
    it('should maintain deletion constraint invariant', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (hasBatches, hasSales, hasExpenses) => {
            const canDelete = canDeleteFarm({
              hasBatches,
              hasSales,
              hasExpenses,
            })
            // If any dependent exists, cannot delete
            if (hasBatches || hasSales || hasExpenses) {
              expect(canDelete).toBe(false)
            } else {
              expect(canDelete).toBe(true)
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should maintain last owner protection invariant', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.integer({ min: 0, max: 50 }),
          (isOwner, otherOwnersCount) => {
            const removalResult = canRemoveUserFromFarm(
              isOwner,
              otherOwnersCount,
            )
            // Last owner cannot be removed
            if (isOwner && otherOwnersCount === 0) {
              expect(removalResult.canRemove).toBe(false)
            } else {
              expect(removalResult.canRemove).toBe(true)
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should validate farm names reject empty strings', () => {
      fc.assert(
        fc.property(fc.string(), (name) => {
          const result = validateFarmData({
            name,
            location: 'Valid Location',
            type: 'poultry',
          })
          // Empty or whitespace-only names should be rejected
          const isEmptyOrWhitespace = !name || !name.trim()
          if (isEmptyOrWhitespace) {
            expect(result).not.toBeNull()
          }
        }),
        { numRuns: 100 },
      )
    })

    it('should validate farm locations reject empty strings', () => {
      fc.assert(
        fc.property(fc.string(), (location) => {
          const result = validateFarmData({
            name: 'Valid Farm Name',
            location,
            type: 'poultry',
          })
          // Empty or whitespace-only locations should be rejected
          const isEmptyOrWhitespace = !location || !location.trim()
          if (isEmptyOrWhitespace) {
            expect(result).not.toBeNull()
          }
        }),
        { numRuns: 100 },
      )
    })
  })
})
