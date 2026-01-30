/**
 * Integration tests for visit records workflow
 * Tests creation, edit window enforcement, and acknowledgment
 *
 * Feature: complete-extension-worker-mode
 * Validates: Requirements 17.6
 */
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  resetTestDb,
  seedTestFarm,
  seedTestUser,
  truncateAllTables,
} from '../../helpers/db-integration'
import {
  acknowledgeVisit,
  createVisitRecord,
  getVisitRecord,
  getVisitRecordsForFarm,
  updateVisitRecord,
} from '~/features/extension/visit-repository'
import { createAccessGrant } from '~/features/extension/access-repository'
import { isWithinEditWindow } from '~/features/extension/access-service'
import { EXTENSION_DEFAULTS } from '~/features/extension/constants'

describe('Visit Records Integration Tests', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterEach(() => {
    resetTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  describe('Visit Creation with Attachments', () => {
    it('should create visit record with attachments', async () => {
      const db = getTestDb()

      // Setup: Create farmer, agent, farm, and access grant
      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      // Grant access to agent
      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      // Create visit with attachments
      const attachments = [
        {
          name: 'photo1.jpg',
          url: 'https://storage.example.com/visit-records/photo1.jpg',
          type: 'image/jpeg',
          size: 1024000,
        },
        {
          name: 'report.pdf',
          url: 'https://storage.example.com/visit-records/report.pdf',
          type: 'application/pdf',
          size: 512000,
        },
      ]

      const visitId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'routine',
        findings: 'Observed mild respiratory symptoms in Batch A',
        recommendations: 'Increase ventilation, monitor for 48 hours',
        attachments,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      // Verify visit was created with attachments
      const visit = await getVisitRecord(db, visitId)
      expect(visit).toBeDefined()
      expect(visit?.attachments).toHaveLength(2)
      expect(visit?.attachments[0].name).toBe('photo1.jpg')
      expect(visit?.attachments[1].name).toBe('report.pdf')
      expect(visit?.findings).toBe(
        'Observed mild respiratory symptoms in Batch A',
      )
      expect(visit?.recommendations).toBe(
        'Increase ventilation, monitor for 48 hours',
      )
    })

    it('should create visit record without attachments', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      const visitId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'emergency',
        findings: 'High mortality observed',
        recommendations: 'Immediate veterinary consultation required',
      })

      const visit = await getVisitRecord(db, visitId)
      expect(visit).toBeDefined()
      expect(visit?.attachments).toEqual([])
      expect(visit?.visitType).toBe('emergency')
    })

    it('should retrieve all visits for a farm', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      // Create multiple visits
      await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        visitType: 'routine',
        findings: 'First visit findings',
        recommendations: 'First visit recommendations',
      })

      await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'follow_up',
        findings: 'Follow-up visit findings',
        recommendations: 'Follow-up recommendations',
      })

      const visits = await getVisitRecordsForFarm(db, farmId)
      expect(visits).toHaveLength(2)
      // Should be ordered by date descending (newest first)
      expect(visits[0].visitType).toBe('follow_up')
      expect(visits[1].visitType).toBe('routine')
    })
  })

  describe('Edit Window Enforcement', () => {
    it('should allow edits within 24-hour window', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      const visitId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'routine',
        findings: 'Original findings',
        recommendations: 'Original recommendations',
      })

      // Verify within edit window
      const visit = await getVisitRecord(db, visitId)
      expect(visit).toBeDefined()
      const withinWindow = isWithinEditWindow(
        visit!.createdAt,
        EXTENSION_DEFAULTS.VISIT_EDIT_WINDOW_HOURS,
      )
      expect(withinWindow).toBe(true)

      // Update visit
      await updateVisitRecord(db, visitId, {
        findings: 'Updated findings',
        recommendations: 'Updated recommendations',
      })

      const updatedVisit = await getVisitRecord(db, visitId)
      expect(updatedVisit?.findings).toBe('Updated findings')
      expect(updatedVisit?.recommendations).toBe('Updated recommendations')
    })

    it('should detect when visit is outside edit window', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      // Create visit with old timestamp (simulate 25 hours ago)
      const oldTimestamp = new Date(
        Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      )

      const visitId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: oldTimestamp,
        visitType: 'routine',
        findings: 'Old findings',
        recommendations: 'Old recommendations',
      })

      // Manually set createdAt to old timestamp (for testing)
      await db
        .updateTable('visit_records')
        .set({ createdAt: oldTimestamp })
        .where('id', '=', visitId)
        .execute()

      const visit = await getVisitRecord(db, visitId)
      expect(visit).toBeDefined()

      // Verify outside edit window
      const withinWindow = isWithinEditWindow(
        visit!.createdAt,
        EXTENSION_DEFAULTS.VISIT_EDIT_WINDOW_HOURS,
      )
      expect(withinWindow).toBe(false)
    })

    it('should allow updates to attachments within edit window', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      const visitId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'routine',
        findings: 'Findings',
        recommendations: 'Recommendations',
        attachments: [
          {
            name: 'photo1.jpg',
            url: 'https://storage.example.com/photo1.jpg',
            type: 'image/jpeg',
            size: 1024000,
          },
        ],
      })

      // Add more attachments
      await updateVisitRecord(db, visitId, {
        attachments: [
          {
            name: 'photo1.jpg',
            url: 'https://storage.example.com/photo1.jpg',
            type: 'image/jpeg',
            size: 1024000,
          },
          {
            name: 'photo2.jpg',
            url: 'https://storage.example.com/photo2.jpg',
            type: 'image/jpeg',
            size: 2048000,
          },
        ],
      })

      const updatedVisit = await getVisitRecord(db, visitId)
      expect(updatedVisit?.attachments).toHaveLength(2)
    })
  })

  describe('Acknowledgment Workflow', () => {
    it('should allow farmer to acknowledge visit', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      const visitId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'routine',
        findings: 'Findings',
        recommendations: 'Recommendations',
      })

      // Initially not acknowledged
      let visit = await getVisitRecord(db, visitId)
      expect(visit?.farmerAcknowledged).toBe(false)
      expect(visit?.farmerAcknowledgedAt).toBeNull()

      // Acknowledge visit
      await acknowledgeVisit(db, visitId)

      // Verify acknowledged
      visit = await getVisitRecord(db, visitId)
      expect(visit?.farmerAcknowledged).toBe(true)
      expect(visit?.farmerAcknowledgedAt).toBeDefined()
      expect(visit?.farmerAcknowledgedAt).toBeInstanceOf(Date)
    })

    it('should track unacknowledged visits separately', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      // Create 3 visits
      const visit1Id = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        visitType: 'routine',
        findings: 'Visit 1',
        recommendations: 'Recommendations 1',
      })

      const visit2Id = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        visitType: 'routine',
        findings: 'Visit 2',
        recommendations: 'Recommendations 2',
      })

      const visit3Id = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'routine',
        findings: 'Visit 3',
        recommendations: 'Recommendations 3',
      })

      // Acknowledge first two visits
      await acknowledgeVisit(db, visit1Id)
      await acknowledgeVisit(db, visit2Id)

      // Get all visits
      const visits = await getVisitRecordsForFarm(db, farmId)
      expect(visits).toHaveLength(3)

      // Count unacknowledged
      const unacknowledged = visits.filter((v) => !v.farmerAcknowledged)
      expect(unacknowledged).toHaveLength(1)
      expect(unacknowledged[0].id).toBe(visit3Id)
    })

    it('should not allow re-acknowledgment', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      const visitId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'routine',
        findings: 'Findings',
        recommendations: 'Recommendations',
      })

      // First acknowledgment
      await acknowledgeVisit(db, visitId)
      const visit1 = await getVisitRecord(db, visitId)
      const firstAckTime = visit1?.farmerAcknowledgedAt

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Try to acknowledge again
      await acknowledgeVisit(db, visitId)
      const visit2 = await getVisitRecord(db, visitId)
      const secondAckTime = visit2?.farmerAcknowledgedAt

      // Timestamp should not change (idempotent operation)
      expect(firstAckTime).toEqual(secondAckTime)
    })
  })

  describe('Visit Types and Follow-ups', () => {
    it('should support different visit types', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      // Create visits of each type
      const routineId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'routine',
        findings: 'Routine inspection',
        recommendations: 'Continue current practices',
      })

      const emergencyId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'emergency',
        findings: 'Disease outbreak suspected',
        recommendations: 'Immediate quarantine',
      })

      const followUpId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'follow_up',
        findings: 'Situation improved',
        recommendations: 'Continue monitoring',
      })

      const routine = await getVisitRecord(db, routineId)
      const emergency = await getVisitRecord(db, emergencyId)
      const followUp = await getVisitRecord(db, followUpId)

      expect(routine?.visitType).toBe('routine')
      expect(emergency?.visitType).toBe('emergency')
      expect(followUp?.visitType).toBe('follow_up')
    })

    it('should track follow-up dates', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        financialVisibility: false,
      })

      const followUpDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

      const visitId = await createVisitRecord(db, {
        agentId,
        farmId,
        visitDate: new Date(),
        visitType: 'routine',
        findings: 'Minor issues observed',
        recommendations: 'Follow up in 2 weeks',
        followUpDate,
      })

      const visit = await getVisitRecord(db, visitId)
      expect(visit?.followUpDate).toBeDefined()

      // Compare dates only (database stores date without time)
      const storedDate = new Date(visit!.followUpDate!)
      expect(storedDate.getFullYear()).toBe(followUpDate.getFullYear())
      expect(storedDate.getMonth()).toBe(followUpDate.getMonth())
      expect(storedDate.getDate()).toBe(followUpDate.getDate())
    })
  })
})
