export interface CreateWeightSampleInput {
  batchId: string
  date: Date
  sampleSize: number
  averageWeightKg: number
}

export async function createWeightSample(
  userId: string,
  farmId: string,
  input: CreateWeightSampleInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, farmId)

  // Verify batch belongs to farm
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
    .insertInto('weight_samples')
    .values({
      batchId: input.batchId,
      date: input.date,
      sampleSize: input.sampleSize,
      averageWeightKg: input.averageWeightKg.toString(),
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export async function getWeightSamplesForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, farmId)

  return db
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .select([
      'weight_samples.id',
      'weight_samples.batchId',
      'weight_samples.date',
      'weight_samples.sampleSize',
      'weight_samples.averageWeightKg',
      'weight_samples.createdAt',
    ])
    .where('weight_samples.batchId', '=', batchId)
    .where('batches.farmId', '=', farmId)
    .orderBy('weight_samples.date', 'asc')
    .execute()
}

export async function getWeightSamplesForFarm(userId: string, farmId?: string) {
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
    .selectFrom('weight_samples')
    .innerJoin('batches', 'batches.id', 'weight_samples.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'weight_samples.id',
      'weight_samples.batchId',
      'weight_samples.date',
      'weight_samples.sampleSize',
      'weight_samples.averageWeightKg',
      'weight_samples.createdAt',
      'batches.species',
      'batches.livestockType',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .orderBy('weight_samples.date', 'desc')
    .execute()
}

export async function calculateADG(
  userId: string,
  farmId: string,
  batchId: string,
): Promise<{ adg: number; daysBetween: number; weightGain: number } | null> {
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, farmId)

  const samples = await getWeightSamplesForBatch(userId, farmId, batchId)

  if (samples.length < 2) {
    return null
  }

  const firstSample = samples[0]
  const lastSample = samples[samples.length - 1]

  const firstWeight = parseFloat(firstSample.averageWeightKg)
  const lastWeight = parseFloat(lastSample.averageWeightKg)
  const weightGain = lastWeight - firstWeight

  const firstDate = new Date(firstSample.date)
  const lastDate = new Date(lastSample.date)
  const daysBetween = Math.ceil(
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (daysBetween <= 0) {
    return null
  }

  const adg = weightGain / daysBetween

  return {
    adg: Math.round(adg * 1000) / 1000, // Round to 3 decimal places (grams)
    daysBetween,
    weightGain: Math.round(weightGain * 1000) / 1000,
  }
}

export async function getGrowthAlerts(userId: string, farmId?: string) {
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

  // Get all active batches with weight samples
  const batches = await db
    .selectFrom('batches')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'batches.id',
      'batches.species',
      'batches.livestockType',
      'batches.acquisitionDate',
      'batches.farmId',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', targetFarmIds)
    .where('status', '=', 'active')
    .execute()

  const alerts: Array<{
    batchId: string
    species: string
    message: string
    severity: 'warning' | 'critical'
    severity: 'warning' | 'critical'
    adg: number
    expectedAdg: number
    farmName?: string
  }> = []

  // Expected ADG targets (kg/day)
  const expectedADG: Record<string, number> = {
    broiler: 0.05, // 50g/day
    layer: 0.02, // 20g/day
    catfish: 0.015, // 15g/day
    tilapia: 0.01, // 10g/day
  }

  for (const batch of batches) {
    const adgResult = await calculateADG(userId, batch.farmId, batch.id)
    if (!adgResult) continue

    const expected = expectedADG[batch.species.toLowerCase()] || 0.03
    const percentOfExpected = (adgResult.adg / expected) * 100

    if (percentOfExpected < 70) {
      alerts.push({
        batchId: batch.id,
        species: batch.species,
        message: `Growth rate is ${percentOfExpected.toFixed(0)}% of expected (${(adgResult.adg * 1000).toFixed(0)}g/day vs ${(expected * 1000).toFixed(0)}g/day expected)`,
        severity: percentOfExpected < 50 ? 'critical' : 'warning',
        adg: adgResult.adg,
        expectedAdg: expected,
        farmName: batch.farmName || undefined,
      })
    }
  }

  return alerts
}
