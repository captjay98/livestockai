/**
 * Bulk database operations for performance optimization
 */

import type { Kysely } from 'kysely'
import type { Database } from './types'

/**
 * Bulk insert records into any table
 * @param db - Kysely database instance
 * @param table - Table name
 * @param records - Array of records to insert
 * @returns Array of inserted record IDs
 */
export async function bulkInsert<T extends keyof Database>(
  db: Kysely<Database>,
  table: T,
  records: Array<any>, // Use any for now to avoid complex type issues
): Promise<Array<{ id: string }>> {
  if (records.length === 0) return []

  const result = (await db
    .insertInto(table)
    .values(records as any)
    .returning('id' as any)
    .execute()) as any

  return result.map((r: any) => r.id)
}

/**
 * Bulk update records by ID
 * @param db - Kysely database instance
 * @param table - Table name
 * @param updates - Array of {id, data} objects
 */
export async function bulkUpdate<T extends keyof Database>(
  db: Kysely<Database>,
  table: T,
  updates: Array<{ id: string; data: any }>, // Use any for now to avoid complex type issues
): Promise<void> {
  if (updates.length === 0) return

  await db.transaction().execute(async (trx) => {
    for (const { id, data } of updates) {
      await (trx as any)
        .updateTable(table)
        .set(data)
        .where('id', '=', id)
        .execute()
    }
  })
}
