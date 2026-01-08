import { db } from '~/lib/db'

export interface CreateSupplierInput {
  name: string
  phone: string
  email?: string | null
  location?: string | null
  products: string[]
}

export async function createSupplier(input: CreateSupplierInput): Promise<string> {
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
  return db
    .selectFrom('suppliers')
    .selectAll()
    .orderBy('name', 'asc')
    .execute()
}

export async function getSupplierById(supplierId: string) {
  return db
    .selectFrom('suppliers')
    .selectAll()
    .where('id', '=', supplierId)
    .executeTakeFirst()
}

export async function updateSupplier(
  supplierId: string,
  input: Partial<CreateSupplierInput>
) {
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
  await db
    .deleteFrom('suppliers')
    .where('id', '=', supplierId)
    .execute()
}

export async function getSupplierWithExpenses(supplierId: string) {
  const supplier = await getSupplierById(supplierId)
  if (!supplier) return null

  const expenses = await db
    .selectFrom('expenses')
    .select([
      'id',
      'category',
      'amount',
      'date',
      'description',
    ])
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
