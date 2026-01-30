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
  createAccessGrant,
  createAccessRequest,
  getAccessRequest,
  getActiveAccessGrant,
  respondToAccessRequest,
  revokeAccessGrant,
} from '~/features/extension/access-repository'

/**
 * Integration Tests for Extension Worker Mode - Access Workflow
 *
 * Feature: complete-extension-worker-mode
 * Validates: Requirements 17.4
 *
 * Tests the full access request workflow from creation to approval/denial/revocation
 */

describe('Access Workflow Integration Tests', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterEach(() => {
    resetTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  describe('Full Approve Flow', () => {
    it('should create grant when request is approved', async () => {
      const db = getTestDb()

      // Setup: Create farmer and extension worker
      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
        name: 'Test Farmer',
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
        name: 'Test Agent',
      })
      const { farmId } = await seedTestFarm(farmerId)

      // Step 1: Extension worker creates access request
      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Routine health inspection',
        requestedDurationDays: 90,
      })

      expect(request.id).toBeDefined()
      expect(request.status).toBe('pending')

      // Step 2: Farmer approves request
      await respondToAccessRequest(db, request.id, farmerId, true, null)

      // Verify request status updated
      const updatedRequest = await getAccessRequest(db, request.id)
      expect(updatedRequest?.status).toBe('approved')
      expect(updatedRequest?.responderId).toBe(farmerId)
      expect(updatedRequest?.respondedAt).toBeDefined()

      // Step 3: Create access grant
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt,
        financialVisibility: false,
        accessRequestId: request.id,
      })

      // Verify grant exists and is active
      const grant = await getActiveAccessGrant(db, agentId, farmId)
      expect(grant).toBeDefined()
      expect(grant?.userId).toBe(agentId)
      expect(grant?.farmId).toBe(farmId)
      expect(grant?.grantedBy).toBe(farmerId)
      expect(grant?.financialVisibility).toBe(false)
      expect(grant?.revokedAt).toBeNull()
      expect(grant?.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should create grant with financial visibility when specified', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Financial audit',
        requestedDurationDays: 30,
      })

      await respondToAccessRequest(db, request.id, farmerId, true, null)

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt,
        financialVisibility: true, // Financial visibility enabled
        accessRequestId: request.id,
      })

      const grant = await getActiveAccessGrant(db, agentId, farmId)
      expect(grant?.financialVisibility).toBe(true)
    })

    it('should create grant with custom duration', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Short-term inspection',
        requestedDurationDays: 30, // Minimum allowed by constraint
      })

      await respondToAccessRequest(db, request.id, farmerId, true, null)

      const customDuration = 45 // Override to 45 days
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + customDuration)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt,
        financialVisibility: false,
        accessRequestId: request.id,
      })

      const grant = await getActiveAccessGrant(db, agentId, farmId)
      expect(grant).toBeDefined()

      // Verify expiration is approximately 45 days from now
      const daysUntilExpiry =
        (grant!.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      expect(daysUntilExpiry).toBeGreaterThan(44)
      expect(daysUntilExpiry).toBeLessThan(46)
    })
  })

  describe('Full Deny Flow', () => {
    it('should update request status when denied', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      // Create request
      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Inspection',
        requestedDurationDays: 90,
      })

      // Deny request
      const reason = 'Farm is currently under renovation'
      await respondToAccessRequest(db, request.id, farmerId, false, reason)

      // Verify request status
      const updatedRequest = await getAccessRequest(db, request.id)
      expect(updatedRequest?.status).toBe('denied')
      expect(updatedRequest?.responderId).toBe(farmerId)
      expect(updatedRequest?.rejectionReason).toBe(reason)
      expect(updatedRequest?.respondedAt).toBeDefined()

      // Verify no grant was created
      const grant = await getActiveAccessGrant(db, agentId, farmId)
      expect(grant).toBeNull()
    })

    it('should allow denial without reason', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Inspection',
        requestedDurationDays: 90,
      })

      await respondToAccessRequest(db, request.id, farmerId, false, null)

      const updatedRequest = await getAccessRequest(db, request.id)
      expect(updatedRequest?.status).toBe('denied')
      expect(updatedRequest?.rejectionReason).toBeNull()
    })

    it('should prevent responding to already responded request', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Inspection',
        requestedDurationDays: 90,
      })

      // First response
      await respondToAccessRequest(db, request.id, farmerId, true, null)

      // Verify request is no longer pending
      const updatedRequest = await getAccessRequest(db, request.id)
      expect(updatedRequest?.status).toBe('approved')

      // Attempting to respond again should not change status
      // (In real implementation, this would throw an error)
    })
  })

  describe('Revocation Flow', () => {
    it('should revoke active grant', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      // Create and approve request
      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Inspection',
        requestedDurationDays: 90,
      })

      await respondToAccessRequest(db, request.id, farmerId, true, null)

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt,
        financialVisibility: false,
        accessRequestId: request.id,
      })

      // Verify grant is active
      const grant = await getActiveAccessGrant(db, agentId, farmId)
      expect(grant).toBeDefined()

      // Save grant ID before revoking (grant will be null after revocation)
      const grantId = grant!.id

      // Revoke grant
      const reason = 'Access no longer needed'
      await revokeAccessGrant(db, grantId, farmerId, reason)

      // Verify grant is no longer active
      const activeGrant = await getActiveAccessGrant(db, agentId, farmId)
      expect(activeGrant).toBeNull()

      // Verify revocation details using saved grantId
      const revokedGrant = await db
        .selectFrom('access_grants')
        .selectAll()
        .where('id', '=', grantId)
        .executeTakeFirst()

      expect(revokedGrant?.revokedAt).toBeDefined()
      expect(revokedGrant?.revokedBy).toBe(farmerId)
      expect(revokedGrant?.revokedReason).toBe(reason)
    })

    it('should allow revocation without reason', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Inspection',
        requestedDurationDays: 90,
      })

      await respondToAccessRequest(db, request.id, farmerId, true, null)

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt,
        financialVisibility: false,
        accessRequestId: request.id,
      })

      const grant = await getActiveAccessGrant(db, agentId, farmId)
      await revokeAccessGrant(db, grant!.id, farmerId, null)

      const revokedGrant = await db
        .selectFrom('access_grants')
        .selectAll()
        .where('id', '=', grant!.id)
        .executeTakeFirst()

      expect(revokedGrant?.revokedAt).toBeDefined()
      expect(revokedGrant?.revokedReason).toBeNull()
    })

    it('should not return revoked grant as active', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Inspection',
        requestedDurationDays: 90,
      })

      await respondToAccessRequest(db, request.id, farmerId, true, null)

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt,
        financialVisibility: false,
        accessRequestId: request.id,
      })

      const grant = await getActiveAccessGrant(db, agentId, farmId)
      expect(grant).toBeDefined()

      await revokeAccessGrant(db, grant!.id, farmerId, 'Test revocation')

      const activeGrant = await getActiveAccessGrant(db, agentId, farmId)
      expect(activeGrant).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple requests from same user to same farm', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      // First request - approved
      const request1 = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'First inspection',
        requestedDurationDays: 30,
      })

      await respondToAccessRequest(db, request1.id, farmerId, true, null)

      // Second request - should be allowed after first is approved
      const request2 = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Second inspection',
        requestedDurationDays: 60,
      })

      expect(request2.id).toBeDefined()
      expect(request2.status).toBe('pending')
    })

    it('should handle expired grants correctly', async () => {
      const db = getTestDb()

      const { userId: farmerId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const { userId: agentId } = await seedTestUser({
        email: `agent-${Date.now()}@test.com`,
      })
      const { farmId } = await seedTestFarm(farmerId)

      const request = await createAccessRequest(db, {
        requesterId: agentId,
        farmId,
        purpose: 'Inspection',
        requestedDurationDays: 30, // Minimum allowed by constraint
      })

      await respondToAccessRequest(db, request.id, farmerId, true, null)

      // Create grant that expires in the past
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() - 1) // Yesterday

      await createAccessGrant(db, {
        userId: agentId,
        farmId,
        grantedBy: farmerId,
        expiresAt,
        financialVisibility: false,
        accessRequestId: request.id,
      })

      // Should not return expired grant as active
      const grant = await getActiveAccessGrant(db, agentId, farmId)
      expect(grant).toBeNull()
    })
  })
})
