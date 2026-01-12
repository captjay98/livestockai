import { createServerFn } from '@tanstack/react-start'

export type MedicationUnit =
  | 'vial'
  | 'bottle'
  | 'sachet'
  | 'ml'
  | 'g'
  | 'tablet'

export const MEDICATION_UNITS: Array<{ value: MedicationUnit; label: string }> =
  [
    { value: 'vial', label: 'Vial' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'sachet', label: 'Sachet' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'tablet', label: 'Tablet' },
  ]

export interface CreateMedicationInput {
  farmId: string
  medicationName: string
  quantity: number
  unit: MedicationUnit
  expiryDate?: Date | null
  minThreshold: number
}

export interface UpdateMedicationInput {
  medicationName?: string
  quantity?: number
  unit?: MedicationUnit
  expiryDate?: Date | null
  minThreshold?: number
}

/**
 * Get medication inventory for a user - optionally filtered by farm
 */
export async function getMedicationInventory(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) throw new Error('Access denied')
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  return db
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
    .where('medication_inventory.farmId', 'in', targetFarmIds)
    .orderBy('medication_inventory.medicationName', 'asc')
    .execute()
}

export const getMedicationInventoryFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return getMedicationInventory(session.user.id, data.farmId)
  })

/**
 * Create a new medication inventory record
 */
export async function createMedication(
  userId: string,
  input: CreateMedicationInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, input.farmId)

  const result = await db
    .insertInto('medication_inventory')
    .values({
      farmId: input.farmId,
      medicationName: input.medicationName,
      quantity: input.quantity,
      unit: input.unit,
      expiryDate: input.expiryDate || null,
      minThreshold: input.minThreshold,
      updatedAt: new Date(),
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export const createMedicationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { input: CreateMedicationInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return createMedication(session.user.id, data.input)
  })

/**
 * Update a medication inventory record
 */
export async function updateMedication(
  userId: string,
  id: string,
  input: UpdateMedicationInput,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  const farmIds = await getUserFarms(userId)

  const record = await db
    .selectFrom('medication_inventory')
    .select(['id', 'farmId'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!record) throw new Error('Medication record not found')
  if (!farmIds.includes(record.farmId)) throw new Error('Unauthorized')

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (input.medicationName !== undefined)
    updateData.medicationName = input.medicationName
  if (input.quantity !== undefined) updateData.quantity = input.quantity
  if (input.unit !== undefined) updateData.unit = input.unit
  if (input.expiryDate !== undefined) updateData.expiryDate = input.expiryDate
  if (input.minThreshold !== undefined)
    updateData.minThreshold = input.minThreshold

  await db
    .updateTable('medication_inventory')
    .set(updateData)
    .where('id', '=', id)
    .execute()

  return true
}

export const updateMedicationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; input: UpdateMedicationInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return updateMedication(session.user.id, data.id, data.input)
  })

/**
 * Delete a medication inventory record
 */
export async function deleteMedication(userId: string, id: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  const farmIds = await getUserFarms(userId)

  const record = await db
    .selectFrom('medication_inventory')
    .select(['id', 'farmId'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!record) throw new Error('Medication record not found')
  if (!farmIds.includes(record.farmId)) throw new Error('Unauthorized')

  await db.deleteFrom('medication_inventory').where('id', '=', id).execute()
  return true
}

export const deleteMedicationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return deleteMedication(session.user.id, data.id)
  })

/**
 * Use medication (reduce inventory) - called when recording treatments
 */
export async function useMedication(
  userId: string,
  id: string,
  quantityUsed: number,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  const farmIds = await getUserFarms(userId)

  const record = await db
    .selectFrom('medication_inventory')
    .select(['id', 'farmId', 'quantity', 'medicationName'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!record) throw new Error('Medication record not found')
  if (!farmIds.includes(record.farmId)) throw new Error('Unauthorized')

  if (record.quantity < quantityUsed) {
    throw new Error(
      `Insufficient ${record.medicationName} stock. Available: ${record.quantity}, Requested: ${quantityUsed}`,
    )
  }

  const newQuantity = record.quantity - quantityUsed
  await db
    .updateTable('medication_inventory')
    .set({
      quantity: newQuantity,
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()

  return true
}

export const useMedicationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; quantityUsed: number }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return useMedication(session.user.id, data.id, data.quantityUsed)
  })

/**
 * Add medication stock
 */
export async function addMedicationStock(
  userId: string,
  id: string,
  quantityToAdd: number,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  const farmIds = await getUserFarms(userId)

  const record = await db
    .selectFrom('medication_inventory')
    .select(['id', 'farmId', 'quantity'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!record) throw new Error('Medication record not found')
  if (!farmIds.includes(record.farmId)) throw new Error('Unauthorized')

  const newQuantity = record.quantity + quantityToAdd
  await db
    .updateTable('medication_inventory')
    .set({
      quantity: newQuantity,
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()

  return true
}

/**
 * Get medications expiring soon (within days)
 */
export async function getExpiringMedications(
  userId: string,
  farmId?: string,
  days: number = 30,
) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) throw new Error('Access denied')
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  return db
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
      'farms.name as farmName',
    ])
    .where('medication_inventory.farmId', 'in', targetFarmIds)
    .where('medication_inventory.expiryDate', 'is not', null)
    .where('medication_inventory.expiryDate', '<=', futureDate)
    .orderBy('medication_inventory.expiryDate', 'asc')
    .execute()
}

/**
 * Get low stock medications
 */
export async function getLowStockMedications(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')
  const { checkFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) throw new Error('Access denied')
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  return db
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
    .where('medication_inventory.farmId', 'in', targetFarmIds)
    .where((eb) =>
      eb(sql`medication_inventory.quantity`, '<=', sql`medication_inventory."minThreshold"`),
    )
    .orderBy('medication_inventory.medicationName', 'asc')
    .execute()
}
