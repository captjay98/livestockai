/**
 * Server functions for medication inventory management.
 * Handles authentication, authorization, and orchestration.
 */

import { createServerFn } from '@tanstack/react-start'
import {
  MEDICATION_UNITS,
  validateMedicationData,
  validateMedicationUpdateData,
} from './service'
import {
  deleteMedicationInventory,
  getExpiringMedications,
  getLowStockMedications,
  getMedicationInventoryById,
  insertMedicationInventory,
  selectMedicationInventory,
  updateMedicationInventory,
} from './repository'
import type { CreateMedicationInput, UpdateMedicationInput } from './service'
import type { MedicationInventoryUpdate } from './repository'
import {
  checkFarmAccess,
  getUserFarms,
  verifyFarmAccess,
} from '~/features/auth/utils'
import { AppError } from '~/lib/errors'

export { MEDICATION_UNITS }
export type { CreateMedicationInput, UpdateMedicationInput }

type MedicationQueryInput = { farmId?: string }
type ExpiringMedicationsInput = { farmId?: string; days?: number }
type MedicationCreateInput = {
  input: {
    farmId: string
    medicationName: string
    quantity: number
    unit: 'vial' | 'bottle' | 'sachet' | 'ml' | 'g' | 'tablet' | 'kg' | 'liter'
    expiryDate?: Date | null
    minThreshold: number
  }
}
type MedicationUpdateInput = {
  id: string
  input: {
    medicationName?: string
    quantity?: number
    unit?: 'vial' | 'bottle' | 'sachet' | 'ml' | 'g' | 'tablet' | 'kg' | 'liter'
    expiryDate?: Date | null
    minThreshold?: number
  }
}
type MedicationDeleteInput = { id: string }
type UseMedicationInput = { id: string; quantityUsed: number }
type AddMedicationStockInput = { id: string; quantityToAdd: number }

export async function getMedicationInventory(userId: string, farmId?: string) {
  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const { db } = await import('~/lib/db')
  return selectMedicationInventory(db, targetFarmIds)
}

export const getMedicationInventoryFn = createServerFn({ method: 'GET' })
  .inputValidator((data: MedicationQueryInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getMedicationInventory(session.user.id, data.farmId)
  })

export async function getExpiringMedicationsList(
  userId: string,
  farmId?: string,
  days: number = 30,
) {
  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const { db } = await import('~/lib/db')
  return getExpiringMedications(db, targetFarmIds, days)
}

export const getExpiringMedicationsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ExpiringMedicationsInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getExpiringMedicationsList(
      session.user.id,
      data.farmId,
      data.days ?? 30,
    )
  })

export async function getLowStockMedicationsList(
  userId: string,
  farmId?: string,
) {
  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const { db } = await import('~/lib/db')
  return getLowStockMedications(db, targetFarmIds)
}

export const getLowStockMedicationsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: MedicationQueryInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getLowStockMedicationsList(session.user.id, data.farmId)
  })

export async function createMedication(
  userId: string,
  input: CreateMedicationInput,
): Promise<string> {
  const validationError = validateMedicationData(input)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', {
      message: validationError,
      metadata: { field: 'input' },
    })
  }

  await verifyFarmAccess(userId, input.farmId)

  const { db } = await import('~/lib/db')

  const id = await insertMedicationInventory(db, {
    farmId: input.farmId,
    medicationName: input.medicationName,
    quantity: input.quantity,
    unit: input.unit,
    expiryDate: input.expiryDate ?? null,
    minThreshold: input.minThreshold,
  })

  return id
}

export const createMedicationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: MedicationCreateInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createMedication(
      session.user.id,
      data.input as CreateMedicationInput,
    )
  })

export async function updateMedicationRecord(
  userId: string,
  id: string,
  input: UpdateMedicationInput,
) {
  const validationError = validateMedicationUpdateData(input)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', {
      message: validationError,
      metadata: { field: 'input' },
    })
  }

  const { db } = await import('~/lib/db')
  const farmIds = await getUserFarms(userId)

  const record = await getMedicationInventoryById(db, id)
  if (!record) {
    throw new AppError('MEDICATION_NOT_FOUND', {
      metadata: { resource: 'MedicationInventory', id },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  const updateData: MedicationInventoryUpdate = {}

  if (input.medicationName !== undefined)
    updateData.medicationName = input.medicationName
  if (input.quantity !== undefined) updateData.quantity = input.quantity
  if (input.unit !== undefined)
    updateData.unit = input.unit as MedicationInventoryUpdate['unit']
  if (input.expiryDate !== undefined) updateData.expiryDate = input.expiryDate
  if (input.minThreshold !== undefined)
    updateData.minThreshold = input.minThreshold

  await updateMedicationInventory(db, id, updateData)

  return true
}

export const updateMedicationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: MedicationUpdateInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateMedicationRecord(
      session.user.id,
      data.id,
      data.input as UpdateMedicationInput,
    )
  })

export async function deleteMedicationRecord(userId: string, id: string) {
  const { db } = await import('~/lib/db')
  const farmIds = await getUserFarms(userId)

  const record = await getMedicationInventoryById(db, id)
  if (!record) {
    throw new AppError('MEDICATION_NOT_FOUND', {
      metadata: { resource: 'MedicationInventory', id },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  await deleteMedicationInventory(db, id)

  return true
}

export const deleteMedicationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: MedicationDeleteInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteMedicationRecord(session.user.id, data.id)
  })

export async function useMedicationRecord(
  userId: string,
  id: string,
  quantityUsed: number,
) {
  if (quantityUsed <= 0) {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Quantity used must be positive',
      metadata: { field: 'quantityUsed' },
    })
  }

  const { db } = await import('~/lib/db')
  const farmIds = await getUserFarms(userId)

  const record = await getMedicationInventoryById(db, id)
  if (!record) {
    throw new AppError('MEDICATION_NOT_FOUND', {
      metadata: { resource: 'MedicationInventory', id },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  if (record.quantity < quantityUsed) {
    throw new AppError('INSUFFICIENT_STOCK', {
      message: `Insufficient ${record.medicationName} stock`,
      metadata: { available: record.quantity, requested: quantityUsed },
    })
  }

  const newQuantity = record.quantity - quantityUsed
  await updateMedicationInventory(db, id, { quantity: newQuantity })

  return true
}

export const useMedicationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: UseMedicationInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return useMedicationRecord(session.user.id, data.id, data.quantityUsed)
  })

export async function addMedicationStockRecord(
  userId: string,
  id: string,
  quantityToAdd: number,
) {
  if (quantityToAdd <= 0) {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Quantity to add must be positive',
      metadata: { field: 'quantityToAdd' },
    })
  }

  const { db } = await import('~/lib/db')
  const farmIds = await getUserFarms(userId)

  const record = await getMedicationInventoryById(db, id)
  if (!record) {
    throw new AppError('MEDICATION_NOT_FOUND', {
      metadata: { resource: 'MedicationInventory', id },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  const newQuantity = record.quantity + quantityToAdd
  await updateMedicationInventory(db, id, { quantity: newQuantity })

  return true
}

export const addMedicationStockFn = createServerFn({ method: 'POST' })
  .inputValidator((data: AddMedicationStockInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return addMedicationStockRecord(
      session.user.id,
      data.id,
      data.quantityToAdd,
    )
  })
