import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { UserSettings } from '~/features/settings/currency-presets'
import {
  buildSettingsSummary,
  convertArea,
  convertTemperature,
  convertWeight,
  formatCurrencyValue,
  mergeDashboardCardSettings,
  mergeNotificationSettings,
  parseSettingValue,
  shouldTriggerLowStockAlert,
  shouldTriggerMortalityAlert,
  validateCurrencyChange,
  validatePartialSettings,
  validateSettingData,
} from '~/features/settings/service'
import { DEFAULT_SETTINGS } from '~/features/settings/currency-presets'

describe('Settings Service', () => {
  describe('validateSettingData', () => {
    it('should accept valid currency decimals', () => {
      expect(validateSettingData('currencyDecimals', 0)).toBeNull()
      expect(validateSettingData('currencyDecimals', 2)).toBeNull()
      expect(validateSettingData('currencyDecimals', 4)).toBeNull()
    })

    it('should reject invalid currency decimals', () => {
      expect(validateSettingData('currencyDecimals', -1)).toBe(
        'Currency decimals must be between 0 and 4',
      )
      expect(validateSettingData('currencyDecimals', 5)).toBe(
        'Currency decimals must be between 0 and 4',
      )
      expect(validateSettingData('currencyDecimals', 'invalid' as any)).toBe(
        'Currency decimals must be between 0 and 4',
      )
    })

    it('should accept valid currency symbol position', () => {
      expect(validateSettingData('currencySymbolPosition', 'before')).toBeNull()
      expect(validateSettingData('currencySymbolPosition', 'after')).toBeNull()
    })

    it('should reject invalid currency symbol position', () => {
      expect(validateSettingData('currencySymbolPosition', 'invalid')).toBe(
        'Currency symbol position must be "before" or "after"',
      )
    })

    it('should accept valid date formats', () => {
      expect(validateSettingData('dateFormat', 'MM/DD/YYYY')).toBeNull()
      expect(validateSettingData('dateFormat', 'DD/MM/YYYY')).toBeNull()
      expect(validateSettingData('dateFormat', 'YYYY-MM-DD')).toBeNull()
    })

    it('should reject invalid date formats', () => {
      expect(validateSettingData('dateFormat', 'invalid')).toBe(
        'Invalid date format',
      )
    })

    it('should accept valid time formats', () => {
      expect(validateSettingData('timeFormat', '12h')).toBeNull()
      expect(validateSettingData('timeFormat', '24h')).toBeNull()
    })

    it('should reject invalid time formats', () => {
      expect(validateSettingData('timeFormat', 'invalid')).toBe(
        'Time format must be "12h" or "24h"',
      )
    })

    it('should accept valid first day of week', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 6 }), (day) => {
          expect(validateSettingData('firstDayOfWeek', day)).toBeNull()
        }),
        { numRuns: 10 },
      )
    })

    it('should reject invalid first day of week', () => {
      expect(validateSettingData('firstDayOfWeek', -1)).toBe(
        'First day of week must be between 0 and 6',
      )
      expect(validateSettingData('firstDayOfWeek', 7)).toBe(
        'First day of week must be between 0 and 6',
      )
    })

    it('should accept valid weight units', () => {
      expect(validateSettingData('weightUnit', 'kg')).toBeNull()
      expect(validateSettingData('weightUnit', 'lbs')).toBeNull()
    })

    it('should reject invalid weight units', () => {
      expect(validateSettingData('weightUnit', 'invalid')).toBe(
        'Weight unit must be "kg" or "lbs"',
      )
    })

    it('should accept valid alert thresholds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1 }),
          (lowStock, mortality, quantity) => {
            expect(
              validateSettingData('lowStockThresholdPercent', lowStock),
            ).toBeNull()
            expect(
              validateSettingData('mortalityAlertPercent', mortality),
            ).toBeNull()
            expect(
              validateSettingData('mortalityAlertQuantity', quantity),
            ).toBeNull()
          },
        ),
        { numRuns: 10 },
      )
    })

    it('should reject invalid alert thresholds', () => {
      expect(validateSettingData('lowStockThresholdPercent', 0)).not.toBeNull()
      expect(
        validateSettingData('lowStockThresholdPercent', 101),
      ).not.toBeNull()
      expect(validateSettingData('mortalityAlertPercent', 0)).not.toBeNull()
      expect(validateSettingData('mortalityAlertQuantity', 0)).not.toBeNull()
    })

    it('should accept valid fiscal year settings', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 12 }), (month) => {
          expect(validateSettingData('fiscalYearStartMonth', month)).toBeNull()
        }),
        { numRuns: 12 },
      )
    })

    it('should reject invalid fiscal year month', () => {
      expect(validateSettingData('fiscalYearStartMonth', 0)).not.toBeNull()
      expect(validateSettingData('fiscalYearStartMonth', 13)).not.toBeNull()
    })
  })

  describe('formatCurrencyValue', () => {
    it('should format USD correctly', () => {
      expect(formatCurrencyValue(1234.56, 'USD')).toBe('$1,234.56')
      expect(formatCurrencyValue(0, 'USD')).toBe('$0.00')
      expect(formatCurrencyValue(-100, 'USD')).toBe('$-100.00')
    })

    it('should format EUR correctly', () => {
      expect(formatCurrencyValue(1234.56, 'EUR')).toBe('€1.234,56')
    })

    it('should format NGN correctly', () => {
      expect(formatCurrencyValue(5000, 'NGN')).toBe('₦5,000.00')
    })

    it('should fallback to USD for unknown currency', () => {
      expect(formatCurrencyValue(100, 'UNKNOWN')).toBe('$100.00')
    })
  })

  describe('parseSettingValue', () => {
    it('should parse numeric values correctly', () => {
      expect(parseSettingValue('currencyDecimals', '2')).toBe(2)
      expect(parseSettingValue('currencyDecimals', 2)).toBe(2)
    })

    it('should parse boolean values in nested objects', () => {
      expect(parseSettingValue('notifications.lowStock', 'true')).toBe(true)
      expect(parseSettingValue('notifications.lowStock', true)).toBe(true)
      // Note: Boolean('false') is true in JavaScript - any non-empty string is truthy
      expect(parseSettingValue('notifications.lowStock', 'false')).toBe(true)
      expect(parseSettingValue('notifications.lowStock', '')).toBe(false)
    })

    it('should return string values for non-numeric keys', () => {
      expect(parseSettingValue('currencyCode', 'USD')).toBe('USD')
    })
  })

  describe('validateCurrencyChange', () => {
    it('should allow valid currency change', () => {
      expect(validateCurrencyChange('USD', 'EUR')).toBeNull()
      expect(validateCurrencyChange('USD', 'USD')).toBeNull()
    })

    it('should reject invalid currency code', () => {
      expect(validateCurrencyChange('USD', 'INVALID')).toBe(
        'Currency code "INVALID" is not supported',
      )
    })
  })

  describe('buildSettingsSummary', () => {
    it('should build summary from settings', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        currencyCode: 'EUR',
        currencySymbol: '€',
        language: 'en',
        theme: 'dark',
      }

      const summary = buildSettingsSummary(settings)

      expect(summary.currency.code).toBe('EUR')
      expect(summary.currency.symbol).toBe('€')
      expect(summary.region.language).toBe('en')
    })
  })

  describe('mergeNotificationSettings', () => {
    it('should merge with defaults when no existing settings', () => {
      const result = mergeNotificationSettings(
        DEFAULT_SETTINGS.notifications,
        null,
        { lowStock: false },
      )

      expect(result.lowStock).toBe(false)
      expect(result.highMortality).toBe(true) // From defaults
    })

    it('should preserve existing settings when not in updates', () => {
      const existing = {
        ...DEFAULT_SETTINGS.notifications,
        lowStock: false,
      }

      const result = mergeNotificationSettings(
        DEFAULT_SETTINGS.notifications,
        existing,
        { highMortality: false },
      )

      expect(result.lowStock).toBe(false)
      expect(result.highMortality).toBe(false)
      expect(result.invoiceDue).toBe(true) // From defaults
    })
  })

  describe('mergeDashboardCardSettings', () => {
    it('should merge with defaults when no existing settings', () => {
      const result = mergeDashboardCardSettings(
        DEFAULT_SETTINGS.dashboardCards,
        null,
        { inventory: false },
      )

      expect(result.inventory).toBe(false)
      expect(result.revenue).toBe(true) // From defaults
    })

    it('should preserve existing settings when not in updates', () => {
      const existing = {
        ...DEFAULT_SETTINGS.dashboardCards,
        inventory: false,
      }

      const result = mergeDashboardCardSettings(
        DEFAULT_SETTINGS.dashboardCards,
        existing,
        { revenue: false },
      )

      expect(result.inventory).toBe(false)
      expect(result.revenue).toBe(false)
      expect(result.expenses).toBe(true) // From defaults
    })
  })

  describe('shouldTriggerLowStockAlert', () => {
    it('should return true when stock is below threshold', () => {
      expect(shouldTriggerLowStockAlert(5, 100, 10)).toBe(true) // 5% remaining, 10% threshold
    })

    it('should return false when stock is above threshold', () => {
      expect(shouldTriggerLowStockAlert(20, 100, 10)).toBe(false) // 20% remaining, 10% threshold
    })

    it('should return false for zero initial quantity', () => {
      expect(shouldTriggerLowStockAlert(0, 0, 10)).toBe(false)
    })

    it('should return true when exactly at threshold', () => {
      expect(shouldTriggerLowStockAlert(10, 100, 10)).toBe(true) // Exactly at threshold
    })
  })

  describe('shouldTriggerMortalityAlert', () => {
    it('should return true when mortality exceeds thresholds', () => {
      expect(shouldTriggerMortalityAlert(80, 100, 10, 5)).toBe(true) // 20% mortality, both thresholds exceeded
    })

    it('should return false when percent threshold not met', () => {
      expect(shouldTriggerMortalityAlert(95, 100, 10, 5)).toBe(false) // 5% mortality, percent not met
    })

    it('should return true when both thresholds are exceeded', () => {
      // 11% mortality, 11 deaths - both conditions met (percent >= threshold AND deaths >= quantity)
      expect(shouldTriggerMortalityAlert(89, 100, 10, 5)).toBe(true)
    })

    it('should return false for zero initial quantity', () => {
      expect(shouldTriggerMortalityAlert(0, 0, 10, 5)).toBe(false)
    })

    it('should return true when both thresholds exactly met', () => {
      expect(shouldTriggerMortalityAlert(90, 100, 10, 10)).toBe(true) // 10% mortality, 10 deaths
    })
  })

  describe('validatePartialSettings', () => {
    it('should return empty array for valid partial settings', () => {
      const result = validatePartialSettings({
        currencyCode: 'USD',
        theme: 'dark',
      })
      expect(result).toEqual([])
    })

    it('should return errors for invalid settings', () => {
      const result = validatePartialSettings({
        currencyDecimals: -1,
        theme: 'dark', // Valid theme
      })
      expect(result.length).toBeGreaterThan(0)
    })

    it('should skip nested objects in validation', () => {
      const result = validatePartialSettings({
        notifications: {} as any,
        dashboardCards: {} as any,
      })
      expect(result).toEqual([])
    })
  })

  describe('convertWeight', () => {
    it('should convert kg to lbs', () => {
      expect(convertWeight(10, 'kg', 'lbs')).toBeCloseTo(22.0462, 4)
    })

    it('should convert lbs to kg', () => {
      expect(convertWeight(22.0462, 'lbs', 'kg')).toBeCloseTo(10, 4)
    })

    it('should return same value when units match', () => {
      expect(convertWeight(100, 'kg', 'kg')).toBe(100)
      expect(convertWeight(100, 'lbs', 'lbs')).toBe(100)
    })
  })

  describe('convertArea', () => {
    it('should convert sqm to sqft', () => {
      expect(convertArea(10, 'sqm', 'sqft')).toBeCloseTo(107.639, 3)
    })

    it('should convert sqft to sqm', () => {
      expect(convertArea(107.639, 'sqft', 'sqm')).toBeCloseTo(10, 3)
    })

    it('should return same value when units match', () => {
      expect(convertArea(100, 'sqm', 'sqm')).toBe(100)
      expect(convertArea(100, 'sqft', 'sqft')).toBe(100)
    })
  })

  describe('convertTemperature', () => {
    it('should convert celsius to fahrenheit', () => {
      expect(convertTemperature(0, 'celsius', 'fahrenheit')).toBe(32)
      expect(convertTemperature(100, 'celsius', 'fahrenheit')).toBe(212)
    })

    it('should convert fahrenheit to celsius', () => {
      expect(convertTemperature(32, 'fahrenheit', 'celsius')).toBe(0)
      expect(convertTemperature(212, 'fahrenheit', 'celsius')).toBeCloseTo(
        100,
        5,
      )
    })

    it('should return same value when units match', () => {
      expect(convertTemperature(20, 'celsius', 'celsius')).toBe(20)
      expect(convertTemperature(68, 'fahrenheit', 'fahrenheit')).toBe(68)
    })
  })
})
