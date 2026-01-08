import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Enable UUID extension
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.execute(db)

  // Users table - Better Auth expects camelCase column names
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password', 'varchar(255)')
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('role', 'varchar(10)', (col) => col.notNull())
    .addColumn('emailVerified', 'boolean', (col) => col.defaultTo(false))
    .addColumn('image', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  // Add check constraint for role
  await sql`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff'))`.execute(db)

  // Sessions table for Better Auth
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('userId', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('expiresAt', 'timestamptz', (col) => col.notNull())
    .addColumn('token', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('ipAddress', 'varchar(255)')
    .addColumn('userAgent', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  // Account table for Better Auth (OAuth providers)
  await db.schema
    .createTable('account')
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('userId', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('accountId', 'varchar(255)', (col) => col.notNull())
    .addColumn('providerId', 'varchar(255)', (col) => col.notNull())
    .addColumn('accessToken', 'text')
    .addColumn('refreshToken', 'text')
    .addColumn('accessTokenExpiresAt', 'timestamptz')
    .addColumn('refreshTokenExpiresAt', 'timestamptz')
    .addColumn('scope', 'text')
    .addColumn('idToken', 'text')
    .addColumn('password', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  // Verification table for Better Auth
  await db.schema
    .createTable('verification')
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('identifier', 'varchar(255)', (col) => col.notNull())
    .addColumn('value', 'varchar(255)', (col) => col.notNull())
    .addColumn('expiresAt', 'timestamptz', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  // Farms table
  await db.schema
    .createTable('farms')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('location', 'varchar(255)', (col) => col.notNull())
    .addColumn('type', 'varchar(10)', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE farms ADD CONSTRAINT farms_type_check CHECK (type IN ('poultry', 'fishery', 'mixed'))`.execute(db)


  // User-Farm assignments
  await db.schema
    .createTable('user_farms')
    .addColumn('userId', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('farmId', 'uuid', (col) => col.notNull().references('farms.id').onDelete('cascade'))
    .addPrimaryKeyConstraint('user_farms_pkey', ['userId', 'farmId'])
    .execute()

  // Customers table
  await db.schema
    .createTable('customers')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('phone', 'varchar(50)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)')
    .addColumn('location', 'varchar(255)')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  // Suppliers table
  await db.schema
    .createTable('suppliers')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('phone', 'varchar(50)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)')
    .addColumn('location', 'varchar(255)')
    .addColumn('products', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  // Batches table (livestock groups)
  await db.schema
    .createTable('batches')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('farmId', 'uuid', (col) => col.notNull().references('farms.id').onDelete('cascade'))
    .addColumn('livestockType', 'varchar(10)', (col) => col.notNull())
    .addColumn('species', 'varchar(100)', (col) => col.notNull())
    .addColumn('initialQuantity', 'integer', (col) => col.notNull())
    .addColumn('currentQuantity', 'integer', (col) => col.notNull())
    .addColumn('acquisitionDate', 'date', (col) => col.notNull())
    .addColumn('costPerUnit', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('totalCost', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('status', 'varchar(10)', (col) => col.notNull().defaultTo('active'))
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE batches ADD CONSTRAINT batches_livestock_type_check CHECK ("livestockType" IN ('poultry', 'fish'))`.execute(db)
  await sql`ALTER TABLE batches ADD CONSTRAINT batches_status_check CHECK (status IN ('active', 'depleted', 'sold'))`.execute(db)
  await sql`ALTER TABLE batches ADD CONSTRAINT batches_initial_quantity_check CHECK ("initialQuantity" > 0)`.execute(db)
  await sql`ALTER TABLE batches ADD CONSTRAINT batches_current_quantity_check CHECK ("currentQuantity" >= 0)`.execute(db)
  await sql`ALTER TABLE batches ADD CONSTRAINT batches_cost_per_unit_check CHECK ("costPerUnit" >= 0)`.execute(db)
  await sql`ALTER TABLE batches ADD CONSTRAINT batches_total_cost_check CHECK ("totalCost" >= 0)`.execute(db)

  // Mortality records
  await db.schema
    .createTable('mortality_records')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('batchId', 'uuid', (col) => col.notNull().references('batches.id').onDelete('cascade'))
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('cause', 'varchar(20)', (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE mortality_records ADD CONSTRAINT mortality_records_quantity_check CHECK (quantity > 0)`.execute(db)
  await sql`ALTER TABLE mortality_records ADD CONSTRAINT mortality_records_cause_check CHECK (cause IN ('disease', 'predator', 'weather', 'unknown', 'other'))`.execute(db)

  // Feed records
  await db.schema
    .createTable('feed_records')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('batchId', 'uuid', (col) => col.notNull().references('batches.id').onDelete('cascade'))
    .addColumn('feedType', 'varchar(20)', (col) => col.notNull())
    .addColumn('quantityKg', sql`decimal(10,2)`, (col) => col.notNull())
    .addColumn('cost', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('supplierId', 'uuid', (col) => col.references('suppliers.id'))
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE feed_records ADD CONSTRAINT feed_records_feed_type_check CHECK ("feedType" IN ('starter', 'grower', 'finisher', 'layer_mash', 'fish_feed'))`.execute(db)
  await sql`ALTER TABLE feed_records ADD CONSTRAINT feed_records_quantity_kg_check CHECK ("quantityKg" > 0)`.execute(db)
  await sql`ALTER TABLE feed_records ADD CONSTRAINT feed_records_cost_check CHECK (cost >= 0)`.execute(db)


  // Egg production records
  await db.schema
    .createTable('egg_records')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('batchId', 'uuid', (col) => col.notNull().references('batches.id').onDelete('cascade'))
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('quantityCollected', 'integer', (col) => col.notNull())
    .addColumn('quantityBroken', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('quantitySold', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE egg_records ADD CONSTRAINT egg_records_quantity_collected_check CHECK ("quantityCollected" >= 0)`.execute(db)
  await sql`ALTER TABLE egg_records ADD CONSTRAINT egg_records_quantity_broken_check CHECK ("quantityBroken" >= 0)`.execute(db)
  await sql`ALTER TABLE egg_records ADD CONSTRAINT egg_records_quantity_sold_check CHECK ("quantitySold" >= 0)`.execute(db)
  await sql`ALTER TABLE egg_records ADD CONSTRAINT valid_egg_quantities CHECK ("quantityBroken" + "quantitySold" <= "quantityCollected")`.execute(db)

  // Weight samples
  await db.schema
    .createTable('weight_samples')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('batchId', 'uuid', (col) => col.notNull().references('batches.id').onDelete('cascade'))
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('sampleSize', 'integer', (col) => col.notNull())
    .addColumn('averageWeightKg', sql`decimal(8,3)`, (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE weight_samples ADD CONSTRAINT weight_samples_sample_size_check CHECK ("sampleSize" > 0)`.execute(db)
  await sql`ALTER TABLE weight_samples ADD CONSTRAINT weight_samples_average_weight_kg_check CHECK ("averageWeightKg" > 0)`.execute(db)

  // Vaccinations
  await db.schema
    .createTable('vaccinations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('batchId', 'uuid', (col) => col.notNull().references('batches.id').onDelete('cascade'))
    .addColumn('vaccineName', 'varchar(255)', (col) => col.notNull())
    .addColumn('dateAdministered', 'date', (col) => col.notNull())
    .addColumn('dosage', 'varchar(100)', (col) => col.notNull())
    .addColumn('nextDueDate', 'date')
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  // Treatments
  await db.schema
    .createTable('treatments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('batchId', 'uuid', (col) => col.notNull().references('batches.id').onDelete('cascade'))
    .addColumn('medicationName', 'varchar(255)', (col) => col.notNull())
    .addColumn('reason', 'varchar(255)', (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('dosage', 'varchar(100)', (col) => col.notNull())
    .addColumn('withdrawalDays', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE treatments ADD CONSTRAINT treatments_withdrawal_days_check CHECK ("withdrawalDays" >= 0)`.execute(db)

  // Water quality records (for fishery)
  await db.schema
    .createTable('water_quality')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('batchId', 'uuid', (col) => col.notNull().references('batches.id').onDelete('cascade'))
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('ph', sql`decimal(4,2)`, (col) => col.notNull())
    .addColumn('temperatureCelsius', sql`decimal(5,2)`, (col) => col.notNull())
    .addColumn('dissolvedOxygenMgL', sql`decimal(6,2)`, (col) => col.notNull())
    .addColumn('ammoniaMgL', sql`decimal(6,3)`, (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE water_quality ADD CONSTRAINT water_quality_ph_check CHECK (ph >= 0 AND ph <= 14)`.execute(db)
  await sql`ALTER TABLE water_quality ADD CONSTRAINT water_quality_dissolved_oxygen_check CHECK ("dissolvedOxygenMgL" >= 0)`.execute(db)
  await sql`ALTER TABLE water_quality ADD CONSTRAINT water_quality_ammonia_check CHECK ("ammoniaMgL" >= 0)`.execute(db)


  // Sales records
  await db.schema
    .createTable('sales')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('farmId', 'uuid', (col) => col.notNull().references('farms.id').onDelete('cascade'))
    .addColumn('batchId', 'uuid', (col) => col.references('batches.id'))
    .addColumn('customerId', 'uuid', (col) => col.references('customers.id'))
    .addColumn('livestockType', 'varchar(10)', (col) => col.notNull())
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('unitPrice', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('totalAmount', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE sales ADD CONSTRAINT sales_livestock_type_check CHECK ("livestockType" IN ('poultry', 'fish', 'eggs'))`.execute(db)
  await sql`ALTER TABLE sales ADD CONSTRAINT sales_quantity_check CHECK (quantity > 0)`.execute(db)
  await sql`ALTER TABLE sales ADD CONSTRAINT sales_unit_price_check CHECK ("unitPrice" >= 0)`.execute(db)
  await sql`ALTER TABLE sales ADD CONSTRAINT sales_total_amount_check CHECK ("totalAmount" >= 0)`.execute(db)

  // Expense records
  await db.schema
    .createTable('expenses')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('farmId', 'uuid', (col) => col.notNull().references('farms.id').onDelete('cascade'))
    .addColumn('category', 'varchar(20)', (col) => col.notNull())
    .addColumn('amount', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('description', 'varchar(500)', (col) => col.notNull())
    .addColumn('supplierId', 'uuid', (col) => col.references('suppliers.id'))
    .addColumn('isRecurring', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE expenses ADD CONSTRAINT expenses_category_check CHECK (category IN ('feed', 'medicine', 'equipment', 'utilities', 'labor', 'transport', 'other'))`.execute(db)
  await sql`ALTER TABLE expenses ADD CONSTRAINT expenses_amount_check CHECK (amount >= 0)`.execute(db)

  // Invoices
  await db.schema
    .createTable('invoices')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('invoiceNumber', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('customerId', 'uuid', (col) => col.notNull().references('customers.id').onDelete('cascade'))
    .addColumn('farmId', 'uuid', (col) => col.notNull().references('farms.id').onDelete('cascade'))
    .addColumn('totalAmount', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('status', 'varchar(10)', (col) => col.notNull().defaultTo('unpaid'))
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('dueDate', 'date')
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('unpaid', 'partial', 'paid'))`.execute(db)
  await sql`ALTER TABLE invoices ADD CONSTRAINT invoices_total_amount_check CHECK ("totalAmount" >= 0)`.execute(db)

  // Invoice items
  await db.schema
    .createTable('invoice_items')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('invoiceId', 'uuid', (col) => col.notNull().references('invoices.id').onDelete('cascade'))
    .addColumn('description', 'varchar(255)', (col) => col.notNull())
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('unitPrice', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('total', sql`decimal(19,2)`, (col) => col.notNull())
    .execute()

  await sql`ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_quantity_check CHECK (quantity > 0)`.execute(db)
  await sql`ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_unit_price_check CHECK ("unitPrice" >= 0)`.execute(db)
  await sql`ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_total_check CHECK (total >= 0)`.execute(db)


  // Create indexes
  await db.schema.createIndex('idx_users_email').on('users').column('email').execute()
  await db.schema.createIndex('idx_sessions_user_id').on('sessions').column('userId').execute()
  await db.schema.createIndex('idx_sessions_expires_at').on('sessions').column('expiresAt').execute()
  await db.schema.createIndex('idx_sessions_token').on('sessions').column('token').execute()
  await db.schema.createIndex('idx_account_user_id').on('account').column('userId').execute()
  await db.schema.createIndex('idx_verification_identifier').on('verification').column('identifier').execute()
  await db.schema.createIndex('idx_user_farms_user_id').on('user_farms').column('userId').execute()
  await db.schema.createIndex('idx_user_farms_farm_id').on('user_farms').column('farmId').execute()
  await db.schema.createIndex('idx_batches_farm_id').on('batches').column('farmId').execute()
  await db.schema.createIndex('idx_batches_status').on('batches').column('status').execute()
  await db.schema.createIndex('idx_mortality_records_batch_id').on('mortality_records').column('batchId').execute()
  await db.schema.createIndex('idx_mortality_records_date').on('mortality_records').column('date').execute()
  await db.schema.createIndex('idx_feed_records_batch_id').on('feed_records').column('batchId').execute()
  await db.schema.createIndex('idx_feed_records_date').on('feed_records').column('date').execute()
  await db.schema.createIndex('idx_egg_records_batch_id').on('egg_records').column('batchId').execute()
  await db.schema.createIndex('idx_egg_records_date').on('egg_records').column('date').execute()
  await db.schema.createIndex('idx_weight_samples_batch_id').on('weight_samples').column('batchId').execute()
  await db.schema.createIndex('idx_weight_samples_date').on('weight_samples').column('date').execute()
  await db.schema.createIndex('idx_vaccinations_batch_id').on('vaccinations').column('batchId').execute()
  await db.schema.createIndex('idx_vaccinations_next_due_date').on('vaccinations').column('nextDueDate').execute()
  await db.schema.createIndex('idx_treatments_batch_id').on('treatments').column('batchId').execute()
  await db.schema.createIndex('idx_water_quality_batch_id').on('water_quality').column('batchId').execute()
  await db.schema.createIndex('idx_water_quality_date').on('water_quality').column('date').execute()
  await db.schema.createIndex('idx_sales_farm_id').on('sales').column('farmId').execute()
  await db.schema.createIndex('idx_sales_batch_id').on('sales').column('batchId').execute()
  await db.schema.createIndex('idx_sales_customer_id').on('sales').column('customerId').execute()
  await db.schema.createIndex('idx_sales_date').on('sales').column('date').execute()
  await db.schema.createIndex('idx_expenses_farm_id').on('expenses').column('farmId').execute()
  await db.schema.createIndex('idx_expenses_supplier_id').on('expenses').column('supplierId').execute()
  await db.schema.createIndex('idx_expenses_date').on('expenses').column('date').execute()
  await db.schema.createIndex('idx_invoices_customer_id').on('invoices').column('customerId').execute()
  await db.schema.createIndex('idx_invoices_farm_id').on('invoices').column('farmId').execute()
  await db.schema.createIndex('idx_invoices_date').on('invoices').column('date').execute()
  await db.schema.createIndex('idx_invoice_items_invoice_id').on('invoice_items').column('invoiceId').execute()

  // Create updated_at trigger function
  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql'
  `.execute(db)

  // Create triggers
  await sql`CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(db)
  await sql`CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(db)
  await sql`CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(db)
  await sql`CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(db)
  await sql`CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order of creation (respecting foreign keys)
  await db.schema.dropTable('invoice_items').ifExists().execute()
  await db.schema.dropTable('invoices').ifExists().execute()
  await db.schema.dropTable('expenses').ifExists().execute()
  await db.schema.dropTable('sales').ifExists().execute()
  await db.schema.dropTable('water_quality').ifExists().execute()
  await db.schema.dropTable('treatments').ifExists().execute()
  await db.schema.dropTable('vaccinations').ifExists().execute()
  await db.schema.dropTable('weight_samples').ifExists().execute()
  await db.schema.dropTable('egg_records').ifExists().execute()
  await db.schema.dropTable('feed_records').ifExists().execute()
  await db.schema.dropTable('mortality_records').ifExists().execute()
  await db.schema.dropTable('batches').ifExists().execute()
  await db.schema.dropTable('suppliers').ifExists().execute()
  await db.schema.dropTable('customers').ifExists().execute()
  await db.schema.dropTable('user_farms').ifExists().execute()
  await db.schema.dropTable('farms').ifExists().execute()
  await db.schema.dropTable('verification').ifExists().execute()
  await db.schema.dropTable('account').ifExists().execute()
  await db.schema.dropTable('sessions').ifExists().execute()
  await db.schema.dropTable('users').ifExists().execute()
  
  // Drop function
  await sql`DROP FUNCTION IF EXISTS update_updated_at_column()`.execute(db)
}
