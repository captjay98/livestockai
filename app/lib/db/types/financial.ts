import type { Generated } from 'kysely'

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
  deletedAt: Date | null
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
  deletedAt: Date | null
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
  updatedAt: Generated<Date>
  deletedAt: Date | null
}

export interface InvoiceItemTable {
  id: Generated<string>
  invoiceId: string
  description: string
  quantity: number
  unitPrice: string // DECIMAL(19,2) - returned as string from pg
  total: string // DECIMAL(19,2) - returned as string from pg
}
