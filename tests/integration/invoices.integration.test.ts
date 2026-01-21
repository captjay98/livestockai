import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  seedTestFarm,
  seedTestUser,
  truncateAllTables,
} from '../helpers/db-integration'

describe('Invoices Integration Tests', () => {
  let userId: string
  let farmId: string
  let customerId: string

  beforeEach(async () => {
    if (!process.env.DATABASE_URL_TEST) return
    await truncateAllTables()

    const user = await seedTestUser({ email: 'farmer@test.com' })
    userId = user.userId

    const farm = await seedTestFarm(userId, {
      name: 'Test Farm',
      type: 'poultry',
      modules: ['poultry'],
    })
    farmId = farm.farmId

    // Create customer
    const db = getTestDb()
    const customer = await db.insertInto('customers').values({
      farmId,
      name: 'John Doe',
      phone: '1234567890',
      email: 'john@example.com',
    }).returning('id').executeTakeFirst()
    customerId = customer!.id
  })

  afterAll(async () => {
    await closeTestDb()
  })

  it('should create invoice with customer and farm', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const db = getTestDb()
    
    const invoiceId = await db.insertInto('invoices').values({
      farmId,
      customerId,
      invoiceNumber: 'INV-2025-0001',
      totalAmount: '1000.00',
      status: 'unpaid',
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }).returning('id').executeTakeFirst()

    const invoice = await db
      .selectFrom('invoices')
      .innerJoin('customers', 'customers.id', 'invoices.customerId')
      .select(['invoices.invoiceNumber', 'customers.name', 'invoices.totalAmount'])
      .where('invoices.id', '=', invoiceId!.id)
      .executeTakeFirst()

    expect(invoice).toBeDefined()
    expect(invoice!.invoiceNumber).toBe('INV-2025-0001')
    expect(invoice!.name).toBe('John Doe')
    expect(invoice!.totalAmount).toBe('1000.00')
  })

  it('should add invoice items and verify total calculation', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const db = getTestDb()
    
    // Create invoice
    const invoiceId = await db.insertInto('invoices').values({
      farmId,
      customerId,
      invoiceNumber: 'INV-2025-0002',
      totalAmount: '0.00',
      status: 'unpaid',
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).returning('id').executeTakeFirst()

    // Add invoice items
    await db.insertInto('invoice_items').values([
      {
        invoiceId: invoiceId!.id,
        description: 'Broiler chickens',
        quantity: 10,
        unitPrice: '500.00',
        total: '5000.00',
      },
      {
        invoiceId: invoiceId!.id,
        description: 'Feed',
        quantity: 5,
        unitPrice: '200.00',
        total: '1000.00',
      },
    ]).execute()

    // Update invoice total
    await db.updateTable('invoices')
      .set({ totalAmount: '6000.00' })
      .where('id', '=', invoiceId!.id)
      .execute()

    // Verify items and total
    const items = await db.selectFrom('invoice_items')
      .selectAll()
      .where('invoiceId', '=', invoiceId!.id)
      .execute()

    const invoice = await db.selectFrom('invoices')
      .select(['totalAmount'])
      .where('id', '=', invoiceId!.id)
      .executeTakeFirst()

    expect(items.length).toBe(2)
    expect(items[0].total).toBe('5000.00')
    expect(items[1].total).toBe('1000.00')
    expect(invoice!.totalAmount).toBe('6000.00')

    // Verify calculation
    const calculatedTotal = items.reduce((sum, item) => sum + parseFloat(item.total), 0)
    expect(calculatedTotal).toBe(6000.00)
  })

  it('should enforce invoice number uniqueness constraint', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const db = getTestDb()
    
    // Create first invoice
    await db.insertInto('invoices').values({
      farmId,
      customerId,
      invoiceNumber: 'INV-2025-0003',
      totalAmount: '1000.00',
      status: 'unpaid',
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).execute()

    // Try to create second invoice with same number
    await expect(
      db.insertInto('invoices').values({
        farmId,
        customerId,
        invoiceNumber: 'INV-2025-0003', // Duplicate
        totalAmount: '2000.00',
        status: 'unpaid',
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }).execute()
    ).rejects.toThrow()
  })

  it('should handle invoice status transitions', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const db = getTestDb()
    
    // Create invoice with unpaid status
    const invoiceId = await db.insertInto('invoices').values({
      farmId,
      customerId,
      invoiceNumber: 'INV-2025-0004',
      totalAmount: '1500.00',
      status: 'unpaid',
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).returning('id').executeTakeFirst()

    // Update to partial
    await db.updateTable('invoices')
      .set({ status: 'partial' })
      .where('id', '=', invoiceId!.id)
      .execute()

    let invoice = await db.selectFrom('invoices')
      .select(['status'])
      .where('id', '=', invoiceId!.id)
      .executeTakeFirst()

    expect(invoice!.status).toBe('partial')

    // Update to paid
    await db.updateTable('invoices')
      .set({ status: 'paid', paidDate: new Date() })
      .where('id', '=', invoiceId!.id)
      .execute()

    invoice = await db.selectFrom('invoices')
      .select(['status', 'paidDate'])
      .where('id', '=', invoiceId!.id)
      .executeTakeFirst()

    expect(invoice!.status).toBe('paid')
    expect(invoice!.paidDate).toBeDefined()
  })

  it('should cascade delete invoice items when invoice deleted', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const db = getTestDb()
    
    // Create invoice
    const invoiceId = await db.insertInto('invoices').values({
      farmId,
      customerId,
      invoiceNumber: 'INV-2025-0005',
      totalAmount: '2000.00',
      status: 'unpaid',
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).returning('id').executeTakeFirst()

    // Add invoice items
    await db.insertInto('invoice_items').values([
      {
        invoiceId: invoiceId!.id,
        description: 'Item 1',
        quantity: 2,
        unitPrice: '500.00',
        total: '1000.00',
      },
      {
        invoiceId: invoiceId!.id,
        description: 'Item 2',
        quantity: 1,
        unitPrice: '1000.00',
        total: '1000.00',
      },
    ]).execute()

    // Verify items exist
    let items = await db.selectFrom('invoice_items')
      .selectAll()
      .where('invoiceId', '=', invoiceId!.id)
      .execute()

    expect(items.length).toBe(2)

    // Delete invoice
    await db.deleteFrom('invoices')
      .where('id', '=', invoiceId!.id)
      .execute()

    // Verify items are cascade deleted
    items = await db.selectFrom('invoice_items')
      .selectAll()
      .where('invoiceId', '=', invoiceId!.id)
      .execute()

    expect(items.length).toBe(0)
  })
})