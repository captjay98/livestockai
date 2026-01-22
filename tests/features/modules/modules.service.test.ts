import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { ModuleKey } from '~/features/modules/types'
import {
  ALL_MODULE_KEYS,
  validateCanDisable,
  validateFarmType,
  validateModuleKey,
  validateToggleInput,
} from '~/features/modules/service'

describe('Modules Service', () => {
  const validModuleKeys: Array<ModuleKey> = [
    'poultry',
    'aquaculture',
    'cattle',
    'goats',
    'sheep',
    'bees',
  ]

  const validFarmTypes = [
    'poultry',
    'fishery',
    'cattle',
    'goats',
    'sheep',
    'bees',
    'mixed',
    'multi',
  ]

  describe('validateModuleKey', () => {
    it('should accept all valid module keys', () => {
      for (const key of validModuleKeys) {
        const result = validateModuleKey(key)
        expect(result).toBeNull()
      }
    })

    it('should reject empty string', () => {
      const result = validateModuleKey('')
      expect(result).toBe('Module key is required')
    })

    it('should reject whitespace-only string', () => {
      const result = validateModuleKey('   ')
      expect(result).toBe('Module key is required')
    })

    it('should reject invalid module key', () => {
      const result = validateModuleKey('invalid_module')
      expect(result).toContain('Invalid module key')
      expect(result).toContain('poultry')
    })

    it('should reject similar but wrong module key', () => {
      const result = validateModuleKey('pultry')
      expect(result).toContain('Invalid module key')
    })

    it('should reject numbers in module key', () => {
      const result = validateModuleKey('poultry1')
      expect(result).toContain('Invalid module key')
    })

    it('should be case sensitive', () => {
      const result = validateModuleKey('POULTRY')
      expect(result).toContain('Invalid module key')
    })

    it('should reject underscores in wrong places', () => {
      const result = validateModuleKey('poul_try')
      expect(result).toContain('Invalid module key')
    })
  })

  describe('validateFarmType', () => {
    it('should accept all valid farm types', () => {
      for (const type of validFarmTypes) {
        const result = validateFarmType(type)
        expect(result).toBeNull()
      }
    })

    it('should accept farm types in uppercase', () => {
      for (const type of validFarmTypes) {
        const result = validateFarmType(type.toUpperCase())
        expect(result).toBeNull()
      }
    })

    it('should accept mixed case farm types', () => {
      const result = validateFarmType('Poultry')
      expect(result).toBeNull()
    })

    it('should reject empty string', () => {
      const result = validateFarmType('')
      expect(result).toBe('Farm type is required')
    })

    it('should reject whitespace-only string', () => {
      const result = validateFarmType('   ')
      expect(result).toBe('Farm type is required')
    })

    it('should reject invalid farm type', () => {
      const result = validateFarmType('invalid_type')
      expect(result).toContain('Invalid farm type')
    })

    it('should reject single character farm type', () => {
      const result = validateFarmType('x')
      expect(result).toContain('Invalid farm type')
    })
  })

  describe('validateToggleInput', () => {
    const validInput = {
      farmId: '123e4567-e89b-12d3-a456-426614174000',
      moduleKey: 'poultry' as ModuleKey,
      enabled: true,
    }

    it('should accept valid input with enabled true', () => {
      const result = validateToggleInput(validInput)
      expect(result).toBeNull()
    })

    it('should accept valid input with enabled false', () => {
      const result = validateToggleInput({ ...validInput, enabled: false })
      expect(result).toBeNull()
    })

    it('should reject empty farmId', () => {
      const result = validateToggleInput({ ...validInput, farmId: '' })
      expect(result).toBe('Farm ID is required')
    })

    it('should reject whitespace-only farmId', () => {
      const result = validateToggleInput({ ...validInput, farmId: '   ' })
      expect(result).toBe('Farm ID is required')
    })

    it('should reject invalid module key', () => {
      const result = validateToggleInput({ ...validInput, moduleKey: 'invalid' as any })
      expect(result).toContain('Invalid module key')
    })

    it('should reject non-boolean enabled value', () => {
      const result = validateToggleInput({ ...validInput, enabled: 'true' as any })
      expect(result).toBe('Enabled status must be a boolean')
    })

    it('should reject null enabled value', () => {
      const result = validateToggleInput({ ...validInput, enabled: null as any })
      expect(result).toBe('Enabled status must be a boolean')
    })

    it('should reject undefined enabled value', () => {
      const result = validateToggleInput({ ...validInput, enabled: undefined as any })
      expect(result).toBe('Enabled status must be a boolean')
    })

    it('should accept all valid module keys', () => {
      for (const key of validModuleKeys) {
        const result = validateToggleInput({
          ...validInput,
          moduleKey: key,
        })
        expect(result).toBeNull()
      }
    })
  })

  describe('validateCanDisable', () => {
    it('should return null when no active batches', () => {
      const result = validateCanDisable(false, 'poultry')
      expect(result).toBeNull()
    })

    it('should return error message when active batches exist', () => {
      const result = validateCanDisable(true, 'poultry')
      expect(result).toContain('Cannot disable')
      expect(result).toContain('poultry')
      expect(result).toContain('active batches')
    })

    it('should include correct module name in error', () => {
      for (const key of validModuleKeys) {
        const result = validateCanDisable(true, key)
        expect(result).toContain(`Cannot disable ${key}`)
      }
    })

    it('should return null for all modules when no active batches', () => {
      for (const key of validModuleKeys) {
        const result = validateCanDisable(false, key)
        expect(result).toBeNull()
      }
    })
  })

  describe('ALL_MODULE_KEYS', () => {
    it('should contain all valid module keys', () => {
      expect(ALL_MODULE_KEYS).toHaveLength(6)
      expect(ALL_MODULE_KEYS).toContain('poultry')
      expect(ALL_MODULE_KEYS).toContain('aquaculture')
      expect(ALL_MODULE_KEYS).toContain('cattle')
      expect(ALL_MODULE_KEYS).toContain('goats')
      expect(ALL_MODULE_KEYS).toContain('sheep')
      expect(ALL_MODULE_KEYS).toContain('bees')
    })
  })

  describe('Property Tests', () => {
    describe('validateModuleKey - property tests', () => {
      it('should accept all valid module keys', () => {
        fc.assert(
          fc.property(
            fc.oneof(...validModuleKeys.map(fc.constant)),
            (key) => {
              const result = validateModuleKey(key)
              expect(result).toBeNull()
            },
          ),
        )
      })

      it('should reject invalid strings', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }).filter((s) => !validModuleKeys.includes(s as ModuleKey)),
            (key) => {
              const result = validateModuleKey(key)
              expect(result).not.toBeNull()
            },
          ),
          { numRuns: 50 },
        )
      })
    })

    describe('validateFarmType - property tests', () => {
      it('should accept all valid farm types case-insensitive', () => {
        fc.assert(
          fc.property(
            fc.oneof(...validFarmTypes.map(fc.constant)),
            (type) => {
              const upperResult = validateFarmType(type.toUpperCase())
              expect(upperResult).toBeNull()

              const mixedResult = validateFarmType(type.charAt(0).toUpperCase() + type.slice(1))
              expect(mixedResult).toBeNull()
            },
          ),
        )
      })

      it('should reject random invalid strings', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }).filter((s) => !validFarmTypes.includes(s.toLowerCase())),
            (type) => {
              const result = validateFarmType(type)
              expect(result).not.toBeNull()
            },
          ),
          { numRuns: 50 },
        )
      })
    })

    describe('validateToggleInput - property tests', () => {
      it('should accept valid toggle inputs', () => {
        fc.assert(
          fc.property(
            fc.uuid(),
            fc.oneof(...validModuleKeys.map(fc.constant)),
            fc.boolean(),
            (farmId, moduleKey, enabled) => {
              const result = validateToggleInput({ farmId, moduleKey, enabled })
              expect(result).toBeNull()
            },
          ),
          { numRuns: 50 },
        )
      })
    })

    describe('validateCanDisable - property tests', () => {
      it('should return null when hasActiveBatches is false', () => {
        fc.assert(
          fc.property(
            fc.oneof(...validModuleKeys.map(fc.constant)),
            (moduleKey) => {
              const result = validateCanDisable(false, moduleKey)
              expect(result).toBeNull()
            },
          ),
        )
      })

      it('should return error when hasActiveBatches is true', () => {
        fc.assert(
          fc.property(
            fc.oneof(...validModuleKeys.map(fc.constant)),
            (moduleKey) => {
              const result = validateCanDisable(true, moduleKey)
              expect(result).not.toBeNull()
              expect(result).toContain(moduleKey)
            },
          ),
        )
      })
    })
  })
})
