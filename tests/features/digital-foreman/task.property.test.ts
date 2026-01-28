/**
 * Property-based tests for task service functions.
 * Uses fast-check to verify task assignment business logic.
 * 
 * **Validates: Requirements 9.1, 9.3, 9.4, 10.6, 11.2, 16.2, 16.3, 18.1**
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type {Assignment, AssignmentStatus} from '~/features/digital-foreman/task-service';
import {
  
  
  calculateTaskMetrics,
  determineCompletionStatus,
  isTaskOverdue,
  validatePhotoCount,
  validateTaskCompletion
} from '~/features/digital-foreman/task-service'

// Arbitraries
const uuid = fc.uuid()
const validStatus = fc.constantFrom<AssignmentStatus>('pending', 'in_progress', 'completed', 'pending_approval', 'verified', 'rejected')
const completableStatus = fc.constantFrom<AssignmentStatus>('pending', 'in_progress')
const validDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })

const assignmentArb = fc.record({
  id: uuid,
  workerId: uuid,
  status: validStatus,
  requiresPhoto: fc.boolean(),
  dueDate: fc.option(validDate, { nil: undefined }),
})

describe('Task Service - Property Tests', () => {
  describe('validateTaskCompletion', () => {
    /**
     * Property 13: Task Photo Requirement Enforcement
     * Property 14: Task Assignee Authorization
     */
    it('should reject when worker is not assignee', () => {
      fc.assert(
        fc.property(uuid, uuid, completableStatus, fc.boolean(), (assigneeId, attempterId, status, requiresPhoto) => {
          fc.pre(assigneeId !== attempterId) // Ensure different IDs
          
          const assignment: Assignment = {
            id: 'test-id',
            workerId: assigneeId,
            status,
            requiresPhoto,
          }
          
          const result = validateTaskCompletion(assignment, attempterId, true)
          expect(result.valid).toBe(false)
          expect(result.error).toContain('assignee')
        }),
        { numRuns: 50 }
      )
    })

    it('should accept when worker is assignee and requirements met', () => {
      fc.assert(
        fc.property(uuid, completableStatus, (workerId, status) => {
          const assignment: Assignment = {
            id: 'test-id',
            workerId,
            status,
            requiresPhoto: false,
          }
          
          const result = validateTaskCompletion(assignment, workerId, false)
          expect(result.valid).toBe(true)
        }),
        { numRuns: 50 }
      )
    })

    it('should reject when photo required but not provided', () => {
      fc.assert(
        fc.property(uuid, completableStatus, (workerId, status) => {
          const assignment: Assignment = {
            id: 'test-id',
            workerId,
            status,
            requiresPhoto: true,
          }
          
          const result = validateTaskCompletion(assignment, workerId, false)
          expect(result.valid).toBe(false)
          expect(result.error).toContain('Photo')
        }),
        { numRuns: 50 }
      )
    })

    it('should accept when photo required and provided', () => {
      fc.assert(
        fc.property(uuid, completableStatus, (workerId, status) => {
          const assignment: Assignment = {
            id: 'test-id',
            workerId,
            status,
            requiresPhoto: true,
          }
          
          const result = validateTaskCompletion(assignment, workerId, true)
          expect(result.valid).toBe(true)
        }),
        { numRuns: 50 }
      )
    })

    it('should reject non-completable statuses', () => {
      const nonCompletableStatus = fc.constantFrom<AssignmentStatus>('completed', 'pending_approval', 'verified', 'rejected')
      
      fc.assert(
        fc.property(uuid, nonCompletableStatus, (workerId, status) => {
          const assignment: Assignment = {
            id: 'test-id',
            workerId,
            status,
            requiresPhoto: false,
          }
          
          const result = validateTaskCompletion(assignment, workerId, false)
          expect(result.valid).toBe(false)
          expect(result.error).toContain('Status')
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('determineCompletionStatus', () => {
    /**
     * Property 12: Task Completion Status Transition
     */
    it('should return pending_approval when approval required', () => {
      expect(determineCompletionStatus(true)).toBe('pending_approval')
    })

    it('should return completed when approval not required', () => {
      expect(determineCompletionStatus(false)).toBe('completed')
    })

    it('should be deterministic', () => {
      fc.assert(
        fc.property(fc.boolean(), (requiresApproval) => {
          const result1 = determineCompletionStatus(requiresApproval)
          const result2 = determineCompletionStatus(requiresApproval)
          expect(result1).toBe(result2)
        }),
        { numRuns: 20 }
      )
    })
  })

  describe('isTaskOverdue', () => {
    /**
     * Property 16: Task Overdue Detection
     */
    it('should return false when no due date', () => {
      fc.assert(
        fc.property(uuid, validStatus, validDate, (workerId, status, currentTime) => {
          const assignment: Assignment = {
            id: 'test-id',
            workerId,
            status,
            requiresPhoto: false,
            dueDate: undefined,
          }
          
          expect(isTaskOverdue(assignment, currentTime)).toBe(false)
        }),
        { numRuns: 50 }
      )
    })

    it('should return true when current time is past due date', () => {
      fc.assert(
        fc.property(uuid, validStatus, validDate, fc.integer({ min: 1, max: 30 }), (workerId, status, dueDate, daysLater) => {
          const currentTime = new Date(dueDate)
          currentTime.setDate(currentTime.getDate() + daysLater)
          
          const assignment: Assignment = {
            id: 'test-id',
            workerId,
            status,
            requiresPhoto: false,
            dueDate,
          }
          
          expect(isTaskOverdue(assignment, currentTime)).toBe(true)
        }),
        { numRuns: 50 }
      )
    })

    it('should return false when current time is before due date', () => {
      fc.assert(
        fc.property(uuid, validStatus, validDate, fc.integer({ min: 1, max: 30 }), (workerId, status, dueDate, daysBefore) => {
          const currentTime = new Date(dueDate)
          currentTime.setDate(currentTime.getDate() - daysBefore)
          
          const assignment: Assignment = {
            id: 'test-id',
            workerId,
            status,
            requiresPhoto: false,
            dueDate,
          }
          
          expect(isTaskOverdue(assignment, currentTime)).toBe(false)
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('calculateTaskMetrics', () => {
    /**
     * Property 17: Task Completion Rate Calculation
     */
    it('should return zeros for empty array', () => {
      const metrics = calculateTaskMetrics([])
      expect(metrics.total).toBe(0)
      expect(metrics.completed).toBe(0)
      expect(metrics.pending).toBe(0)
      expect(metrics.overdue).toBe(0)
      expect(metrics.completionRate).toBe(0)
    })

    it('should count total correctly', () => {
      fc.assert(
        fc.property(fc.array(assignmentArb, { minLength: 1, maxLength: 50 }), (assignments) => {
          const metrics = calculateTaskMetrics(assignments)
          expect(metrics.total).toBe(assignments.length)
        }),
        { numRuns: 50 }
      )
    })

    it('should have completion rate between 0 and 100', () => {
      fc.assert(
        fc.property(fc.array(assignmentArb, { minLength: 1, maxLength: 50 }), (assignments) => {
          const metrics = calculateTaskMetrics(assignments)
          expect(metrics.completionRate).toBeGreaterThanOrEqual(0)
          expect(metrics.completionRate).toBeLessThanOrEqual(100)
        }),
        { numRuns: 50 }
      )
    })

    it('should satisfy: completed + pending + other = total', () => {
      fc.assert(
        fc.property(fc.array(assignmentArb, { minLength: 1, maxLength: 50 }), (assignments) => {
          const metrics = calculateTaskMetrics(assignments)
          const completedStatuses = ['completed', 'verified']
          const pendingStatuses = ['pending', 'in_progress']
          
          const actualCompleted = assignments.filter(a => completedStatuses.includes(a.status)).length
          const actualPending = assignments.filter(a => pendingStatuses.includes(a.status)).length
          
          expect(metrics.completed).toBe(actualCompleted)
          expect(metrics.pending).toBe(actualPending)
        }),
        { numRuns: 50 }
      )
    })

    it('should calculate completion rate as (completed / total) * 100', () => {
      const assignments: Array<Assignment> = [
        { id: '1', workerId: 'w1', status: 'completed', requiresPhoto: false },
        { id: '2', workerId: 'w1', status: 'verified', requiresPhoto: false },
        { id: '3', workerId: 'w1', status: 'pending', requiresPhoto: false },
        { id: '4', workerId: 'w1', status: 'rejected', requiresPhoto: false },
      ]
      
      const metrics = calculateTaskMetrics(assignments)
      expect(metrics.completionRate).toBe(50) // 2 completed out of 4
    })
  })

  describe('validatePhotoCount', () => {
    /**
     * Property 23: Photo Count Limit
     */
    it('should accept counts within limit', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 3 }), (count) => {
          const result = validatePhotoCount(count)
          expect(result.valid).toBe(true)
        }),
        { numRuns: 20 }
      )
    })

    it('should reject counts exceeding limit', () => {
      fc.assert(
        fc.property(fc.integer({ min: 4, max: 100 }), (count) => {
          const result = validatePhotoCount(count)
          expect(result.valid).toBe(false)
          expect(result.error).toContain('Maximum')
        }),
        { numRuns: 20 }
      )
    })

    it('should respect custom max limit', () => {
      expect(validatePhotoCount(5, 5).valid).toBe(true)
      expect(validatePhotoCount(6, 5).valid).toBe(false)
      expect(validatePhotoCount(10, 10).valid).toBe(true)
    })
  })
})
