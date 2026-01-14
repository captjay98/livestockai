import type { Generated } from 'kysely'

// Database interface for Kysely
// Note: Column names use camelCase to match Better Auth expectations
export interface Database {
  users: UserTable
  user_settings: UserSettingsTable
  sessions: SessionTable
  account: AccountTable
  verification: VerificationTable
  farms: FarmTable
  farm_modules: FarmModuleTable
  user_farms: UserFarmTable
  structures: StructureTable
  batches: BatchTable
  mortality_records: MortalityTable
  feed_records: FeedTable
  egg_records: EggTable
  weight_samples: WeightTable
  vaccinations: VaccinationTable
  treatments: TreatmentTable
  water_quality: WaterQualityTable
  sales: SaleTable
  expenses: ExpenseTable
  customers: CustomerTable
  suppliers: SupplierTable
  invoices: InvoiceTable
  invoice_items: InvoiceItemTable
  feed_inventory: FeedInventoryTable
  medication_inventory: MedicationInventoryTable
  audit_logs: AuditLogTable
  growth_standards: GrowthStandardTable
  market_prices: MarketPriceTable
  notifications: NotificationTable
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
  image: string | null
  // Admin plugin fields
  banned: Generated<boolean>
  banReason: string | null
  banExpires: Date | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

// User Settings (Internationalization)
export interface UserSettingsTable {
  id: Generated<string>
  userId: string

  // Currency settings
  currencyCode: string
  currencySymbol: string
  currencyDecimals: number
  currencySymbolPosition: 'before' | 'after'
  thousandSeparator: string
  decimalSeparator: string

  // Date/Time settings
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  firstDayOfWeek: number

  // Unit settings
  weightUnit: 'kg' | 'lbs'
  areaUnit: 'sqm' | 'sqft'
  temperatureUnit: 'celsius' | 'fahrenheit'

  // Preferences
  defaultFarmId: string | null
  language: 'en' | 'ha' | 'yo' | 'ig' | 'fr' | 'pt' | 'sw'
  theme: 'light' | 'dark' | 'system'

  // Alerts
  lowStockThresholdPercent: number
  mortalityAlertPercent: number
  mortalityAlertQuantity: number
  notifications: {
    lowStock: boolean
    highMortality: boolean
    invoiceDue: boolean
    batchHarvest: boolean
  }

  // Business
  defaultPaymentTermsDays: number
  fiscalYearStartMonth: number

  // Dashboard
  dashboardCards: {
    inventory: boolean
    revenue: boolean
    expenses: boolean
    profit: boolean
    mortality: boolean
    feed: boolean
  }

  // Onboarding state
  onboardingCompleted: Generated<boolean>
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
    | 'fishery'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'
  contactPhone: string | null
  notes: string | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
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

export type FarmRole = 'owner' | 'manager' | 'viewer'

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
  capacity: number | null // Max animals
  areaSqm: string | null // DECIMAL(10,2) - Size in square meters
  status: 'active' | 'empty' | 'maintenance'
  notes: string | null
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
  notes: string | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface MortalityTable {
  id: Generated<string>
  batchId: string
  quantity: number
  date: Date
  cause: 'disease' | 'predator' | 'weather' | 'unknown' | 'other'
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
  quantity: number
  unitPrice: string // DECIMAL(19,2) - returned as string from pg
  totalAmount: string // DECIMAL(19,2) - returned as string from pg
  unitType: 'bird' | 'kg' | 'crate' | 'piece' | null // How sold
  ageWeeks: number | null // Age at sale (critical for broilers: 5 or 8 weeks)
  averageWeightKg: string | null // DECIMAL(8,3) - Weight at sale
  paymentStatus: 'paid' | 'pending' | 'partial' | null
  paymentMethod: 'cash' | 'transfer' | 'credit' | null
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
    | 'other'
  amount: string // DECIMAL(19,2) - returned as string from pg
  date: Date
  description: string
  supplierId: string | null
  isRecurring: boolean
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
  unit: 'vial' | 'bottle' | 'sachet' | 'ml' | 'g' | 'tablet'
  expiryDate: Date | null
  minThreshold: number
  updatedAt: Generated<Date>
}

// Contacts
export interface CustomerTable {
  id: Generated<string>
  name: string
  phone: string
  email: string | null
  location: string | null
  customerType: 'individual' | 'restaurant' | 'retailer' | 'wholesaler' | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
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
  notes: string | null
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
export interface NotificationTable {
  id: Generated<string>
  userId: string
  farmId: string | null
  type: string // 'lowStock' | 'highMortality' | 'invoiceDue' | 'batchHarvest'
  title: string
  message: string
  read: Generated<boolean>
  actionUrl: string | null
  metadata: Record<string, any> | null
  createdAt: Generated<Date>
}
