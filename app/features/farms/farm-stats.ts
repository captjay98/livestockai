import { createServerFn } from '@tanstack/react-start'
import type { FarmWithStats } from './types'
import { getFarmsForUser } from '~/features/farms/server'

export const getFarmsWithStatsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()

    const farms = await getFarmsForUser(session.user.id)

    const farmsWithStats = await Promise.all(
      farms.map(async (farm) => {
        const stats = await db
          .selectFrom('batches')
          .select([
            db.fn.count('id').as('activeBatches'),
            db.fn.sum<number>('currentQuantity').as('totalLivestock'),
          ])
          .where('farmId', '=', farm.id)
          .where('status', '=', 'active')
          .executeTakeFirst()

        return {
          ...farm,
          activeBatches: Number(stats?.activeBatches || 0),
          totalLivestock: Number(stats?.totalLivestock || 0),
        } as FarmWithStats
      }),
    )

    return farmsWithStats
  },
)
