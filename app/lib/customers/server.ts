import { db } from '~/lib/db'

export interface CreateCustomerInput {
  name: string
  phone: string
  email?: string | null
  location?: string | null
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<string> {
  const result = await db
    .insertInto('customers')
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      location: input.location || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export async function getCustomers() {
  return db.selectFrom('customers').selectAll().orderBy('name', 'asc').execute()
}

export async function getCustomerById(customerId: string) {
  return db
    .selectFrom('customers')
    .selectAll()
    .where('id', '=', customerId)
    .executeTakeFirst()
}

export async function updateCustomer(
  customerId: string,
  input: Partial<CreateCustomerInput>,
) {
  await db
    .updateTable('customers')
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where('id', '=', customerId)
    .execute()
}

export async function deleteCustomer(customerId: string) {
  await db.deleteFrom('customers').where('id', '=', customerId).execute()
}

export async function getCustomerWithSales(customerId: string) {
  const customer = await getCustomerById(customerId)
  if (!customer) return null

  const sales = await db
    .selectFrom('sales')
    .select([
      'id',
      'livestockType',
      'quantity',
      'unitPrice',
      'totalAmount',
      'date',
    ])
    .where('customerId', '=', customerId)
    .orderBy('date', 'desc')
    .execute()

  const totalSpent = sales.reduce(
    (sum, s) => sum + parseFloat(s.totalAmount),
    0,
  )

  return {
    ...customer,
    sales,
    totalSpent,
    salesCount: sales.length,
  }
}

export async function getTopCustomers(limit: number = 10) {
  const customers = await db
    .selectFrom('customers')
    .leftJoin('sales', 'sales.customerId', 'customers.id')
    .select([
      'customers.id',
      'customers.name',
      'customers.phone',
      'customers.location',
      db.fn.count('sales.id').as('salesCount'),
      db.fn.sum<string>('sales.totalAmount').as('totalSpent'),
    ])
    .groupBy([
      'customers.id',
      'customers.name',
      'customers.phone',
      'customers.location',
    ])
    .orderBy('totalSpent', 'desc')
    .limit(limit)
    .execute()

  return customers.map((c) => ({
    ...c,
    salesCount: Number(c.salesCount),
    totalSpent: parseFloat(c.totalSpent || '0'),
  }))
}
