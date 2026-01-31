import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  checkInventoryAlerts,
  checkMortalityAlerts,
  checkVaccinationAlerts,
  checkWaterQualityAlerts,
} from '~/features/monitoring/service'

// Test fixtures
const baseBatch = {
  id: 'batch-1',
  farmId: 'farm-1',
  species: 'Broiler',
  livestockType: 'poultry' as const,
  initialQuantity: 1000,
  currentQuantity: 950,
  acquisitionDate: new Date('2024-01-01'),
}

const baseThresholds = {
  mortalityAlertPercent: 2,
  mortalityAlertQuantity: 10,
}

describe('checkMortalityAlerts', () => {
  it('should return empty array when no mortality', () => {
    const alerts = checkMortalityAlerts(
      baseBatch,
      { runTotal: 0, total: 0 },
      0,
      baseThresholds,
    )
    expect(alerts).toHaveLength(0)
  })

  it('should alert on sudden death exceeding percentage threshold', () => {
    const alerts = checkMortalityAlerts(
      baseBatch,
      { runTotal: 30, total: 30 }, // 3.15% of 950
      30,
      baseThresholds,
    )
    expect(alerts.some((a) => a.message.includes('Sudden Death'))).toBe(true)
  })

  it('should alert on sudden death exceeding quantity threshold', () => {
    const alerts = checkMortalityAlerts(
      baseBatch,
      { runTotal: 15, total: 15 }, // exceeds 10 threshold
      15,
      baseThresholds,
    )
    expect(alerts.some((a) => a.message.includes('Sudden Death'))).toBe(true)
  })

  it('should alert on high cumulative mortality (>5%)', () => {
    const alerts = checkMortalityAlerts(
      baseBatch,
      { runTotal: 0, total: 0 },
      60, // 6% of 1000 initial
      baseThresholds,
    )
    expect(alerts.some((a) => a.message.includes('Cumulative'))).toBe(true)
  })

  it('should return critical alert for >10% cumulative mortality', () => {
    const alerts = checkMortalityAlerts(
      baseBatch,
      { runTotal: 0, total: 0 },
      150, // 15% of 1000 initial
      baseThresholds,
    )
    const cumulativeAlert = alerts.find((a) => a.message.includes('Cumulative'))
    expect(cumulativeAlert?.type).toBe('critical')
  })

  it('property: alerts always have required fields', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100 }),
        fc.nat({ max: 500 }),
        (recentDeaths, totalDeaths) => {
          const alerts = checkMortalityAlerts(
            baseBatch,
            { runTotal: recentDeaths, total: recentDeaths },
            totalDeaths,
            baseThresholds,
          )
          return alerts.every(
            (a) =>
              a.id !== '' &&
              a.batchId !== '' &&
              a.species !== '' &&
              (a.type as string) !== '' &&
              (a.source as string) !== '' &&
              a.message !== '',
          )
        },
      ),
    )
  })
})

describe('checkWaterQualityAlerts', () => {
  it('should return empty array when no water quality data', () => {
    const alerts = checkWaterQualityAlerts(baseBatch, null)
    expect(alerts).toHaveLength(0)
  })

  it('should alert on low pH (<6.0)', () => {
    const alerts = checkWaterQualityAlerts(baseBatch, {
      ph: '5.5',
      ammoniaMgL: '0.1',
      temperatureC: null,
      dissolvedOxygenMgL: null,
      date: new Date(),
    })
    expect(alerts.some((a) => a.message.includes('pH'))).toBe(true)
  })

  it('should alert on high pH (>8.5)', () => {
    const alerts = checkWaterQualityAlerts(baseBatch, {
      ph: '9.0',
      ammoniaMgL: '0.1',
      temperatureC: null,
      dissolvedOxygenMgL: null,
      date: new Date(),
    })
    expect(alerts.some((a) => a.message.includes('pH'))).toBe(true)
  })

  it('should alert on dangerous ammonia (>2.0 mg/L)', () => {
    const alerts = checkWaterQualityAlerts(baseBatch, {
      ph: '7.0',
      ammoniaMgL: '2.5',
      temperatureC: null,
      dissolvedOxygenMgL: null,
      date: new Date(),
    })
    expect(alerts.some((a) => a.message.includes('Ammonia'))).toBe(true)
    expect(alerts.find((a) => a.message.includes('Ammonia'))?.type).toBe(
      'critical',
    )
  })

  it('should not alert on normal water quality', () => {
    const alerts = checkWaterQualityAlerts(baseBatch, {
      ph: '7.2',
      ammoniaMgL: '0.5',
      temperatureC: null,
      dissolvedOxygenMgL: null,
      date: new Date(),
    })
    expect(alerts).toHaveLength(0)
  })
})

describe('checkVaccinationAlerts', () => {
  it('should return empty array when no vaccinations', () => {
    const alerts = checkVaccinationAlerts(baseBatch, [])
    expect(alerts).toHaveLength(0)
  })

  it('should alert on overdue vaccination', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)

    const alerts = checkVaccinationAlerts(baseBatch, [
      { id: 'v1', vaccineName: 'Newcastle', nextDueDate: pastDate },
    ])
    expect(alerts.some((a) => a.message.includes('Overdue'))).toBe(true)
    expect(alerts.find((a) => a.message.includes('Overdue'))?.type).toBe(
      'critical',
    )
  })

  it('should alert on upcoming vaccination (within 7 days)', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 3)

    const alerts = checkVaccinationAlerts(baseBatch, [
      { id: 'v2', vaccineName: 'Gumboro', nextDueDate: futureDate },
    ])
    expect(alerts.some((a) => a.message.includes('Upcoming'))).toBe(true)
  })

  it('should not alert on vaccination due in >7 days', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 14)

    const alerts = checkVaccinationAlerts(baseBatch, [
      { id: 'v3', vaccineName: 'Fowl Pox', nextDueDate: futureDate },
    ])
    expect(alerts).toHaveLength(0)
  })
})

describe('checkInventoryAlerts', () => {
  it('should alert on low stock (<10% remaining)', () => {
    const lowStockBatch = { ...baseBatch, currentQuantity: 80 } // 8% of 1000
    const alerts = checkInventoryAlerts(lowStockBatch)
    expect(alerts.some((a) => a.message.includes('Low Stock'))).toBe(true)
  })

  it('should not alert on healthy stock levels', () => {
    const alerts = checkInventoryAlerts(baseBatch) // 95% remaining
    expect(alerts.filter((a) => a.source === 'inventory')).toHaveLength(0)
  })

  it('property: low stock alert only when <10%', () => {
    fc.assert(
      fc.property(fc.nat({ max: 1000 }), (currentQty) => {
        const batch = { ...baseBatch, currentQuantity: currentQty }
        const alerts = checkInventoryAlerts(batch)
        const hasLowStockAlert = alerts.some((a) =>
          a.message.includes('Low Stock'),
        )
        const isLowStock = currentQty / baseBatch.initialQuantity < 0.1
        return hasLowStockAlert === isLowStock || currentQty === 0
      }),
    )
  })
})
