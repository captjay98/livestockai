import type { Generated } from 'kysely'

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
  updatedAt: Generated<Date>
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
  updatedAt: Generated<Date>
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
