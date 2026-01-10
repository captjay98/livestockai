export interface CreateVaccinationInput {
  batchId: string
  vaccineName: string
  dateAdministered: Date
  dosage: string
  nextDueDate?: Date | null
  notes?: string | null
}

export interface CreateTreatmentInput {
  batchId: string
  medicationName: string
  reason: string
  date: Date
  dosage: string
  withdrawalDays: number
  notes?: string | null
}

export async function createVaccination(
  userId: string,
  farmId: string,
  input: CreateVaccinationInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, farmId)

  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId'])
    .where('id', '=', input.batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!batch) {
    throw new Error('Batch not found or does not belong to this farm')
  }

  const result = await db
    .insertInto('vaccinations')
    .values({
      batchId: input.batchId,
      vaccineName: input.vaccineName,
      dateAdministered: input.dateAdministered,
      dosage: input.dosage,
      nextDueDate: input.nextDueDate || null,
      notes: input.notes || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export async function createTreatment(
  userId: string,
  farmId: string,
  input: CreateTreatmentInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, farmId)

  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId'])
    .where('id', '=', input.batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!batch) {
    throw new Error('Batch not found or does not belong to this farm')
  }

  const result = await db
    .insertInto('treatments')
    .values({
      batchId: input.batchId,
      medicationName: input.medicationName,
      reason: input.reason,
      date: input.date,
      dosage: input.dosage,
      withdrawalDays: input.withdrawalDays,
      notes: input.notes || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export async function getVaccinationsForFarm(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: string[] = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  return db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      'vaccinations.vaccineName',
      'vaccinations.dateAdministered',
      'vaccinations.dosage',
      'vaccinations.nextDueDate',
      'vaccinations.notes',
      'vaccinations.createdAt',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .orderBy('vaccinations.dateAdministered', 'desc')
    .execute()
}

export async function getTreatmentsForFarm(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: string[] = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  return db
    .selectFrom('treatments')
    .innerJoin('batches', 'batches.id', 'treatments.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'treatments.id',
      'treatments.batchId',
      'treatments.medicationName',
      'treatments.reason',
      'treatments.date',
      'treatments.dosage',
      'treatments.withdrawalDays',
      'treatments.notes',
      'treatments.createdAt',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .orderBy('treatments.date', 'desc')
    .execute()
}

export async function getUpcomingVaccinations(
  userId: string,
  farmId?: string,
  daysAhead: number = 7,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: string[] = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + daysAhead)

  return db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      'vaccinations.vaccineName',
      'vaccinations.nextDueDate',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .where('batches.status', '=', 'active')
    .where('vaccinations.nextDueDate', '>=', today)
    .where('vaccinations.nextDueDate', '<=', futureDate)
    .orderBy('vaccinations.nextDueDate', 'asc')
    .execute()
}

export async function getOverdueVaccinations(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: string[] = []
  if (farmId) {
    await verifyFarmAccess(userId, farmId)
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const today = new Date()

  return db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'vaccinations.id',
      'vaccinations.batchId',
      'vaccinations.vaccineName',
      'vaccinations.nextDueDate',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .where('batches.status', '=', 'active')
    .where('vaccinations.nextDueDate', '<', today)
    .orderBy('vaccinations.nextDueDate', 'asc')
    .execute()
}

export async function getVaccinationAlerts(userId: string, farmId?: string) {
  const [upcoming, overdue] = await Promise.all([
    getUpcomingVaccinations(userId, farmId),
    getOverdueVaccinations(userId, farmId),
  ])

  return {
    upcoming,
    overdue,
    totalAlerts: upcoming.length + overdue.length,
  }
}
