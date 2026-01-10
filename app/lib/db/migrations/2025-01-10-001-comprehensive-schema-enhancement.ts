import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // ============================================
  // NEW TABLE: structures (houses, ponds, pens)
  // ============================================
  await db.schema
    .createTable('structures')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('type', 'varchar(20)', (col) => col.notNull())
    .addColumn('capacity', 'integer')
    .addColumn('areaSqm', sql`decimal(10,2)`)
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('active'))
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE structures ADD CONSTRAINT structures_type_check CHECK (type IN ('house', 'pond', 'pen', 'cage'))`.execute(db)
  await sql`ALTER TABLE structures ADD CONSTRAINT structures_status_check CHECK (status IN ('active', 'empty', 'maintenance'))`.execute(db)

  await db.schema.createIndex('idx_structures_farm_id').on('structures').column('farmId').execute()

  // ============================================
  // NEW TABLE: medication_inventory
  // ============================================
  await db.schema
    .createTable('medication_inventory')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('medicationName', 'varchar(255)', (col) => col.notNull())
    .addColumn('quantity', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('unit', 'varchar(20)', (col) => col.notNull())
    .addColumn('expiryDate', 'date')
    .addColumn('minThreshold', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE medication_inventory ADD CONSTRAINT medication_inventory_unit_check CHECK (unit IN ('vial', 'bottle', 'sachet', 'ml', 'g', 'tablet'))`.execute(db)

  await db.schema.createIndex('idx_medication_inventory_farm_id').on('medication_inventory').column('farmId').execute()

  // ============================================
  // ENHANCE: farms table
  // ============================================
  await db.schema.alterTable('farms')
    .addColumn('contactPhone', 'varchar(50)')
    .execute()
  await db.schema.alterTable('farms')
    .addColumn('notes', 'text')
    .execute()

  // ============================================
  // ENHANCE: batches table
  // ============================================
  await db.schema.alterTable('batches')
    .addColumn('batchName', 'varchar(100)')
    .execute()
  await db.schema.alterTable('batches')
    .addColumn('supplierId', 'uuid', (col) => col.references('suppliers.id'))
    .execute()
  await db.schema.alterTable('batches')
    .addColumn('sourceSize', 'varchar(50)')
    .execute()
  await db.schema.alterTable('batches')
    .addColumn('structureId', 'uuid', (col) => col.references('structures.id'))
    .execute()
  await db.schema.alterTable('batches')
    .addColumn('targetHarvestDate', 'date')
    .execute()
  await db.schema.alterTable('batches')
    .addColumn('notes', 'text')
    .execute()

  await db.schema.createIndex('idx_batches_supplier_id').on('batches').column('supplierId').execute()
  await db.schema.createIndex('idx_batches_structure_id').on('batches').column('structureId').execute()

  // ============================================
  // ENHANCE: feed_records table
  // ============================================
  await db.schema.alterTable('feed_records')
    .addColumn('brandName', 'varchar(100)')
    .execute()
  await db.schema.alterTable('feed_records')
    .addColumn('bagSizeKg', 'integer')
    .execute()
  await db.schema.alterTable('feed_records')
    .addColumn('numberOfBags', 'integer')
    .execute()
  await db.schema.alterTable('feed_records')
    .addColumn('notes', 'text')
    .execute()

  // ============================================
  // ENHANCE: weight_samples table
  // ============================================
  await db.schema.alterTable('weight_samples')
    .addColumn('minWeightKg', sql`decimal(8,3)`)
    .execute()
  await db.schema.alterTable('weight_samples')
    .addColumn('maxWeightKg', sql`decimal(8,3)`)
    .execute()
  await db.schema.alterTable('weight_samples')
    .addColumn('notes', 'text')
    .execute()

  // ============================================
  // ENHANCE: sales table
  // ============================================
  await db.schema.alterTable('sales')
    .addColumn('ageWeeks', 'integer')
    .execute()
  await db.schema.alterTable('sales')
    .addColumn('averageWeightKg', sql`decimal(8,3)`)
    .execute()
  await db.schema.alterTable('sales')
    .addColumn('unitType', 'varchar(20)')
    .execute()
  await db.schema.alterTable('sales')
    .addColumn('paymentStatus', 'varchar(20)', (col) => col.defaultTo('paid'))
    .execute()
  await db.schema.alterTable('sales')
    .addColumn('paymentMethod', 'varchar(20)')
    .execute()
  await db.schema.alterTable('sales')
    .addColumn('invoiceId', 'uuid', (col) => col.references('invoices.id'))
    .execute()

  await sql`ALTER TABLE sales ADD CONSTRAINT sales_unit_type_check CHECK ("unitType" IS NULL OR "unitType" IN ('bird', 'kg', 'crate', 'piece'))`.execute(db)
  await sql`ALTER TABLE sales ADD CONSTRAINT sales_payment_status_check CHECK ("paymentStatus" IS NULL OR "paymentStatus" IN ('paid', 'pending', 'partial'))`.execute(db)
  await sql`ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check CHECK ("paymentMethod" IS NULL OR "paymentMethod" IN ('cash', 'transfer', 'credit'))`.execute(db)

  await db.schema.createIndex('idx_sales_invoice_id').on('sales').column('invoiceId').execute()

  // ============================================
  // ENHANCE: expenses table - add livestock category
  // ============================================
  // Drop old constraint and add new one with all categories
  await sql`ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check`.execute(db)
  await sql`ALTER TABLE expenses ADD CONSTRAINT expenses_category_check CHECK (category IN ('feed', 'medicine', 'equipment', 'utilities', 'labor', 'transport', 'livestock', 'livestock_chicken', 'livestock_fish', 'maintenance', 'marketing', 'other'))`.execute(db)

  // ============================================
  // ENHANCE: customers table
  // ============================================
  await db.schema.alterTable('customers')
    .addColumn('customerType', 'varchar(20)')
    .execute()

  await sql`ALTER TABLE customers ADD CONSTRAINT customers_type_check CHECK ("customerType" IS NULL OR "customerType" IN ('individual', 'restaurant', 'retailer', 'wholesaler'))`.execute(db)

  // ============================================
  // ENHANCE: suppliers table
  // ============================================
  await db.schema.alterTable('suppliers')
    .addColumn('supplierType', 'varchar(20)')
    .execute()

  await sql`ALTER TABLE suppliers ADD CONSTRAINT suppliers_type_check CHECK ("supplierType" IS NULL OR "supplierType" IN ('hatchery', 'feed_mill', 'pharmacy', 'equipment', 'fingerlings', 'other'))`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove supplier enhancements
  await sql`ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_type_check`.execute(db)
  await db.schema.alterTable('suppliers').dropColumn('supplierType').execute()

  // Remove customer enhancements
  await sql`ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_type_check`.execute(db)
  await db.schema.alterTable('customers').dropColumn('customerType').execute()

  // Revert expenses category constraint
  await sql`ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check`.execute(db)
  await sql`ALTER TABLE expenses ADD CONSTRAINT expenses_category_check CHECK (category IN ('feed', 'medicine', 'equipment', 'utilities', 'labor', 'transport', 'other'))`.execute(db)

  // Remove sales enhancements
  await db.schema.dropIndex('idx_sales_invoice_id').ifExists().execute()
  await sql`ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check`.execute(db)
  await sql`ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_status_check`.execute(db)
  await sql`ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_unit_type_check`.execute(db)
  await db.schema.alterTable('sales').dropColumn('invoiceId').execute()
  await db.schema.alterTable('sales').dropColumn('paymentMethod').execute()
  await db.schema.alterTable('sales').dropColumn('paymentStatus').execute()
  await db.schema.alterTable('sales').dropColumn('unitType').execute()
  await db.schema.alterTable('sales').dropColumn('averageWeightKg').execute()
  await db.schema.alterTable('sales').dropColumn('ageWeeks').execute()

  // Remove weight_samples enhancements
  await db.schema.alterTable('weight_samples').dropColumn('notes').execute()
  await db.schema.alterTable('weight_samples').dropColumn('maxWeightKg').execute()
  await db.schema.alterTable('weight_samples').dropColumn('minWeightKg').execute()

  // Remove feed_records enhancements
  await db.schema.alterTable('feed_records').dropColumn('notes').execute()
  await db.schema.alterTable('feed_records').dropColumn('numberOfBags').execute()
  await db.schema.alterTable('feed_records').dropColumn('bagSizeKg').execute()
  await db.schema.alterTable('feed_records').dropColumn('brandName').execute()

  // Remove batches enhancements
  await db.schema.dropIndex('idx_batches_structure_id').ifExists().execute()
  await db.schema.dropIndex('idx_batches_supplier_id').ifExists().execute()
  await db.schema.alterTable('batches').dropColumn('notes').execute()
  await db.schema.alterTable('batches').dropColumn('targetHarvestDate').execute()
  await db.schema.alterTable('batches').dropColumn('structureId').execute()
  await db.schema.alterTable('batches').dropColumn('sourceSize').execute()
  await db.schema.alterTable('batches').dropColumn('supplierId').execute()
  await db.schema.alterTable('batches').dropColumn('batchName').execute()

  // Remove farms enhancements
  await db.schema.alterTable('farms').dropColumn('notes').execute()
  await db.schema.alterTable('farms').dropColumn('contactPhone').execute()

  // Drop new tables
  await db.schema.dropIndex('idx_medication_inventory_farm_id').ifExists().execute()
  await db.schema.dropTable('medication_inventory').ifExists().execute()

  await db.schema.dropIndex('idx_structures_farm_id').ifExists().execute()
  await db.schema.dropTable('structures').ifExists().execute()
}
