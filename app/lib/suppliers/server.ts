import { createServerFn } from '@tanstack/react-start'

export interface CreateSupplierInput {
  name: string
  phone: string
  email?: string | null
  location?: string | null
  products: Array<string>
}

export async function createSupplier(
  input: CreateSupplierInput,
): Promise<string> {
  const { db } = await import('~/lib/db')

  const result = await db
    .insertInto('suppliers')
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      location: input.location || null,
      products: input.products,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export async function getSuppliers() {
  const { db } = await import('~/lib/db')
  return db.selectFrom('suppliers').selectAll().orderBy('name', 'asc').execute()
}

// Server function for client-side calls
export const getSuppliersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getSuppliers()
  },
)

export async function getSupplierById(supplierId: string) {
  const { db } = await import('~/lib/db')
  return db
    .selectFrom('suppliers')
    .selectAll()
    .where('id', '=', supplierId)
    .executeTakeFirst()
}

export async function updateSupplier(
  supplierId: string,
  input: Partial<CreateSupplierInput>,
) {
  const { db } = await import('~/lib/db')
  await db
    .updateTable('suppliers')
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where('id', '=', supplierId)
    .execute()
}

export async function deleteSupplier(supplierId: string) {
  const { db } = await import('~/lib/db')
  await db.deleteFrom('suppliers').where('id', '=', supplierId).execute()
}

export async function getSupplierWithExpenses(supplierId: string) {
  const { db } = await import('~/lib/db')

  const supplier = await getSupplierById(supplierId)
  if (!supplier) return null

  const expenses = await db
    .selectFrom('expenses')
    .select(['id', 'category', 'amount', 'date', 'description'])
    .where('supplierId', '=', supplierId)
    .orderBy('date', 'desc')
    .execute()

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

  return {
    ...supplier,
    expenses,
    totalSpent,
    expenseCount: expenses.length,
  }
}
