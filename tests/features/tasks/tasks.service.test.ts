import { describe, expect, it } from 'vitest'
import type { TaskWithCompletionRow } from '~/features/tasks/repository'
import {
  calculateCompletionStatus,
  getPeriodStart,
  validateTaskData,
} from '~/features/tasks/service'

describe('Tasks Service', () => {
  describe('getPeriodStart', () => {
    it('daily frequency should return same day at 00:00:00', () => {
      const date = new Date(2026, 0, 22, 15, 30)
      const result = getPeriodStart(date, 'daily')
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(22)
      expect(result.getHours()).toBe(0)
    })

    it('weekly frequency should return Monday of that week', () => {
      // 2026-01-22 is a Thursday
      const thursday = new Date(2026, 0, 22, 15, 0)
      const result = getPeriodStart(thursday, 'weekly')
      expect(result.getDay()).toBe(1) // Monday
      expect(result.getDate()).toBe(19) // Monday was Jan 19th
    })

    it('monthly frequency should return 1st of the month', () => {
      const date = new Date(2026, 0, 22, 15, 30)
      const result = getPeriodStart(date, 'monthly')
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(1)
      expect(result.getHours()).toBe(0)
    })
  })

  describe('validateTaskData', () => {
    it('should accept valid data', () => {
      const result = validateTaskData({
        title: 'Check Water',
        frequency: 'daily',
      })
      expect(result).toBeNull()
    })

    it('should reject short title', () => {
      const result = validateTaskData({
        title: 'No',
        frequency: 'daily',
      })
      expect(result).toBe('Title must be at least 3 characters long')
    })

    it('should reject invalid frequency', () => {
      const result = validateTaskData({
        title: 'Valid Title',
        frequency: 'hourly' as any,
      })
      expect(result).toBe('Invalid frequency')
    })
  })

  describe('calculateCompletionStatus', () => {
    it('should correctly mark completed tasks for the period', () => {
      const now = new Date()
      const periodStart = getPeriodStart(now, 'daily')

      const mockRows: Array<TaskWithCompletionRow> = [
        {
          id: 'task-1',
          farmId: 'farm-1',
          title: 'Daily Task',
          description: null,
          frequency: 'daily',
          isDefault: true,
          createdAt: new Date(),
          completionId: 'comp-1',
          periodStart,
        },
      ]

      const result = calculateCompletionStatus(mockRows, now)

      expect(result[0].completed).toBe(true)
      expect(result[0].completionId).toBe('comp-1')
    })

    it('should mark task as incomplete if completion is from different period', () => {
      const now = new Date()
      const periodStart = getPeriodStart(now, 'daily')
      const yesterdayPeriodStart = new Date(periodStart)
      yesterdayPeriodStart.setDate(yesterdayPeriodStart.getDate() - 1)

      const mockRows: Array<TaskWithCompletionRow> = [
        {
          id: 'task-1',
          farmId: 'farm-1',
          title: 'Daily Task',
          description: null,
          frequency: 'daily',
          isDefault: true,
          createdAt: new Date(),
          completionId: 'comp-old',
          periodStart: yesterdayPeriodStart,
        },
      ]

      const result = calculateCompletionStatus(mockRows, now)

      expect(result[0].completed).toBe(false)
      expect(result[0].completionId).toBeNull()
    })
  })
})
