import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Enable UUID extension
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.execute(db)

  // ============================================
  // 1. Core Auth & Users
  // ============================================
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    // Note: password is stored in the 'account' table, not here (Better Auth pattern)
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('role', 'varchar(10)', (col) => col.notNull().defaultTo('user'))
    .addColumn('emailVerified', 'boolean', (col) => col.defaultTo(false))
    .addColumn('image', 'text')
    // Admin plugin fields
    .addColumn('banned', 'boolean', (col) => col.defaultTo(false))
    .addColumn('banReason', 'text')
    .addColumn('banExpires', 'timestamptz')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'))`.execute(
    db,
  )

  // User Settings (Internationalization)
  await db.schema
    .createTable('user_settings')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('userId', 'uuid', (col) =>
      col.notNull().unique().references('users.id').onDelete('cascade'),
    )
    // Currency settings
    .addColumn('currencyCode', 'varchar(3)', (col) =>
      col.notNull().defaultTo('USD'),
    )
    .addColumn('currencySymbol', 'varchar(5)', (col) =>
      col.notNull().defaultTo('$'),
    )
    .addColumn('currencyDecimals', 'integer', (col) =>
      col.notNull().defaultTo(2),
    )
    .addColumn('currencySymbolPosition', 'varchar(10)', (col) =>
      col.notNull().defaultTo('before'),
    )
    .addColumn('thousandSeparator', 'varchar(1)', (col) =>
      col.notNull().defaultTo(','),
    )
    .addColumn('decimalSeparator', 'varchar(1)', (col) =>
      col.notNull().defaultTo('.'),
    )
    // Date/Time settings
    .addColumn('dateFormat', 'varchar(20)', (col) =>
      col.notNull().defaultTo('YYYY-MM-DD'),
    )
    .addColumn('timeFormat', 'varchar(5)', (col) =>
      col.notNull().defaultTo('24h'),
    )
    .addColumn('firstDayOfWeek', 'integer', (col) => col.notNull().defaultTo(1))
    // Unit settings
    .addColumn('weightUnit', 'varchar(5)', (col) =>
      col.notNull().defaultTo('kg'),
    )
    .addColumn('areaUnit', 'varchar(5)', (col) =>
      col.notNull().defaultTo('sqm'),
    )
    .addColumn('temperatureUnit', 'varchar(15)', (col) =>
      col.notNull().defaultTo('celsius'),
    )
    // Onboarding state
    .addColumn('onboardingCompleted', 'boolean', (col) => col.defaultTo(false))
    .addColumn('onboardingStep', 'integer', (col) => col.defaultTo(0))
    // Preferences
    .addColumn('defaultFarmId', 'uuid', (col) => col)
    .addColumn('language', 'varchar(10)', (col) =>
      col.notNull().defaultTo('en'),
    )
    .addColumn('theme', 'varchar(10)', (col) =>
      col.notNull().defaultTo('system'),
    )
    // Alerts
    .addColumn('lowStockThresholdPercent', 'integer', (col) =>
      col.notNull().defaultTo(10),
    )
    .addColumn('mortalityAlertPercent', 'integer', (col) =>
      col.notNull().defaultTo(5),
    )
    .addColumn('mortalityAlertQuantity', 'integer', (col) =>
      col.notNull().defaultTo(10),
    )
    .addColumn('notifications', 'jsonb', (col) =>
      col
        .notNull()
        .defaultTo(
          sql`'{"lowStock":true,"highMortality":true,"invoiceDue":true,"batchHarvest":true}'::jsonb`,
        ),
    )
    // Business
    .addColumn('defaultPaymentTermsDays', 'integer', (col) =>
      col.notNull().defaultTo(30),
    )
    .addColumn('fiscalYearStartMonth', 'integer', (col) =>
      col.notNull().defaultTo(1),
    )
    // Dashboard
    .addColumn('dashboardCards', 'jsonb', (col) =>
      col
        .notNull()
        .defaultTo(
          sql`'{"inventory":true,"revenue":true,"expenses":true,"profit":true,"mortality":true,"feed":true}'::jsonb`,
        ),
    )
    // Timestamps
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE user_settings ADD CONSTRAINT user_settings_symbol_position_check CHECK ("currencySymbolPosition" IN ('before', 'after'))`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT user_settings_date_format_check CHECK ("dateFormat" IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'))`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT user_settings_time_format_check CHECK ("timeFormat" IN ('12h', '24h'))`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT user_settings_weight_unit_check CHECK ("weightUnit" IN ('kg', 'lbs'))`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT user_settings_area_unit_check CHECK ("areaUnit" IN ('sqm', 'sqft'))`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT user_settings_temp_unit_check CHECK ("temperatureUnit" IN ('celsius', 'fahrenheit'))`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT language_check CHECK (language IN ('en', 'ha', 'yo', 'ig', 'fr', 'pt', 'sw'))`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT theme_check CHECK (theme IN ('light', 'dark', 'system'))`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT fiscal_month_check CHECK ("fiscalYearStartMonth" BETWEEN 1 AND 12)`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT low_stock_check CHECK ("lowStockThresholdPercent" BETWEEN 1 AND 100)`.execute(
    db,
  )
  await sql`ALTER TABLE user_settings ADD CONSTRAINT mortality_percent_check CHECK ("mortalityAlertPercent" BETWEEN 1 AND 100)`.execute(
    db,
  )

  await db.schema
    .createTable('sessions')
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('userId', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('expiresAt', 'timestamptz', (col) => col.notNull())
    .addColumn('token', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('ipAddress', 'varchar(255)')
    .addColumn('userAgent', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createTable('account')
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('userId', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
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

  await db.schema
    .createTable('verification')
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('identifier', 'varchar(255)', (col) => col.notNull())
    .addColumn('value', 'varchar(255)', (col) => col.notNull())
    .addColumn('expiresAt', 'timestamptz', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  // ============================================
  // 2. Core Entities (Farms, People)
  // ============================================
  await db.schema
    .createTable('farms')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('location', 'varchar(255)', (col) => col.notNull())
    .addColumn('type', 'varchar(20)', (col) => col.notNull())
    .addColumn('contactPhone', 'varchar(50)')
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('deletedAt', 'timestamptz')
    .execute()

  await sql`ALTER TABLE farms ADD CONSTRAINT farms_type_check CHECK (type IN ('poultry', 'aquaculture', 'mixed', 'cattle', 'goats', 'sheep', 'bees', 'multi'))`.execute(
    db,
  )

  // Add foreign key for user_settings.defaultFarmId now that farms table exists
  await db.schema
    .alterTable('user_settings')
    .addForeignKeyConstraint(
      'user_settings_default_farm_fk',
      ['defaultFarmId'],
      'farms',
      ['id'],
      (cb) => cb.onDelete('set null'),
    )
    .execute()

  await db.schema
    .createTable('user_farms')
    .addColumn('userId', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('role', 'varchar(20)', (col) => col.notNull().defaultTo('owner'))
    .addPrimaryKeyConstraint('user_farms_pkey', ['userId', 'farmId'])
    .execute()

  await sql`ALTER TABLE user_farms ADD CONSTRAINT user_farms_role_check CHECK (role IN ('owner', 'manager', 'viewer'))`.execute(
    db,
  )

  await db.schema
    .createTable('farm_modules')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('moduleKey', 'varchar(20)', (col) => col.notNull())
    .addColumn('enabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addUniqueConstraint('farm_modules_farm_module_unique', [
      'farmId',
      'moduleKey',
    ])
    .execute()

  await sql`ALTER TABLE farm_modules ADD CONSTRAINT farm_modules_key_check CHECK ("moduleKey" IN ('poultry', 'aquaculture', 'cattle', 'goats', 'sheep', 'bees'))`.execute(
    db,
  )

  await db.schema
    .createTable('customers')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('phone', 'varchar(50)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)')
    .addColumn('location', 'varchar(255)')
    .addColumn('customerType', 'varchar(20)')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('deletedAt', 'timestamptz')
    .execute()

  await sql`ALTER TABLE customers ADD CONSTRAINT customers_type_check CHECK ("customerType" IS NULL OR "customerType" IN ('individual', 'restaurant', 'retailer', 'wholesaler', 'processor', 'exporter', 'government'))`.execute(
    db,
  )

  // Add index for customers farmId
  await db.schema
    .createIndex('idx_customers_farm_id')
    .on('customers')
    .column('farmId')
    .execute()

  await db.schema
    .createTable('suppliers')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('phone', 'varchar(50)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)')
    .addColumn('location', 'varchar(255)')
    .addColumn('products', sql`text[]`, (col) =>
      col.notNull().defaultTo(sql`'{}'`),
    )
    .addColumn('supplierType', 'varchar(20)')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('deletedAt', 'timestamptz')
    .execute()

  await sql`ALTER TABLE suppliers ADD CONSTRAINT suppliers_type_check CHECK ("supplierType" IS NULL OR "supplierType" IN ('hatchery', 'feed_mill', 'pharmacy', 'equipment', 'fingerlings', 'cattle_dealer', 'goat_dealer', 'sheep_dealer', 'bee_supplier', 'other'))`.execute(
    db,
  )

  // ============================================
  // 3. Infrastructure & Inventory
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
    .addColumn('status', 'varchar(20)', (col) =>
      col.notNull().defaultTo('active'),
    )
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE structures ADD CONSTRAINT structures_type_check CHECK (type IN ('house', 'pond', 'pen', 'cage', 'barn', 'pasture', 'hive', 'milking_parlor', 'shearing_shed', 'tank', 'tarpaulin', 'raceway', 'feedlot', 'kraal'))`.execute(
    db,
  )
  await sql`ALTER TABLE structures ADD CONSTRAINT structures_status_check CHECK (status IN ('active', 'empty', 'maintenance'))`.execute(
    db,
  )

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

  await sql`ALTER TABLE medication_inventory ADD CONSTRAINT medication_inventory_unit_check CHECK (unit IN ('vial', 'bottle', 'sachet', 'ml', 'g', 'tablet', 'kg', 'liter'))`.execute(
    db,
  )

  await db.schema
    .createTable('feed_inventory')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('feedType', 'varchar(20)', (col) => col.notNull())
    .addColumn('quantityKg', sql`decimal(10,2)`, (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('minThresholdKg', sql`decimal(10,2)`, (col) =>
      col.notNull().defaultTo(10),
    )
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE feed_inventory ADD CONSTRAINT feed_inventory_feed_type_check CHECK ("feedType" IN ('starter', 'grower', 'finisher', 'layer_mash', 'fish_feed', 'cattle_feed', 'goat_feed', 'sheep_feed', 'hay', 'silage', 'bee_feed'))`.execute(
    db,
  )

  // ============================================
  // 4. Batches & Production
  // ============================================
  await db.schema
    .createTable('batches')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('livestockType', 'varchar(20)', (col) => col.notNull())
    .addColumn('species', 'varchar(100)', (col) => col.notNull())
    .addColumn('initialQuantity', 'integer', (col) => col.notNull())
    .addColumn('currentQuantity', 'integer', (col) => col.notNull())
    .addColumn('acquisitionDate', 'date', (col) => col.notNull())
    .addColumn('costPerUnit', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('totalCost', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('status', 'varchar(10)', (col) =>
      col.notNull().defaultTo('active'),
    )
    .addColumn('batchName', 'varchar(100)')
    .addColumn('deletedAt', 'timestamptz')
    .addColumn('supplierId', 'uuid', (col) => col.references('suppliers.id'))
    .addColumn('sourceSize', 'varchar(50)')
    .addColumn('structureId', 'uuid', (col) => col.references('structures.id'))
    .addColumn('targetHarvestDate', 'date')
    .addColumn('target_weight_g', 'integer') // Forecasting
    .addColumn('targetPricePerUnit', sql`decimal(19,2)`) // User's expected sale price
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE batches ADD CONSTRAINT batches_livestock_type_check CHECK ("livestockType" IN ('poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees'))`.execute(
    db,
  )
  await sql`ALTER TABLE batches ADD CONSTRAINT batches_status_check CHECK (status IN ('active', 'depleted', 'sold'))`.execute(
    db,
  )
  await sql`ALTER TABLE batches ADD CONSTRAINT batches_initial_quantity_check CHECK ("initialQuantity" > 0)`.execute(
    db,
  )
  await sql`ALTER TABLE batches ADD CONSTRAINT batches_current_quantity_check CHECK ("currentQuantity" >= 0)`.execute(
    db,
  )

  await db.schema
    .createTable('mortality_records')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('batchId', 'uuid', (col) =>
      col.notNull().references('batches.id').onDelete('cascade'),
    )
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('cause', 'varchar(20)', (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE mortality_records ADD CONSTRAINT mortality_records_quantity_check CHECK (quantity > 0)`.execute(
    db,
  )
  await sql`ALTER TABLE mortality_records ADD CONSTRAINT mortality_records_cause_check CHECK (cause IN ('disease', 'predator', 'weather', 'unknown', 'other', 'starvation', 'injury', 'poisoning', 'suffocation', 'culling'))`.execute(
    db,
  )

  await db.schema
    .createTable('feed_records')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('batchId', 'uuid', (col) =>
      col.notNull().references('batches.id').onDelete('cascade'),
    )
    .addColumn('feedType', 'varchar(20)', (col) => col.notNull())
    .addColumn('quantityKg', sql`decimal(10,2)`, (col) => col.notNull())
    .addColumn('cost', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('supplierId', 'uuid', (col) => col.references('suppliers.id'))
    .addColumn('inventoryId', 'uuid', (col) =>
      col.references('feed_inventory.id').onDelete('set null'),
    ) // Optional link to inventory for auto-deduction
    .addColumn('brandName', 'varchar(100)')
    .addColumn('bagSizeKg', 'integer')
    .addColumn('numberOfBags', 'integer')
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE feed_records ADD CONSTRAINT feed_records_feed_type_check CHECK ("feedType" IN ('starter', 'grower', 'finisher', 'layer_mash', 'fish_feed', 'cattle_feed', 'goat_feed', 'sheep_feed', 'hay', 'silage', 'bee_feed'))`.execute(
    db,
  )

  await db.schema
    .createTable('egg_records')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('batchId', 'uuid', (col) =>
      col.notNull().references('batches.id').onDelete('cascade'),
    )
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('quantityCollected', 'integer', (col) => col.notNull())
    .addColumn('quantityBroken', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('quantitySold', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE egg_records ADD CONSTRAINT valid_egg_quantities CHECK ("quantityBroken" + "quantitySold" <= "quantityCollected")`.execute(
    db,
  )

  await db.schema
    .createTable('weight_samples')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('batchId', 'uuid', (col) =>
      col.notNull().references('batches.id').onDelete('cascade'),
    )
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('sampleSize', 'integer', (col) => col.notNull())
    .addColumn('averageWeightKg', sql`decimal(8,3)`, (col) => col.notNull())
    .addColumn('minWeightKg', sql`decimal(8,3)`)
    .addColumn('maxWeightKg', sql`decimal(8,3)`)
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createTable('water_quality')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('batchId', 'uuid', (col) =>
      col.notNull().references('batches.id').onDelete('cascade'),
    )
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('ph', sql`decimal(4,2)`, (col) => col.notNull())
    .addColumn('temperatureCelsius', sql`decimal(5,2)`, (col) => col.notNull())
    .addColumn('dissolvedOxygenMgL', sql`decimal(6,2)`, (col) => col.notNull())
    .addColumn('ammoniaMgL', sql`decimal(6,3)`, (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createTable('vaccinations')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('batchId', 'uuid', (col) =>
      col.notNull().references('batches.id').onDelete('cascade'),
    )
    .addColumn('vaccineName', 'varchar(255)', (col) => col.notNull())
    .addColumn('dateAdministered', 'date', (col) => col.notNull())
    .addColumn('dosage', 'varchar(100)', (col) => col.notNull())
    .addColumn('nextDueDate', 'date')
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createTable('treatments')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('batchId', 'uuid', (col) =>
      col.notNull().references('batches.id').onDelete('cascade'),
    )
    .addColumn('medicationName', 'varchar(255)', (col) => col.notNull())
    .addColumn('reason', 'varchar(255)', (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('dosage', 'varchar(100)', (col) => col.notNull())
    .addColumn('withdrawalDays', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  // ============================================
  // 5. Finance
  // ============================================
  await db.schema
    .createTable('invoices')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('invoiceNumber', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('customerId', 'uuid', (col) =>
      col.notNull().references('customers.id').onDelete('cascade'),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('totalAmount', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('status', 'varchar(10)', (col) =>
      col.notNull().defaultTo('unpaid'),
    )
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('dueDate', 'date')
    .addColumn('paidDate', 'date')
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('unpaid', 'partial', 'paid'))`.execute(
    db,
  )

  await db.schema
    .createTable('invoice_items')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('invoiceId', 'uuid', (col) =>
      col.notNull().references('invoices.id').onDelete('cascade'),
    )
    .addColumn('description', 'varchar(255)', (col) => col.notNull())
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('unitPrice', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('total', sql`decimal(19,2)`, (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('sales')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('batchId', 'uuid', (col) =>
      col.references('batches.id').onDelete('cascade'),
    )
    .addColumn('customerId', 'uuid', (col) => col.references('customers.id'))
    .addColumn('livestockType', 'varchar(20)', (col) => col.notNull())
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('unitPrice', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('totalAmount', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('ageWeeks', 'integer')
    .addColumn('averageWeightKg', sql`decimal(8,3)`)
    .addColumn('unitType', 'varchar(20)')
    .addColumn('paymentStatus', 'varchar(20)', (col) => col.defaultTo('paid'))
    .addColumn('paymentMethod', 'varchar(20)')
    .addColumn('invoiceId', 'uuid', (col) => col.references('invoices.id'))
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE sales ADD CONSTRAINT sales_livestock_type_check CHECK ("livestockType" IN ('poultry', 'fish', 'eggs', 'cattle', 'goats', 'sheep', 'honey', 'milk', 'wool', 'beeswax', 'propolis', 'royal_jelly', 'manure'))`.execute(
    db,
  )
  await sql`ALTER TABLE sales ADD CONSTRAINT sales_unit_type_check CHECK ("unitType" IS NULL OR "unitType" IN ('bird', 'kg', 'crate', 'piece', 'liter', 'head', 'colony', 'fleece'))`.execute(
    db,
  )
  await sql`ALTER TABLE sales ADD CONSTRAINT sales_payment_status_check CHECK ("paymentStatus" IS NULL OR "paymentStatus" IN ('paid', 'pending', 'partial'))`.execute(
    db,
  )
  await sql`ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check CHECK ("paymentMethod" IS NULL OR "paymentMethod" IN ('cash', 'transfer', 'credit', 'mobile_money', 'check', 'card'))`.execute(
    db,
  )

  await db.schema
    .createTable('expenses')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('batchId', 'uuid', (col) =>
      col.references('batches.id').onDelete('set null'),
    )
    .addColumn('category', 'varchar(30)', (col) => col.notNull())
    .addColumn('amount', sql`decimal(19,2)`, (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('description', 'varchar(500)', (col) => col.notNull())
    .addColumn('supplierId', 'uuid', (col) => col.references('suppliers.id'))
    .addColumn('isRecurring', 'boolean', (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE expenses ADD CONSTRAINT expenses_category_check CHECK (category IN ('feed', 'medicine', 'equipment', 'utilities', 'labor', 'transport', 'livestock', 'livestock_chicken', 'livestock_fish', 'livestock_cattle', 'livestock_goats', 'livestock_sheep', 'livestock_bees', 'maintenance', 'marketing', 'insurance', 'veterinary', 'other'))`.execute(
    db,
  )

  // ============================================
  // 6. Logs & Forecasting
  // ============================================
  await db.schema
    .createTable('audit_logs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('userId', 'uuid', (col) =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('userName', 'varchar(255)') // Preserved even if user deleted
    .addColumn('action', 'varchar(50)', (col) => col.notNull())
    .addColumn('entityType', 'varchar(50)', (col) => col.notNull())
    .addColumn('entityId', 'text', (col) => col.notNull())
    .addColumn('details', 'jsonb')
    .addColumn('ipAddress', 'varchar(45)')
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute()

  await db.schema
    .createTable('market_prices')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('species', 'varchar', (col) => col.notNull())
    .addColumn('size_category', 'varchar', (col) => col.notNull())
    .addColumn('price_per_unit', 'decimal', (col) => col.notNull())
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute()

  await db.schema
    .createTable('growth_standards')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('species', 'varchar', (col) => col.notNull())
    .addColumn('day', 'integer', (col) => col.notNull())
    .addColumn('expected_weight_g', 'integer', (col) => col.notNull())
    .addUniqueConstraint('growth_standards_species_day_unique', [
      'species',
      'day',
    ])
    .execute()

  // Notifications table
  await db.schema
    .createTable('notifications')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('userId', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.references('farms.id').onDelete('cascade'),
    )
    .addColumn('type', 'varchar(50)', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('message', 'text', (col) => col.notNull())
    .addColumn('read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('actionUrl', 'text')
    .addColumn('metadata', 'jsonb')
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  // ============================================
  // 7. Indexes & Triggers
  // ============================================
  // (Indices omitted for brevity but should be here? The file content I'm writing needs to be complete.)
  // I will add the key indexes back to ensure performance.

  await db.schema
    .createIndex('idx_users_email')
    .on('users')
    .column('email')
    .execute()
  await db.schema
    .createIndex('idx_sessions_user_id')
    .on('sessions')
    .column('userId')
    .execute()

  await db.schema
    .createIndex('idx_farms_deleted_at')
    .on('farms')
    .column('deletedAt')
    .execute()

  await db.schema
    .createIndex('idx_farm_modules_farm_id')
    .on('farm_modules')
    .column('farmId')
    .execute()
  await db.schema
    .createIndex('idx_user_farms_user_id')
    .on('user_farms')
    .column('userId')
    .execute()
  await db.schema
    .createIndex('idx_user_farms_farm_id')
    .on('user_farms')
    .column('farmId')
    .execute()

  await db.schema
    .createIndex('idx_batches_status')
    .on('batches')
    .column('status')
    .execute()

  await db.schema
    .createIndex('idx_batches_deleted_at')
    .on('batches')
    .column('deletedAt')
    .execute()

  await db.schema
    .createIndex('idx_customers_deleted_at')
    .on('customers')
    .column('deletedAt')
    .execute()

  await db.schema
    .createIndex('idx_suppliers_deleted_at')
    .on('suppliers')
    .column('deletedAt')
    .execute()

  // ============================================
  // 8. Tasks & Checklists
  // ============================================
  await db.schema
    .createTable('tasks')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('farmId', 'uuid', (col) =>
      col.notNull().references('farms.id').onDelete('cascade'),
    )
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('frequency', 'varchar(10)', (col) => col.notNull())
    .addColumn('isDefault', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute()

  await sql`ALTER TABLE tasks ADD CONSTRAINT tasks_frequency_check CHECK (frequency IN ('daily', 'weekly', 'monthly'))`.execute(
    db,
  )

  await db.schema
    .createIndex('idx_tasks_farm_id')
    .on('tasks')
    .column('farmId')
    .execute()

  await db.schema
    .createTable('task_completions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('taskId', 'uuid', (col) =>
      col.notNull().references('tasks.id').onDelete('cascade'),
    )
    .addColumn('userId', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('completedAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('periodStart', 'date', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('idx_task_completions_unique')
    .on('task_completions')
    .columns(['taskId', 'userId', 'periodStart'])
    .unique()
    .execute()

  await db.schema
    .createIndex('idx_task_completions_task_id')
    .on('task_completions')
    .column('taskId')
    .execute()
  await db.schema
    .createIndex('idx_batches_structure_id')
    .on('batches')
    .column('structureId')
    .execute()

  await db.schema
    .createIndex('idx_feed_records_batch_id')
    .on('feed_records')
    .column('batchId')
    .execute()
  await db.schema
    .createIndex('idx_mortality_records_batch_id')
    .on('mortality_records')
    .column('batchId')
    .execute()
  await db.schema
    .createIndex('idx_sales_farm_id')
    .on('sales')
    .column('farmId')
    .execute()
  await db.schema
    .createIndex('idx_sales_batch_id')
    .on('sales')
    .column('batchId')
    .execute()

  await db.schema
    .createIndex('audit_logs_entity_idx')
    .on('audit_logs')
    .columns(['entityType', 'entityId'])
    .execute()
  await db.schema
    .createIndex('audit_logs_user_idx')
    .on('audit_logs')
    .column('userId')
    .execute()

  await db.schema
    .createIndex('notifications_user_id_idx')
    .on('notifications')
    .column('userId')
    .execute()
  await db.schema
    .createIndex('notifications_read_idx')
    .on('notifications')
    .column('read')
    .execute()

  // Performance indexes for common query patterns
  await db.schema
    .createIndex('idx_batches_farm_status')
    .on('batches')
    .columns(['farmId', 'status'])
    .execute()

  await db.schema
    .createIndex('idx_sales_farm_date')
    .on('sales')
    .columns(['farmId', 'date'])
    .execute()

  await db.schema
    .createIndex('idx_expenses_farm_date')
    .on('expenses')
    .columns(['farmId', 'date'])
    .execute()

  await db.schema
    .createIndex('idx_feed_records_batch_date')
    .on('feed_records')
    .columns(['batchId', 'date'])
    .execute()

  await db.schema
    .createIndex('idx_mortality_records_batch_date')
    .on('mortality_records')
    .columns(['batchId', 'date'])
    .execute()

  await db.schema
    .createIndex('idx_notifications_user_read')
    .on('notifications')
    .columns(['userId', 'read'])
    .execute()

  await db.schema
    .createIndex('idx_weight_samples_batch_date')
    .on('weight_samples')
    .columns(['batchId', 'date'])
    .execute()

  await db.schema
    .createIndex('idx_egg_records_batch_date')
    .on('egg_records')
    .columns(['batchId', 'date'])
    .execute()

  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql'
  `.execute(db)

  await sql`CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(
    db,
  )
  await sql`CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(
    db,
  )
  await sql`CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(
    db,
  )
  await sql`CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(
    db,
  )
  await sql`CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(
    db,
  )
  await sql`CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`.execute(
    db,
  )

  // Report Configurations
  await db.schema
    .createTable('report_configs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn('createdBy', 'uuid', (col) => col.notNull())
    .addColumn('farmId', 'uuid', (col) => col.notNull())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('reportType', 'varchar(50)', (col) => col.notNull())
    .addColumn('dateRangeType', 'varchar(20)', (col) => col.notNull())
    .addColumn('customStartDate', 'timestamp')
    .addColumn('customEndDate', 'timestamp')
    .addColumn('includeCharts', 'boolean', (col) =>
      col.notNull().defaultTo(true),
    )
    .addColumn('includeDetails', 'boolean', (col) =>
      col.notNull().defaultTo(true),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addForeignKeyConstraint('report_configs_farmId_fk', ['farmId'], 'farms', [
      'id',
    ])
    .addForeignKeyConstraint(
      'report_configs_createdBy_fk',
      ['createdBy'],
      'users',
      ['id'],
    )
    .execute()

  await sql`ALTER TABLE report_configs ADD CONSTRAINT report_configs_report_type_check CHECK ("reportType" IN ('profit_loss', 'inventory', 'sales', 'feed', 'egg'))`.execute(
    db,
  )

  await sql`ALTER TABLE report_configs ADD CONSTRAINT report_configs_date_range_type_check CHECK ("dateRangeType" IN ('today', 'week', 'month', 'quarter', 'year', 'custom'))`.execute(
    db,
  )

  await db.schema
    .createIndex('report_configs_farmId_idx')
    .on('report_configs')
    .column('farmId')
    .execute()

  // Additional indexes for improved query performance
  await db.schema
    .createIndex('idx_batches_livestock_type')
    .on('batches')
    .column('livestockType')
    .execute()

  await db.schema
    .createIndex('idx_sales_livestock_type')
    .on('sales')
    .column('livestockType')
    .execute()

  await db.schema
    .createIndex('idx_expenses_category')
    .on('expenses')
    .column('category')
    .execute()

  await db.schema
    .createIndex('idx_batches_acquisition_date')
    .on('batches')
    .column('acquisitionDate')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes first
  await db.schema.dropIndex('idx_batches_acquisition_date').ifExists().execute()
  await db.schema.dropIndex('idx_expenses_category').ifExists().execute()
  await db.schema.dropIndex('idx_sales_livestock_type').ifExists().execute()
  await db.schema.dropIndex('idx_batches_livestock_type').ifExists().execute()

  await sql`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`.execute(
    db,
  )

  // Drop all tables
  const tables = [
    'report_configs',
    'growth_standards',
    'market_prices',
    'audit_logs',
    'invoice_items',
    'invoices',
    'expenses',
    'sales',
    'water_quality',
    'treatments',
    'vaccinations',
    'weight_samples',
    'egg_records',
    'feed_records',
    'mortality_records',
    'batches',
    'medication_inventory',
    'feed_inventory',
    'structures',
    'farm_modules',
    'user_farms',
    'suppliers',
    'customers',
    'notifications',
    'task_completions',
    'tasks',
    'farms',
    'user_settings',
    'verification',
    'account',
    'sessions',
    'users',
  ]

  for (const table of tables) {
    await db.schema.dropTable(table).ifExists().execute()
  }
}
