/**
 * Database operations for inventory management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

// ============================================================================
// Feed Inventory Types
// ============================================================================

/**
 * Feed inventory record with farm information
 */
export interface FeedInventoryRecord {
  id: string
  farmId: string
  feedType: Database['feed_inventory']['feedType']
  quantityKg: string
  minThresholdKg: string
  updatedAt: Date
  farmName?: string
}

/**
 * Feed inventory with computed status
 */
export interface FeedInventoryWithStatus extends FeedInventoryRecord {
  status: 'normal' | 'low' | 'critical'
}

/**
 * Data for inserting a new feed inventory record
 */
export interface FeedInventoryInsert {
  farmId: string
  feedType: Database['feed_inventory']['feedType']
  quantityKg: string
  minThresholdKg: string
}

/**
 * Data for updating a feed inventory record
 */
export interface FeedInventoryUpdate {
  feedType?: Database['feed_inventory']['feedType']
  quantityKg?: string
  minThresholdKg?: string
}

// ============================================================================
// Medication Inventory Types
// ============================================================================

/**
 * Medication inventory record with farm information
 */
export interface MedicationInventoryRecord {
  id: string
  farmId: string
  medicationName: string
  quantity: number
  unit: Database['medication_inventory']['unit']
  expiryDate: Date | null
  minThreshold: number
  updatedAt: Date
  farmName?: string
}

/**
 * Medication inventory with computed status
 */
export interface MedicationInventoryWithStatus extends MedicationInventoryRecord {
  status: 'normal' | 'low' | 'critical'
  isExpiring?: boolean
  daysUntilExpiry?: number | null
}

/**
 * Data for inserting a new medication inventory record
 */
export interface MedicationInventoryInsert {
  farmId: string
  medicationName: string
  quantity: number
  unit: Database['medication_inventory']['unit']
  expiryDate?: Date | null
  minThreshold: number
}

/**
 * Data for updating a medication inventory record
 */
export interface MedicationInventoryUpdate {
  medicationName?: string
  quantity?: number
  unit?: Database['medication_inventory']['unit']
  expiryDate?: Date | null
  minThreshold?: number
}

// ============================================================================
// Feed Inventory Repository Functions
// ============================================================================

/**
 * Get feed inventory by ID
 *
 * @param db - Kysely database instance
 * @param id - Feed inventory ID
 * @returns Feed inventory record with farm info, or null if not found
 */
export async function getFeedInventoryById(
  db: Kysely<Database>,
  id: string,
): Promise<FeedInventoryRecord | null> {
  const record = await db
    .selectFrom('feed_inventory')
    .leftJoin('farms', 'farms.id', 'feed_inventory.farmId')
    .select([
      'feed_inventory.id',
      'feed_inventory.farmId',
      'feed_inventory.feedType',
      'feed_inventory.quantityKg',
      'feed_inventory.minThresholdKg',
      'feed_inventory.updatedAt',
      'farms.name as farmName',
    ])
    .where('feed_inventory.id', '=', id)
    .executeTakeFirst()

  return (record as FeedInventoryRecord | undefined) ?? null
}

/**
 * Get all feed inventory for a list of farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of feed inventory records with farm names
 */
export async function selectFeedInventory(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<FeedInventoryRecord>> {
  return await db
    .selectFrom('feed_inventory')
    .leftJoin('farms', 'farms.id', 'feed_inventory.farmId')
    .select([
      'feed_inventory.id',
      'feed_inventory.farmId',
      'feed_inventory.feedType',
      'feed_inventory.quantityKg',
      'feed_inventory.minThresholdKg',
      'feed_inventory.updatedAt',
      'farms.name as farmName',
    ])
    .where('feed_inventory.farmId', 'in', farmIds)
    .orderBy('feed_inventory.feedType', 'asc')
    .execute()
}

/**
 * Check if feed inventory exists for a specific farm and feed type
 *
 * @param db - Kysely database instance
 * @param farmId - Farm ID
 * @param feedType - Feed type
 * @returns Feed inventory record if found, null otherwise
 */
export async function getFeedInventoryByFarmAndType(
  db: Kysely<Database>,
  farmId: string,
  feedType: Database['feed_inventory']['feedType'],
): Promise<(FeedInventoryRecord & { id: string }) | null> {
  const record = await db
    .selectFrom('feed_inventory')
    .select(['id', 'quantityKg'])
    .where('farmId', '=', farmId)
    .where('feedType', '=', feedType)
    .executeTakeFirst()

  return (record as (FeedInventoryRecord & { id: string }) | undefined) ?? null
}

/**
 * Insert a new feed inventory record
 *
 * @param db - Kysely database instance
 * @param data - Feed inventory data to insert
 * @returns The ID of the created record
 */
export async function insertFeedInventory(
  db: Kysely<Database>,
  data: FeedInventoryInsert,
): Promise<string> {
  const result = await db
    .insertInto('feed_inventory')
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Update a feed inventory record
 *
 * @param db - Kysely database instance
 * @param id - Feed inventory ID to update
 * @param data - Fields to update
 * @returns Promise resolving when update is complete
 */
export async function updateFeedInventory(
  db: Kysely<Database>,
  id: string,
  data: FeedInventoryUpdate,
): Promise<void> {
  await db
    .updateTable('feed_inventory')
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

/**
 * Delete a feed inventory record
 *
 * @param db - Kysely database instance
 * @param id - Feed inventory ID to delete
 * @returns Promise resolving when delete is complete
 */
export async function deleteFeedInventory(
  db: Kysely<Database>,
  id: string,
): Promise<void> {
  await db.deleteFrom('feed_inventory').where('id', '=', id).execute()
}

/**
 * Get low stock feed inventory for farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of feed inventory records below threshold
 */
export async function getLowStockFeed(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<FeedInventoryRecord>> {
  return await db
    .selectFrom('feed_inventory')
    .leftJoin('farms', 'farms.id', 'feed_inventory.farmId')
    .select([
      'feed_inventory.id',
      'feed_inventory.farmId',
      'feed_inventory.feedType',
      'feed_inventory.quantityKg',
      'feed_inventory.minThresholdKg',
      'feed_inventory.updatedAt',
      'farms.name as farmName',
    ])
    .where('feed_inventory.farmId', 'in', farmIds)
    .where((eb) =>
      eb(
        'feed_inventory.quantityKg',
        '<=',
        'feed_inventory."minThresholdKg"',
      ),
    )
    .orderBy('feed_inventory.feedType', 'asc')
    .execute()
}

// ============================================================================
// Medication Inventory Repository Functions
// ============================================================================

/**
 * Get medication inventory by ID
 *
 * @param db - Kysely database instance
 * @param id - Medication inventory ID
 * @returns Medication inventory record with farm info, or null if not found
 */
export async function getMedicationInventoryById(
  db: Kysely<Database>,
  id: string,
): Promise<MedicationInventoryRecord | null> {
  const record = await db
    .selectFrom('medication_inventory')
    .leftJoin('farms', 'farms.id', 'medication_inventory.farmId')
    .select([
      'medication_inventory.id',
      'medication_inventory.farmId',
      'medication_inventory.medicationName',
      'medication_inventory.quantity',
      'medication_inventory.unit',
      'medication_inventory.expiryDate',
      'medication_inventory.minThreshold',
      'medication_inventory.updatedAt',
      'farms.name as farmName',
    ])
    .where('medication_inventory.id', '=', id)
    .executeTakeFirst()

  return (record as MedicationInventoryRecord | undefined) ?? null
}

/**
 * Get all medication inventory for a list of farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of medication inventory records with farm names
 */
export async function selectMedicationInventory(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<MedicationInventoryRecord>> {
  return await db
    .selectFrom('medication_inventory')
    .leftJoin('farms', 'farms.id', 'medication_inventory.farmId')
    .select([
      'medication_inventory.id',
      'medication_inventory.farmId',
      'medication_inventory.medicationName',
      'medication_inventory.quantity',
      'medication_inventory.unit',
      'medication_inventory.expiryDate',
      'medication_inventory.minThreshold',
      'medication_inventory.updatedAt',
      'farms.name as farmName',
    ])
    .where('medication_inventory.farmId', 'in', farmIds)
    .orderBy('medication_inventory.medicationName', 'asc')
    .execute()
}

/**
 * Insert a new medication inventory record
 *
 * @param db - Kysely database instance
 * @param data - Medication inventory data to insert
 * @returns The ID of the created record
 */
export async function insertMedicationInventory(
  db: Kysely<Database>,
  data: MedicationInventoryInsert,
): Promise<string> {
  const result = await db
    .insertInto('medication_inventory')
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Update a medication inventory record
 *
 * @param db - Kysely database instance
 * @param id - Medication inventory ID to update
 * @param data - Fields to update
 * @returns Promise resolving when update is complete
 */
export async function updateMedicationInventory(
  db: Kysely<Database>,
  id: string,
  data: MedicationInventoryUpdate,
): Promise<void> {
  await db
    .updateTable('medication_inventory')
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

/**
 * Delete a medication inventory record
 *
 * @param db - Kysely database instance
 * @param id - Medication inventory ID to delete
 * @returns Promise resolving when delete is complete
 */
export async function deleteMedicationInventory(
  db: Kysely<Database>,
  id: string,
): Promise<void> {
  await db.deleteFrom('medication_inventory').where('id', '=', id).execute()
}

/**
 * Get medications expiring within a specified number of days
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @param days - Number of days to look ahead (default: 30)
 * @returns Array of medications expiring soon
 */
export async function getExpiringMedications(
  db: Kysely<Database>,
  farmIds: Array<string>,
  days: number = 30,
): Promise<Array<MedicationInventoryRecord>> {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  return await db
    .selectFrom('medication_inventory')
    .leftJoin('farms', 'farms.id', 'medication_inventory.farmId')
    .select([
      'medication_inventory.id',
      'medication_inventory.farmId',
      'medication_inventory.medicationName',
      'medication_inventory.quantity',
      'medication_inventory.unit',
      'medication_inventory.expiryDate',
      'medication_inventory.minThreshold',
      'medication_inventory.updatedAt',
      'farms.name as farmName',
    ])
    .where('medication_inventory.farmId', 'in', farmIds)
    .where('medication_inventory.expiryDate', 'is not', null)
    .where('medication_inventory.expiryDate', '<=', futureDate)
    .orderBy('medication_inventory.expiryDate', 'asc')
    .execute()
}

/**
 * Get low stock medications for farms
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs
 * @returns Array of medications below threshold
 */
export async function getLowStockMedications(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<MedicationInventoryRecord>> {
  return await db
    .selectFrom('medication_inventory')
    .leftJoin('farms', 'farms.id', 'medication_inventory.farmId')
    .select([
      'medication_inventory.id',
      'medication_inventory.farmId',
      'medication_inventory.medicationName',
      'medication_inventory.quantity',
      'medication_inventory.unit',
      'medication_inventory.minThreshold',
      'farms.name as farmName',
    ])
    .where('medication_inventory.farmId', 'in', farmIds)
    .where((eb) =>
      eb(
        'medication_inventory.quantity',
        '<=',
        'medication_inventory."minThreshold"',
      ),
    )
    .orderBy('medication_inventory.medicationName', 'asc')
    .execute()
}
