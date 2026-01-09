import type { Generated } from 'kysely'

// Database interface for Kysely
// Note: Column names use camelCase to match Better Auth expectations
export interface Database {
  users: UserTable
  sessions: SessionTable
  account: AccountTable
  verification: VerificationTable
  farms: FarmTable
  user_farms: UserFarmTable
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
}

// User & Auth - Better Auth tables use camelCase
export interface UserTable {
  id: Generated<string>
  email: string
  password: string | null
  name: string
  role: 'admin' | 'staff'
  emailVerified: Generated<boolean>
  image: string | null
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
  type: 'poultry' | 'fishery' | 'mixed'
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface UserFarmTable {
  userId: string
  farmId: string
}

// Livestock
// Note: PostgreSQL DECIMAL columns are returned as strings by the pg driver
// to preserve precision. Use toDecimal() from currency.ts to work with them.
export interface BatchTable {
  id: Generated<string>
  farmId: string
  livestockType: 'poultry' | 'fish'
  species: string // broiler, layer, catfish, tilapia, etc.
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string // DECIMAL(19,2) - returned as string from pg
  totalCost: string // DECIMAL(19,2) - returned as string from pg
  status: 'active' | 'depleted' | 'sold'
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
  feedType: 'starter' | 'grower' | 'finisher' | 'layer_mash' | 'fish_feed'
  quantityKg: string // DECIMAL(10,2) - returned as string from pg
  cost: string // DECIMAL(19,2) - returned as string from pg
  date: Date
  supplierId: string | null
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
  livestockType: 'poultry' | 'fish' | 'eggs'
  quantity: number
  unitPrice: string // DECIMAL(19,2) - returned as string from pg
  totalAmount: string // DECIMAL(19,2) - returned as string from pg
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
  feedType: 'starter' | 'grower' | 'finisher' | 'layer_mash' | 'fish_feed'
  quantityKg: string // DECIMAL(10,2)
  minThresholdKg: string // DECIMAL(10,2)
  updatedAt: Generated<Date>
}

// Contacts
export interface CustomerTable {
  id: Generated<string>
  name: string
  phone: string
  email: string | null
  location: string | null
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
