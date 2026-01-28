import type { Generated } from 'kysely'

// Database interface for Kysely
// Note: Column names use camelCase to match Better Auth expectations
/**
 * Database schema interface for Kysely ORM.
 * Defines all tables and their structures for the OpenLivestock platform.
 */
export interface Database {
    /** System users and their core profile data */
    users: UserTable
    /** User-specific preferences for currency, units, etc. */
    user_settings: UserSettingsTable
    /** Authentication sessions */
    sessions: SessionTable
    /** OAuth and credential account links */
    account: AccountTable
    /** Email and phone verification tokens */
    verification: VerificationTable
    /** Farm definitions */
    farms: FarmTable
    /** Enabled modules for each farm */
    farm_modules: FarmModuleTable
    /** Junction table linking users to farms with roles */
    user_farms: UserFarmTable
    /** Farm structures (houses, ponds, etc.) */
    structures: StructureTable
    /** Livestock breeds reference data */
    breeds: BreedTable
    /** User requests for missing breeds */
    breed_requests: BreedRequestTable
    /** Feed ingredients master data */
    feed_ingredients: FeedIngredientTable
    /** Nutritional requirements by species and stage */
    nutritional_requirements: NutritionalRequirementTable
    /** User-specific ingredient prices with history */
    user_ingredient_prices: UserIngredientPriceTable
    /** Saved feed formulations */
    saved_formulations: SavedFormulationTable
    /** Formulation usage tracking */
    formulation_usage: FormulationUsageTable
    /** Livestock batch definitions */
    batches: BatchTable
    /** Records of livestock mortality events */
    mortality_records: MortalityTable
    /** Records of feeding events */
    feed_records: FeedTable
    /** Records of egg collection and sales */
    egg_records: EggTable
    /** Periodic weight sampling records */
    weight_samples: WeightTable
    /** Vaccination schedule and records */
    vaccinations: VaccinationTable
    /** Medical treatment records */
    treatments: TreatmentTable
    /** Water parameters (pH, temperature, DO) */
    water_quality: WaterQualityTable
    /** Sales transactions */
    sales: SaleTable
    /** Farm expenses */
    expenses: ExpenseTable
    /** Customer contacts */
    customers: CustomerTable
    /** Supplier contacts */
    suppliers: SupplierTable
    /** Sales invoices */
    invoices: InvoiceTable
    /** Invoice line items */
    invoice_items: InvoiceItemTable
    /** Feed inventory tracking */
    feed_inventory: FeedInventoryTable
    /** Medication inventory tracking */
    medication_inventory: MedicationInventoryTable
    /** System audit logs */
    audit_logs: AuditLogTable
    /** Expected growth standards by species */
    growth_standards: GrowthStandardTable
    /** Current market prices by species */
    market_prices: MarketPriceTable
    /** User notifications */
    notifications: NotificationTable
    /** Farm tasks (checklists) */
    tasks: TaskTable
    /** Task completion records */
    task_completions: TaskCompletionTable
    /** Saved report configurations */
    report_configs: ReportConfigTable
    /** Credit reports for farmers */
    credit_reports: CreditReportTable
    /** Report access requests */
    report_requests: ReportRequestTable
    /** Report access audit logs */
    report_access_logs: ReportAccessLogTable
    // Digital Foreman tables
    /** Worker employment profiles */
    worker_profiles: WorkerProfileTable
    /** Farm geofence configurations */
    farm_geofences: FarmGeofenceTable
    /** Worker attendance check-ins */
    worker_check_ins: WorkerCheckInTable
    /** Task assignments to workers */
    task_assignments: TaskAssignmentTable
    /** Photo proof for task completions */
    task_photos: TaskPhotoTable
    /** Payroll period definitions */
    payroll_periods: PayrollPeriodTable
    /** Wage payment records */
    wage_payments: WagePaymentTable
    // IoT Sensor tables
    /** IoT sensors for environmental monitoring */
    sensors: SensorTable
    /** Time-series sensor readings */
    sensor_readings: SensorReadingTable
    /** Aggregated sensor data (hourly/daily) */
    sensor_aggregates: SensorAggregateTable
    /** Sensor alert history */
    sensor_alerts: SensorAlertTable
    /** Per-sensor alert configuration */
    sensor_alert_config: SensorAlertConfigTable
    // Offline Marketplace tables
    /** Marketplace listings for livestock sales */
    marketplace_listings: MarketplaceListingTable
    /** Contact requests from buyers to sellers */
    listing_contact_requests: ListingContactRequestTable
    /** Listing view tracking for analytics */
    listing_views: ListingViewTable
    // Extension Worker Mode tables
    /** Countries with ISO codes */
    countries: CountryTable
    /** Geographic regions (State/Province -> District) */
    regions: RegionTable
    /** Extension worker district assignments */
    user_districts: UserDistrictTable
    /** Access requests from extension workers */
    access_requests: AccessRequestTable
    /** Time-limited access grants */
    access_grants: AccessGrantTable
    /** Species-specific mortality thresholds */
    species_thresholds: SpeciesThresholdTable
    /** Extension worker visit records */
    visit_records: VisitRecordTable
    /** Outbreak alerts for disease monitoring */
    outbreak_alerts: OutbreakAlertTable
    /** Junction table for farms affected by outbreak alerts */
    outbreak_alert_farms: OutbreakAlertFarmTable
}

// User & Auth - Better Auth tables use camelCase
// Note: Passwords are stored in the 'account' table, not here (Better Auth pattern)
export interface UserTable {
    id: Generated<string>
    email: string
    // password field removed - Better Auth stores passwords in account table
    name: string
    role: 'admin' | 'user'
    emailVerified: Generated<boolean>
    image: string | null // PRIVATE storage - user avatar URL
    // Admin plugin fields
    banned: Generated<boolean>
    banReason: string | null
    banExpires: Date | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

// User Settings (Internationalization)
/**
 * User-specific preferences for currency, units, language, and alerts.
 */
export interface UserSettingsTable {
    /** Unique settings identifier */
    id: Generated<string>
    /** User these settings belong to */
    userId: string

    // Currency settings
    /** ISO 4217 currency code (USD, EUR, NGN, etc.) */
    currencyCode: string
    /** Currency symbol ($ , €, ₦, etc.) */
    currencySymbol: string
    /** Number of decimals to display for currency */
    currencyDecimals: number
    /** Position of the currency symbol */
    currencySymbolPosition: 'before' | 'after'
    /** Character used for thousands separator */
    thousandSeparator: string
    /** Character used for decimal separator */
    decimalSeparator: string

    // Date/Time settings
    /** Date format preference */
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    /** Time format preference */
    timeFormat: '12h' | '24h'
    /** Day the week starts on (0=Sunday, 1=Monday) */
    firstDayOfWeek: number

    // Unit settings
    /** Unit for weight measurements */
    weightUnit: 'kg' | 'lbs'
    /** Unit for area measurements */
    areaUnit: 'sqm' | 'sqft'
    /** Unit for temperature measurements */
    temperatureUnit: 'celsius' | 'fahrenheit'

    // Preferences
    /** Default farm to load on login */
    defaultFarmId: string | null
    /** UI language code */
    language:
        | 'en'
        | 'ha'
        | 'yo'
        | 'ig'
        | 'fr'
        | 'pt'
        | 'sw'
        | 'es'
        | 'hi'
        | 'tr'
        | 'id'
        | 'bn'
        | 'th'
        | 'vi'
        | 'am'
    /** UI theme preference */
    theme: 'light' | 'dark' | 'system'

    // Alerts
    /** Threshold percentage for low stock alerts */
    lowStockThresholdPercent: number
    /** Threshold percentage for mortality alerts */
    mortalityAlertPercent: number
    /** Minimum absolute quantity for mortality alerts */
    mortalityAlertQuantity: number
    /** Enabled/disabled status for specific notification types */
    notifications: {
        lowStock: boolean
        highMortality: boolean
        invoiceDue: boolean
        batchHarvest: boolean
        vaccinationDue?: boolean
        medicationExpiry?: boolean
        waterQualityAlert?: boolean
        weeklySummary?: boolean
        dailySales?: boolean
        batchPerformance?: boolean
        paymentReceived?: boolean
    }

    // Business
    /** Default payment term in days for new invoices */
    defaultPaymentTermsDays: number
    /** Starting month of the fiscal year (1-12) */
    fiscalYearStartMonth: number

    // Dashboard
    /** Visibility of dashboard cards */
    dashboardCards: {
        inventory: boolean
        revenue: boolean
        expenses: boolean
        profit: boolean
        mortality: boolean
        feed: boolean
    }

    // Onboarding state
    /** Whether the user has completed onboarding */
    onboardingCompleted: Generated<boolean>
    /** Current step in the onboarding process */
    onboardingStep: Generated<number>

    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

export interface SessionTable {
    id: string
    userId: string
    expiresAt: Date
    token: string
    ipAddress: string | null
    userAgent: string | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

export interface AccountTable {
    id: string
    userId: string
    accountId: string
    providerId: string
    accessToken: string | null
    refreshToken: string | null
    accessTokenExpiresAt: Date | null
    refreshTokenExpiresAt: Date | null
    scope: string | null
    idToken: string | null
    password: string | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

export interface VerificationTable {
    id: string
    identifier: string
    value: string
    expiresAt: Date
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

// Farm
export interface FarmTable {
    id: Generated<string>
    name: string
    location: string
    type:
        | 'poultry'
        | 'aquaculture'
        | 'mixed'
        | 'cattle'
        | 'goats'
        | 'sheep'
        | 'bees'
        | 'multi'
    contactPhone: string | null
    notes: string | null
    districtId: string | null // Extension Worker Mode
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
    deletedAt: Date | null
}

export interface FarmModuleTable {
    id: Generated<string>
    farmId: string
    moduleKey: 'poultry' | 'aquaculture' | 'cattle' | 'goats' | 'sheep' | 'bees'
    enabled: Generated<boolean>
    createdAt: Generated<Date>
}

export interface UserFarmTable {
    userId: string
    farmId: string
    role: FarmRole
}

export type FarmRole = 'owner' | 'manager' | 'viewer' | 'worker' | 'observer'

// Structures (Houses, Ponds, Pens)
export interface StructureTable {
    id: Generated<string>
    farmId: string
    name: string // "House A", "Pond 1", "Pen 3"
    type:
        | 'house'
        | 'pond'
        | 'pen'
        | 'cage'
        | 'barn'
        | 'pasture'
        | 'hive'
        | 'milking_parlor'
        | 'shearing_shed'
        | 'tank' // Concrete/plastic tanks
        | 'tarpaulin' // Tarpaulin ponds (popular in Nigeria)
        | 'raceway' // Flow-through systems
        | 'feedlot' // Intensive feeding area
        | 'kraal' // Traditional African livestock enclosure
    capacity: number | null // Max animals
    areaSqm: string | null // DECIMAL(10,2) - Size in square meters
    status: 'active' | 'empty' | 'maintenance'
    notes: string | null
    photos: Array<string> | null // PUBLIC storage - array of photo URLs
    createdAt: Generated<Date>
}

// Livestock Breeds
export interface BreedTable {
    id: Generated<string>
    moduleKey: 'poultry' | 'aquaculture' | 'cattle' | 'goats' | 'sheep' | 'bees'
    speciesKey: string
    breedName: string
    displayName: string
    typicalMarketWeightG: number
    typicalDaysToMarket: number
    typicalFcr: string // DECIMAL(4,2)
    sourceSizes: Array<string> // JSONB
    regions: Array<string> // JSONB
    isDefault: Generated<boolean>
    isActive: Generated<boolean>
    createdAt: Generated<Date>
}

// Breed Requests
export interface BreedRequestTable {
    id: Generated<string>
    userId: string
    moduleKey: string
    speciesKey: string
    breedName: string
    typicalMarketWeightG: number | null
    typicalDaysToMarket: number | null
    typicalFcr: string | null // DECIMAL(4,2)
    source: string | null
    userEmail: string | null
    notes: string | null
    photoUrl: string | null // PUBLIC storage - reference photo
    status: string // 'pending' | 'approved' | 'rejected'
    createdAt: Generated<Date>
}

// Livestock
// Note: PostgreSQL DECIMAL columns are returned as strings by the pg driver
// to preserve precision. Use toDecimal() from currency.ts to work with them.
export interface BatchTable {
    id: Generated<string>
    farmId: string
    batchName: string | null // "Batch A", "NOV-2024-BR-01"
    livestockType: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
    species: string // broiler, layer, catfish, tilapia, angus, boer, merino, etc.
    breedId: string | null // NEW: Reference to breeds table for breed-specific forecasting
    sourceSize: string | null // "day-old", "point-of-lay", "fingerling", "jumbo", "calf", "kid", "lamb", "nuc"
    initialQuantity: number
    currentQuantity: number
    acquisitionDate: Date
    costPerUnit: string // DECIMAL(19,2) - returned as string from pg
    totalCost: string // DECIMAL(19,2) - returned as string from pg
    status: 'active' | 'depleted' | 'sold'
    supplierId: string | null // Where purchased from
    structureId: string | null // Which house/pond/barn/pasture/hive
    targetHarvestDate: Date | null // Planned sale date
    target_weight_g: number | null // Forecasting
    targetPricePerUnit: string | null // DECIMAL(19,2) - User's expected sale price
    notes: string | null
    photos: Array<{ url: string; capturedAt: string; notes?: string }> | null // PUBLIC storage - growth tracking photos
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
    deletedAt: Date | null
}

export interface MortalityTable {
    id: Generated<string>
    batchId: string
    quantity: number
    date: Date
    cause:
        | 'disease'
        | 'predator'
        | 'weather'
        | 'unknown'
        | 'other'
        | 'starvation'
        | 'injury'
        | 'poisoning'
        | 'suffocation'
        | 'culling'
    notes: string | null
    createdAt: Generated<Date>
}

export interface FeedTable {
    id: Generated<string>
    batchId: string
    feedType:
        | 'starter'
        | 'grower'
        | 'finisher'
        | 'layer_mash'
        | 'fish_feed'
        | 'cattle_feed'
        | 'goat_feed'
        | 'sheep_feed'
        | 'hay'
        | 'silage'
        | 'bee_feed'
    brandName: string | null // "Aller Aqua", "Ultima Plus", "Blue Crown"
    bagSizeKg: number | null // 15, 25
    numberOfBags: number | null // How many bags used
    quantityKg: string // DECIMAL(10,2) - returned as string from pg
    cost: string // DECIMAL(19,2) - returned as string from pg
    date: Date
    supplierId: string | null
    inventoryId: string | null // Optional link to feed_inventory for auto-deduction
    notes: string | null
    createdAt: Generated<Date>
}

export interface EggTable {
    id: Generated<string>
    batchId: string
    date: Date
    quantityCollected: number
    quantityBroken: number
    quantitySold: number
    createdAt: Generated<Date>
}

export interface WeightTable {
    id: Generated<string>
    batchId: string
    date: Date
    sampleSize: number
    averageWeightKg: string // DECIMAL(8,3) - returned as string from pg
    minWeightKg: string | null // DECIMAL(8,3) - Smallest in sample
    maxWeightKg: string | null // DECIMAL(8,3) - Largest in sample
    notes: string | null
    createdAt: Generated<Date>
}

export interface VaccinationTable {
    id: Generated<string>
    batchId: string
    vaccineName: string
    dateAdministered: Date
    dosage: string
    nextDueDate: Date | null
    notes: string | null
    certificateUrl: string | null // PRIVATE storage - vaccination certificate PDF
    createdAt: Generated<Date>
}

export interface TreatmentTable {
    id: Generated<string>
    batchId: string
    medicationName: string
    reason: string
    date: Date
    dosage: string
    withdrawalDays: number
    notes: string | null
    prescriptionUrl: string | null // PRIVATE storage - prescription/vet report PDF
    createdAt: Generated<Date>
}

export interface WaterQualityTable {
    id: Generated<string>
    batchId: string
    date: Date
    ph: string // DECIMAL(4,2) - returned as string from pg
    temperatureCelsius: string // DECIMAL(5,2) - returned as string from pg
    dissolvedOxygenMgL: string // DECIMAL(6,2) - returned as string from pg
    ammoniaMgL: string // DECIMAL(6,3) - returned as string from pg
    notes: string | null
    createdAt: Generated<Date>
}

// Financial
export interface SaleTable {
    id: Generated<string>
    farmId: string
    batchId: string | null
    customerId: string | null
    invoiceId: string | null // Link to invoice if generated
    livestockType:
        | 'poultry'
        | 'fish'
        | 'eggs'
        | 'cattle'
        | 'goats'
        | 'sheep'
        | 'honey'
        | 'milk'
        | 'wool'
        | 'beeswax'
        | 'propolis'
        | 'royal_jelly'
        | 'manure'
    quantity: number
    unitPrice: string // DECIMAL(19,2) - returned as string from pg
    totalAmount: string // DECIMAL(19,2) - returned as string from pg
    unitType:
        | 'bird'
        | 'kg'
        | 'crate'
        | 'piece'
        | 'liter'
        | 'head'
        | 'colony'
        | 'fleece'
        | null // How sold
    ageWeeks: number | null // Age at sale (critical for broilers: 5 or 8 weeks)
    averageWeightKg: string | null // DECIMAL(8,3) - Weight at sale
    paymentStatus: 'paid' | 'pending' | 'partial' | null
    paymentMethod:
        | 'cash'
        | 'transfer'
        | 'credit'
        | 'mobile_money'
        | 'check'
        | 'card'
        | null
    date: Date
    notes: string | null
    createdAt: Generated<Date>
}

export interface ExpenseTable {
    id: Generated<string>
    farmId: string
    batchId: string | null
    category:
        | 'feed'
        | 'medicine'
        | 'equipment'
        | 'utilities'
        | 'labor'
        | 'transport'
        | 'livestock' // For chick/fingerling purchases
        | 'livestock_chicken'
        | 'livestock_fish'
        | 'livestock_cattle'
        | 'livestock_goats'
        | 'livestock_sheep'
        | 'livestock_bees'
        | 'maintenance'
        | 'marketing'
        | 'insurance'
        | 'veterinary'
        | 'other'
    amount: string // DECIMAL(19,2) - returned as string from pg
    date: Date
    description: string
    supplierId: string | null
    isRecurring: boolean
    receiptUrl: string | null // PRIVATE storage - receipt photo/PDF
    createdAt: Generated<Date>
}

export interface FeedInventoryTable {
    id: Generated<string>
    farmId: string
    feedType:
        | 'starter'
        | 'grower'
        | 'finisher'
        | 'layer_mash'
        | 'fish_feed'
        | 'cattle_feed'
        | 'goat_feed'
        | 'sheep_feed'
        | 'hay'
        | 'silage'
        | 'bee_feed'
    quantityKg: string // DECIMAL(10,2)
    minThresholdKg: string // DECIMAL(10,2)
    updatedAt: Generated<Date>
}

export interface MedicationInventoryTable {
    id: Generated<string>
    farmId: string
    medicationName: string
    quantity: number
    unit: 'vial' | 'bottle' | 'sachet' | 'ml' | 'g' | 'tablet' | 'kg' | 'liter'
    expiryDate: Date | null
    minThreshold: number
    updatedAt: Generated<Date>
}

// Contacts
export interface CustomerTable {
    id: Generated<string>
    farmId: string
    name: string
    phone: string
    email: string | null
    location: string | null
    customerType:
        | 'individual'
        | 'restaurant'
        | 'retailer'
        | 'wholesaler'
        | 'processor'
        | 'exporter'
        | 'government'
        | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
    deletedAt: Date | null
}

export interface SupplierTable {
    id: Generated<string>
    name: string
    phone: string
    email: string | null
    location: string | null
    products: Array<string> // what they supply
    supplierType:
        | 'hatchery'
        | 'feed_mill'
        | 'pharmacy'
        | 'equipment'
        | 'fingerlings'
        | 'cattle_dealer'
        | 'goat_dealer'
        | 'sheep_dealer'
        | 'bee_supplier'
        | 'other'
        | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
    deletedAt: Date | null
}

// Invoices
export interface InvoiceTable {
    id: Generated<string>
    invoiceNumber: string
    customerId: string
    farmId: string
    totalAmount: string // DECIMAL(19,2) - returned as string from pg
    status: 'unpaid' | 'partial' | 'paid'
    date: Date
    dueDate: Date | null
    paidDate: Date | null
    notes: string | null
    attachments: Array<string> | null // PRIVATE storage - receipts, proofs
    createdAt: Generated<Date>
}

export interface InvoiceItemTable {
    id: Generated<string>
    invoiceId: string
    description: string
    quantity: number
    unitPrice: string // DECIMAL(19,2) - returned as string from pg
    total: string // DECIMAL(19,2) - returned as string from pg
}

// Audit Logs
export interface AuditLogTable {
    id: Generated<string>
    userId: string | null
    userName: string | null // Preserved even if user deleted
    action: string
    entityType: string
    entityId: string
    details: string | null // stored as jsonb but we stringify it
    ipAddress: string | null
    createdAt: Generated<Date>
}

// Growth Standards
// Note: Columns match actual DB schema from migration
export interface GrowthStandardTable {
    id: Generated<string>
    species: string // e.g., 'Broiler', 'Catfish', 'Angus', etc.
    day: number // Day of growth (0, 1, 2, ... 56 for broilers, 0-180 for catfish)
    expected_weight_g: number // Expected weight in grams at this day
    breedId: string | null // NEW: Optional breed-specific growth curve (null = species-level fallback)
}

// Market Prices
// Note: Columns match actual DB schema from migration
export interface MarketPriceTable {
    id: Generated<string>
    species: string // e.g., 'Broiler', 'Catfish'
    size_category: string // e.g., '1.5kg-1.8kg', 'Table Size (600g-1kg)'
    price_per_unit: string // DECIMAL - price per unit (bird or kg depending on species)
    updated_at: Generated<Date>
}

// Notifications
/**
 * User notifications.
 */
export interface NotificationTable {
    /** Unique notification identifier */
    id: Generated<string>
    /** User ID */
    userId: string
    /** Farm ID */
    farmId: string | null
    /** Type of notification */
    type: string // 'lowStock' | 'highMortality' | 'invoiceDue' | 'batchHarvest' | 'taskAssigned' | 'taskCompleted' | 'taskApproved' | 'taskRejected' | 'flaggedCheckIn'
    /** Notification title */
    title: string
    /** Notification message */
    message: string
    /** Read status */
    read: Generated<boolean>
    /** Action URL (optional) */
    actionUrl: string | null
    /** Additional metadata */
    metadata: Record<string, any> | null
    createdAt: Generated<Date>
}

// Tasks (Farm Checklists)
/**
 * Recurring farm tasks for daily/weekly/monthly check-ins.
 */
export interface TaskTable {
    /** Unique task identifier */
    id: Generated<string>
    /** Farm this task belongs to */
    farmId: string
    /** Task title (e.g., "Check Water Lines") */
    title: string
    /** Optional description */
    description: string | null
    /** Task frequency */
    frequency: 'daily' | 'weekly' | 'monthly'
    /** Whether this is a system-generated default task */
    isDefault: Generated<boolean>
    createdAt: Generated<Date>
}

/**
 * Records of task completions by users.
 */
export interface TaskCompletionTable {
    /** Unique completion identifier */
    id: Generated<string>
    /** Task that was completed */
    taskId: string
    /** User who completed the task */
    userId: string
    /** When the task was completed */
    completedAt: Generated<Date>
    /** Period start date (day/week/month start) for deduplication */
    periodStart: Date
}

// Report Configurations
export interface ReportConfigTable {
    /** Unique report configuration identifier */
    id: Generated<string>
    /** User who created this config */
    createdBy: string
    /** Farm this config belongs to */
    farmId: string
    /** Display name for the report */
    name: string
    /** Type of report */
    reportType: 'profit_loss' | 'inventory' | 'sales' | 'feed' | 'egg'
    /** Date range preset */
    dateRangeType: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
    /** Custom start date for custom range */
    customStartDate: Date | null
    /** Custom end date for custom range */
    customEndDate: Date | null
    /** Whether to include charts in output */
    includeCharts: boolean
    /** Whether to include detailed data */
    includeDetails: boolean
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}
// Feed Formulation Tables

/**
 * Master data for feed ingredients with nutritional values.
 */
export interface FeedIngredientTable {
    /** Unique ingredient identifier */
    id: Generated<string>
    /** Ingredient name (e.g., "Corn", "Soybean Meal") */
    name: string
    /** Ingredient category */
    category: 'cereal' | 'protein' | 'fat' | 'mineral' | 'vitamin' | 'additive'
    /** Protein content percentage */
    proteinPercent: string // DECIMAL(5,2)
    /** Energy content in kcal/kg */
    energyKcalKg: number
    /** Fat content percentage */
    fatPercent: string // DECIMAL(5,2)
    /** Fiber content percentage */
    fiberPercent: string // DECIMAL(5,2)
    /** Calcium content percentage */
    calciumPercent: string // DECIMAL(5,2)
    /** Phosphorus content percentage */
    phosphorusPercent: string // DECIMAL(5,2)
    /** Lysine content percentage */
    lysinePercent: string // DECIMAL(5,2)
    /** Methionine content percentage */
    methioninePercent: string // DECIMAL(5,2)
    /** Maximum inclusion percentage in feed */
    maxInclusionPercent: string // DECIMAL(5,2)
    /** Whether ingredient is active/available */
    isActive: Generated<boolean>
    createdAt: Generated<Date>
}

/**
 * Nutritional requirements by species and production stage.
 */
export interface NutritionalRequirementTable {
    /** Unique requirement identifier */
    id: Generated<string>
    /** Species (e.g., "broiler", "layer", "catfish") */
    species: string
    /** Production stage (e.g., "starter", "grower", "finisher") */
    productionStage: string
    /** Minimum protein percentage required */
    minProteinPercent: string // DECIMAL(5,2)
    /** Minimum energy in kcal/kg required */
    minEnergyKcalKg: number
    /** Maximum fiber percentage allowed */
    maxFiberPercent: string // DECIMAL(5,2)
    /** Minimum calcium percentage required */
    minCalciumPercent: string // DECIMAL(5,2)
    /** Minimum phosphorus percentage required */
    minPhosphorusPercent: string // DECIMAL(5,2)
    /** Minimum lysine percentage required */
    minLysinePercent: string // DECIMAL(5,2)
    /** Minimum methionine percentage required */
    minMethioninePercent: string // DECIMAL(5,2)
    createdAt: Generated<Date>
}

/**
 * User-specific ingredient prices with history tracking.
 */
export interface UserIngredientPriceTable {
    /** Unique price record identifier */
    id: Generated<string>
    /** User who owns this price */
    userId: string
    /** Ingredient this price is for */
    ingredientId: string
    /** Current price per kg */
    pricePerKg: string // DECIMAL(19,2)
    /** Whether ingredient is currently available */
    isAvailable: Generated<boolean>
    /** When price was last updated */
    lastUpdated: Generated<Date>
    /** Historical price data as JSON array */
    priceHistory: Array<{ date: string; price: string }>
}

/**
 * Saved feed formulations with ingredients and nutritional analysis.
 */
export interface SavedFormulationTable {
    /** Unique formulation identifier */
    id: Generated<string>
    /** User who created this formulation */
    userId: string
    /** Formulation name */
    name: string
    /** Target species */
    species: string
    /** Target production stage */
    productionStage: string
    /** Batch size in kg */
    batchSizeKg: string // DECIMAL(10,2)
    /** Ingredients with percentages as JSON */
    ingredients: Array<{ ingredientId: string; percentage: number }>
    /** Total cost per kg */
    totalCostPerKg: string // DECIMAL(19,2)
    /** Calculated nutritional values as JSON */
    nutritionalValues: {
        protein: number
        energy: number
        fat: number
        fiber: number
        calcium: number
        phosphorus: number
        lysine: number
        methionine: number
    }
    /** Share code for public formulations */
    shareCode: string | null
    /** Number of times this formulation has been used */
    usageCount: Generated<number>
    /** Mixing instructions for feed preparation */
    mixingInstructions: string | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

/**
 * Formulation usage tracking
 */
export interface FormulationUsageTable {
    /** Unique usage record identifier */
    id: Generated<string>
    /** Formulation that was used */
    formulationId: string
    /** Batch it was used for (optional) */
    batchId: string | null
    /** User who used the formulation */
    userId: string
    /** When it was used */
    usedAt: Generated<Date>
    /** Batch size produced */
    batchSizeKg: string // DECIMAL(10,2)
    /** Total cost of batch */
    totalCost: string // DECIMAL(19,2)
    /** Optional notes */
    notes: string | null
    createdAt: Generated<Date>
}

/**
 * Credit reports for farmers
 */
export interface CreditReportTable {
    /** Unique report identifier */
    id: Generated<string>
    /** User ID */
    userId: string
    /** Farm IDs included in report */
    farmIds: Array<string>
    /** Batch IDs included in report */
    batchIds: Array<string>
    /** Type of report */
    reportType: 'credit_assessment' | 'production_certificate' | 'impact_report'
    /** Report period start date */
    startDate: Date
    /** Report period end date */
    endDate: Date
    /** Validity period in days */
    validityDays: 30 | 60 | 90
    /** Report expiration date */
    expiresAt: Date
    /** Report hash for verification */
    reportHash: string
    /** Digital signature */
    signature: string
    /** Public key for verification */
    publicKey: string
    /** PDF URL */
    pdfUrl: string | null
    /** Metrics snapshot */
    metricsSnapshot: Record<string, any>
    /** Report status */
    status: 'active' | 'expired' | 'revoked'
    /** Custom notes */
    customNotes: string | null
    /** White label branding */
    whiteLabel: boolean
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
    deletedAt: Date | null
}

/**
 * Report access requests
 */
export interface ReportRequestTable {
    /** Unique request identifier */
    id: Generated<string>
    /** Farmer user ID */
    farmerId: string
    /** Type of report requested */
    reportType: string
    /** Requester name */
    requesterName: string
    /** Requester email */
    requesterEmail: string
    /** Requester organization */
    requesterOrganization: string | null
    /** Purpose of request */
    purpose: string
    /** Request status */
    status: 'pending' | 'approved' | 'denied'
    /** When request was made */
    requestedAt: Generated<Date>
    /** When request was responded to */
    respondedAt: Date | null
    /** Response notes */
    responseNotes: string | null
}

/**
 * Report access audit logs
 */
export interface ReportAccessLogTable {
    /** Unique log identifier */
    id: Generated<string>
    /** Report ID that was accessed */
    reportId: string
    /** Type of access */
    accessType: 'view' | 'download' | 'verify'
    /** Accessor IP address */
    accessorIp: string | null
    /** Accessor user agent */
    accessorUserAgent: string | null
    /** Verification result */
    verificationResult: Record<string, any> | null
    /** When access occurred */
    accessedAt: Generated<Date>
}

// ============================================
// Digital Foreman Tables
// ============================================

/**
 * Module-specific permissions for workers
 */
export type ModulePermission =
    | 'feed:log'
    | 'mortality:log'
    | 'weight:log'
    | 'vaccination:log'
    | 'water_quality:log'
    | 'egg:log'
    | 'sales:view'
    | 'task:complete'
    | 'batch:view'

/**
 * Worker employment profiles with wage configuration and permissions
 */
export interface WorkerProfileTable {
    /** Unique profile identifier */
    id: Generated<string>
    /** User ID of the worker */
    userId: string
    /** Farm this profile belongs to */
    farmId: string
    /** Worker's phone number (primary contact) */
    phone: string
    /** Emergency contact name */
    emergencyContactName: string | null
    /** Emergency contact phone */
    emergencyContactPhone: string | null
    /** Employment status */
    employmentStatus: 'active' | 'inactive' | 'terminated'
    /** Employment start date */
    employmentStartDate: Date
    /** Employment end date (for terminated workers) */
    employmentEndDate: Date | null
    /** Wage rate amount */
    wageRateAmount: string // DECIMAL(19,2)
    /** Wage rate type */
    wageRateType: 'hourly' | 'daily' | 'monthly'
    /** Wage currency (ISO 4217) */
    wageCurrency: string
    /** Module-specific permissions */
    permissions: Array<ModulePermission>
    /** Structure IDs the worker manages */
    structureIds: Array<string>
    /** Profile photo URL */
    profilePhotoUrl: string | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

/**
 * Farm geofence configuration for attendance verification
 */
export interface FarmGeofenceTable {
    /** Unique geofence identifier */
    id: Generated<string>
    /** Farm this geofence belongs to */
    farmId: string
    /** Geofence type */
    geofenceType: 'circle' | 'polygon'
    /** Center latitude (for circle) */
    centerLat: string | null // DECIMAL(10,7)
    /** Center longitude (for circle) */
    centerLng: string | null // DECIMAL(10,7)
    /** Radius in meters (for circle) */
    radiusMeters: string | null // DECIMAL(10,2)
    /** Polygon vertices (for polygon) */
    vertices: Array<{ lat: number; lng: number }> | null
    /** Tolerance buffer in meters */
    toleranceMeters: string // DECIMAL(10,2)
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

/**
 * Worker attendance check-in/check-out records
 */
export interface WorkerCheckInTable {
    /** Unique check-in identifier */
    id: Generated<string>
    /** Worker profile ID */
    workerId: string
    /** Farm ID */
    farmId: string
    /** Check-in timestamp */
    checkInTime: Date
    /** Check-in latitude */
    checkInLat: string // DECIMAL(10,7)
    /** Check-in longitude */
    checkInLng: string // DECIMAL(10,7)
    /** Check-in GPS accuracy in meters */
    checkInAccuracy: string | null // DECIMAL(10,2)
    /** Location verification status */
    verificationStatus:
        | 'verified'
        | 'outside_geofence'
        | 'manual'
        | 'pending_sync'
    /** Check-out timestamp */
    checkOutTime: Date | null
    /** Check-out latitude */
    checkOutLat: string | null // DECIMAL(10,7)
    /** Check-out longitude */
    checkOutLng: string | null // DECIMAL(10,7)
    /** Check-out GPS accuracy in meters */
    checkOutAccuracy: string | null // DECIMAL(10,2)
    /** Hours worked (calculated on check-out) */
    hoursWorked: string | null // DECIMAL(5,2)
    /** Sync status for offline check-ins */
    syncStatus: 'synced' | 'pending_sync' | 'sync_failed'
    createdAt: Generated<Date>
}

/**
 * Task assignments to workers
 */
export interface TaskAssignmentTable {
    /** Unique assignment identifier */
    id: Generated<string>
    /** Task ID */
    taskId: string
    /** Worker profile ID */
    workerId: string
    /** User ID who assigned the task */
    assignedBy: string
    /** Farm ID */
    farmId: string
    /** Due date and time */
    dueDate: Date | null
    /** Priority level */
    priority: 'low' | 'medium' | 'high' | 'urgent'
    /** Assignment status */
    status:
        | 'pending'
        | 'in_progress'
        | 'completed'
        | 'pending_approval'
        | 'verified'
        | 'rejected'
    /** Whether photo proof is required */
    requiresPhoto: boolean
    /** Whether supervisor approval is required */
    requiresApproval: boolean
    /** Assignment notes/instructions */
    notes: string | null
    /** Completion timestamp */
    completedAt: Date | null
    /** Worker's completion notes */
    completionNotes: string | null
    /** User ID who approved/rejected */
    approvedBy: string | null
    /** Approval timestamp */
    approvedAt: Date | null
    /** Rejection reason (if rejected) */
    rejectionReason: string | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

/**
 * Photo proof for task completions
 */
export interface TaskPhotoTable {
    /** Unique photo identifier */
    id: Generated<string>
    /** Task assignment ID */
    assignmentId: string
    /** Photo URL (Cloudflare R2) */
    photoUrl: string
    /** Capture latitude */
    capturedLat: string | null // DECIMAL(10,7)
    /** Capture longitude */
    capturedLng: string | null // DECIMAL(10,7)
    /** Capture timestamp */
    capturedAt: Date
    /** Upload timestamp */
    uploadedAt: Generated<Date>
}

/**
 * Payroll period definitions
 */
export interface PayrollPeriodTable {
    /** Unique period identifier */
    id: Generated<string>
    /** Farm ID */
    farmId: string
    /** Period type */
    periodType: 'weekly' | 'bi-weekly' | 'monthly'
    /** Period start date */
    startDate: Date
    /** Period end date */
    endDate: Date
    /** Period status */
    status: 'open' | 'closed'
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

/**
 * Wage payment records
 */
export interface WagePaymentTable {
    /** Unique payment identifier */
    id: Generated<string>
    /** Worker profile ID */
    workerId: string
    /** Payroll period ID */
    payrollPeriodId: string
    /** Farm ID */
    farmId: string
    /** Payment amount */
    amount: string // DECIMAL(19,2)
    /** Payment date */
    paymentDate: Date
    /** Payment method */
    paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money'
    /** Payment notes */
    notes: string | null
    createdAt: Generated<Date>
}

// ============================================
// IoT Sensor Tables
// ============================================

/** Sensor type options */
export type SensorType =
    | 'temperature'
    | 'humidity'
    | 'ammonia'
    | 'dissolved_oxygen'
    | 'ph'
    | 'water_level'
    | 'water_temperature'
    | 'hive_weight'
    | 'hive_temperature'
    | 'hive_humidity'

/** Sensor threshold configuration */
export interface SensorThresholds {
    minValue: number | null
    maxValue: number | null
    warningMinValue: number | null
    warningMaxValue: number | null
}

/** Sensor trend alert configuration */
export interface SensorTrendConfig {
    rateThreshold: number
    rateWindowMinutes: number
}

/**
 * IoT sensors for environmental monitoring
 */
export interface SensorTable {
    id: Generated<string>
    farmId: string
    structureId: string | null
    name: string
    sensorType: SensorType
    apiKeyHash: string
    pollingIntervalMinutes: number
    isActive: Generated<boolean>
    lastReadingAt: Date | null
    lastUsedAt: Date | null
    requestCount: Generated<number>
    thresholds: SensorThresholds | null
    trendConfig: SensorTrendConfig | null
    createdAt: Generated<Date>
    deletedAt: Date | null
}

/**
 * Time-series sensor readings
 */
export interface SensorReadingTable {
    id: Generated<string>
    sensorId: string
    value: string // DECIMAL(12,4)
    recordedAt: Date
    isAnomaly: Generated<boolean>
    metadata: Record<string, any> | null
    createdAt: Generated<Date>
}

/**
 * Aggregated sensor data for historical queries
 */
export interface SensorAggregateTable {
    id: Generated<string>
    sensorId: string
    periodType: 'hourly' | 'daily'
    periodStart: Date
    avgValue: string // DECIMAL(12,4)
    minValue: string // DECIMAL(12,4)
    maxValue: string // DECIMAL(12,4)
    readingCount: number
}

/** Alert types for sensors */
export type SensorAlertType =
    | 'threshold_high'
    | 'threshold_low'
    | 'trend_rising'
    | 'trend_falling'

/**
 * Sensor alert history
 */
export interface SensorAlertTable {
    id: Generated<string>
    sensorId: string
    alertType: SensorAlertType
    severity: 'warning' | 'critical'
    triggerValue: string // DECIMAL(12,4)
    thresholdValue: string // DECIMAL(12,4)
    message: string
    acknowledged: Generated<boolean>
    acknowledgedAt: Date | null
    acknowledgedBy: string | null
    createdAt: Generated<Date>
}

/**
 * Per-sensor alert configuration
 */
export interface SensorAlertConfigTable {
    id: Generated<string>
    sensorId: string
    minThreshold: string | null // DECIMAL(12,4)
    maxThreshold: string | null // DECIMAL(12,4)
    warningMinThreshold: string | null // DECIMAL(12,4)
    warningMaxThreshold: string | null // DECIMAL(12,4)
    rateThreshold: string | null // DECIMAL(12,4)
    rateWindowMinutes: number
    cooldownMinutes: number
    smsEnabled: Generated<boolean>
    emailEnabled: Generated<boolean>
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

// ============================================
// Offline Marketplace Tables
// ============================================

/** Livestock type for marketplace listings */
export type MarketplaceLivestockType =
    | 'poultry'
    | 'fish'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'

/** Privacy fuzzing level for listings */
export type FuzzingLevel = 'low' | 'medium' | 'high'

/** Listing status */
export type ListingStatus = 'active' | 'paused' | 'sold' | 'expired'

/** Contact request status */
export type ContactRequestStatus = 'pending' | 'approved' | 'denied'

/**
 * Marketplace listings for livestock sales
 */
export interface MarketplaceListingTable {
    id: Generated<string>
    sellerId: string
    // Livestock info
    livestockType: MarketplaceLivestockType
    species: string
    quantity: number
    minPrice: string // DECIMAL(19,2)
    maxPrice: string // DECIMAL(19,2)
    currency: string
    // Location (exact, fuzzing applied at display time)
    latitude: string // DECIMAL(10,8)
    longitude: string // DECIMAL(11,8)
    country: string
    region: string
    locality: string
    formattedAddress: string
    // Content
    description: string | null
    photoUrls: Array<string> | null
    // Settings
    fuzzingLevel: FuzzingLevel
    contactPreference: 'app' | 'phone' | 'both'
    // Batch link (optional) - NULL if linked batch was deleted
    batchId: string | null
    // Status and expiration
    status: ListingStatus
    expiresAt: Date
    // Analytics
    viewCount: Generated<number>
    contactCount: Generated<number>
    // Timestamps
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
    deletedAt: Date | null
}

/**
 * Contact requests from buyers to sellers
 */
export interface ListingContactRequestTable {
    id: Generated<string>
    listingId: string
    buyerId: string
    // Request details
    message: string
    contactMethod: 'app' | 'phone' | 'email'
    phoneNumber: string | null
    email: string | null
    // Response
    status: ContactRequestStatus
    responseMessage: string | null
    respondedAt: Date | null
    // Timestamps
    createdAt: Generated<Date>
}

/**
 * Listing view tracking for analytics
 */
export interface ListingViewTable {
    id: Generated<string>
    listingId: string
    viewerId: string | null
    viewerIp: string | null
    viewedAt: Generated<Date>
}

// ============================================
// Extension Worker Mode Tables
// ============================================

/** Countries with ISO codes */
export interface CountryTable {
    code: string
    name: string
    localizedNames: Record<string, string>
    createdAt: Generated<Date>
}

/** Geographic regions (2-level: State/Province -> District) */
export interface RegionTable {
    id: Generated<string>
    countryCode: string
    parentId: string | null
    level: 1 | 2
    name: string
    slug: string
    localizedNames: Record<string, string>
    isActive: Generated<boolean>
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

/** Extension worker district assignments */
export interface UserDistrictTable {
    id: Generated<string>
    userId: string
    districtId: string
    isSupervisor: Generated<boolean>
    assignedAt: Generated<Date>
    assignedBy: string | null
}

/** Access requests from extension workers to farmers */
export interface AccessRequestTable {
    id: Generated<string>
    requesterId: string
    farmId: string
    purpose: string
    requestedDurationDays: number
    status: 'pending' | 'approved' | 'denied' | 'expired'
    responderId: string | null
    rejectionReason: string | null
    respondedAt: Date | null
    expiresAt: Date
    createdAt: Generated<Date>
}

/** Time-limited access grants from farmers to extension workers */
export interface AccessGrantTable {
    id: Generated<string>
    userId: string
    farmId: string
    accessRequestId: string | null
    grantedBy: string | null
    grantedAt: Generated<Date>
    expiresAt: Date
    financialVisibility: Generated<boolean>
    revokedAt: Date | null
    revokedBy: string | null
    revokedReason: string | null
}

/** Species-specific mortality thresholds for health status */
export interface SpeciesThresholdTable {
    id: Generated<string>
    species: string
    regionId: string | null
    amberThreshold: string // DECIMAL
    redThreshold: string // DECIMAL
    createdAt: Generated<Date>
}

/** Extension worker visit records */
export interface VisitRecordTable {
    id: Generated<string>
    agentId: string
    farmId: string
    visitDate: Date
    visitType: 'routine' | 'emergency' | 'follow_up'
    findings: string
    recommendations: string
    attachments: Array<{
        name: string
        url: string
        type: string
        size: number
    }>
    followUpDate: Date | null
    farmerAcknowledged: Generated<boolean>
    farmerAcknowledgedAt: Date | null
    createdAt: Generated<Date>
    updatedAt: Generated<Date>
}

/** Outbreak alerts for disease monitoring */
export interface OutbreakAlertTable {
    id: Generated<string>
    districtId: string
    species: string
    livestockType: string
    severity: 'watch' | 'alert' | 'critical'
    status: 'active' | 'monitoring' | 'resolved' | 'false_positive'
    detectedAt: Generated<Date>
    resolvedAt: Date | null
    notes: string | null
    createdBy: string
    updatedAt: Generated<Date>
    updatedBy: string
}

/** Junction table for farms affected by outbreak alerts */
export interface OutbreakAlertFarmTable {
    alertId: string
    farmId: string
    mortalityRate: string // DECIMAL(5,2)
    reportedAt: Generated<Date>
}
